import { ContractDeployment, ContractName, DeployedContract } from "./types";
import { task } from "hardhat/config";
import promptjs from "prompt";

promptjs.colors = false;
promptjs.message = "> ";
promptjs.delimiter = "";

const NOUNS_ART_NONCE_OFFSET = 4;

task(
  "deploy",
  "Deploys NFTDescriptor, NounsDescriptor, NounsSeeder, and NounsToken"
)
  .addFlag("autoDeploy", "Deploy all contracts without user interaction")
  .setAction(async (args, { ethers }) => {
    const [deployer] = await ethers.getSigners();

    const nonce = await deployer.getTransactionCount();
    const expectedNounsArtAddress = ethers.utils.getContractAddress({
      from: deployer.address,
      nonce: nonce + NOUNS_ART_NONCE_OFFSET,
    });
    const deployment: Record<ContractName, DeployedContract> = {} as Record<
      ContractName,
      DeployedContract
    >;
    const contracts: Record<ContractName, ContractDeployment> = {
      NFTDescriptorV2: {},
      SVGRenderer: {},
      NounsDescriptorV2: {
        args: [expectedNounsArtAddress, () => deployment.SVGRenderer.address],
        libraries: () => ({
          NFTDescriptorV2: deployment.NFTDescriptorV2.address,
        }),
      },
      Inflator: {},
      NounsArt: {
        args: [
          () => deployment.NounsDescriptorV2.address,
          () => deployment.Inflator.address,
        ],
      },
      NounsToken: {
        args: [() => deployment.NounsDescriptorV2.address],
      },
    };

    for (const [name, contract] of Object.entries(contracts)) {
      let gasPrice = await ethers.provider.getGasPrice();
      if (!args.autoDeploy) {
        const gasInGwei = Math.round(
          Number(ethers.utils.formatUnits(gasPrice, "gwei"))
        );

        promptjs.start();

        const result = await promptjs.get([
          {
            properties: {
              gasPrice: {
                type: "integer",
                required: true,
                description: "Enter a gas price (gwei)",
                default: gasInGwei,
              },
            },
          },
        ]);
        gasPrice = ethers.utils.parseUnits(result.gasPrice.toString(), "gwei");
      }

      const factory = await ethers.getContractFactory(name, {
        libraries: contract?.libraries?.(),
      });

      const deploymentGas = await factory.signer.estimateGas(
        factory.getDeployTransaction(
          ...(contract.args?.map((a) => (typeof a === "function" ? a() : a)) ??
            []),
          {
            gasPrice,
          }
        )
      );
      const deploymentCost = deploymentGas.mul(gasPrice);

      console.log(
        `Estimated cost to deploy ${name}: ${ethers.utils.formatUnits(
          deploymentCost,
          "ether"
        )} ETH`
      );

      if (!args.autoDeploy) {
        const result = await promptjs.get([
          {
            properties: {
              confirm: {
                pattern: /^(DEPLOY|SKIP|EXIT)$/,
                description:
                  'Type "DEPLOY" to confirm, "SKIP" to skip this contract, or "EXIT" to exit.',
              },
            },
          },
        ]);
        if (result.operation === "SKIP") {
          console.log(`Skipping ${name} deployment...`);
          continue;
        }
        if (result.operation === "EXIT") {
          console.log("Exiting...");
          return;
        }
      }
      console.log(`Deploying ${name}...`);

      const deployedContract = await factory.deploy(
        ...(contract.args?.map((a) => (typeof a === "function" ? a() : a)) ??
          []),
        {
          gasPrice,
        }
      );

      if (contract.waitForConfirmation) {
        await deployedContract.deployed();
      }

      deployment[name as ContractName] = {
        name,
        instance: deployedContract,
        address: deployedContract.address,
        constructorArguments:
          contract.args?.map((a) => (typeof a === "function" ? a() : a)) ?? [],
        libraries: contract?.libraries?.() ?? {},
      };

      contract.validateDeployment?.();

      console.log(`${name} contract deployed to ${deployedContract.address}`);
    }

    return deployment;
  });
