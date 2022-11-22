import { Result } from "ethers/lib/utils";
import { task, types } from "hardhat/config";

task("mint", "Mints a Noun")
  .addOptionalParam(
    "nounsToken",
    "The `NounsToken` contract address",
    // "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707", // Localhost
    "0x7C86748c2f9B694bE78C8BA9a4FD2335F5FD356c", // Goerli
    types.string
  )
  .setAction(async ({ nounsToken }, { ethers }) => {
    const nftFactory = await ethers.getContractFactory("NounsToken");
    const nftContract = nftFactory.attach(nounsToken);

    const background = 0;
    const body = 0;
    const accessory = 0;
    const head = 0;
    const glasses = 0;

    const receipt = await (
      await nftContract.mint(background, body, accessory, head, glasses)
    ).wait();
    console.log(receipt);
    const nounCreated = receipt.events?.[1];
    const { tokenId } = nounCreated?.args as Result;

    console.log(`Noun minted with ID: ${tokenId.toString()}.`);

    console.log(await nftContract.dataURI(0));
  });
