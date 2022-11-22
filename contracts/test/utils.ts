import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  NounsDescriptorV2,
  NounsDescriptorV2__factory as NounsDescriptorV2Factory,
  NounsToken,
  NounsToken__factory as NounsTokenFactory,
  NounsArt,
  NounsArt__factory as NounsArtFactory,
  SVGRenderer__factory as SVGRendererFactory,
  Inflator__factory,
  // NounsDAOStorageV2,
} from "../typechain";
// import ImageData from "../files/image-data-v1.json";
// import ImageDataV2 from "../files/image-data-v2.json";
// import ImageDataV2 from "../../tools/output/image-data-org.json";
import ImageDataV2 from "../../tools/output/image-data.json";
import { Block } from "@ethersproject/abstract-provider";
import { deflateRawSync } from "zlib";
import { chunkArray } from "../utils";
import { MAX_QUORUM_VOTES_BPS, MIN_QUORUM_VOTES_BPS } from "./constants";
import { DynamicQuorumParams } from "./types";
import { BigNumber } from "ethers";

export type TestSigners = {
  deployer: SignerWithAddress;
  account0: SignerWithAddress;
  account1: SignerWithAddress;
  account2: SignerWithAddress;
};

export const getSigners = async (): Promise<TestSigners> => {
  const [deployer, account0, account1, account2] = await ethers.getSigners();
  return {
    deployer,
    account0,
    account1,
    account2,
  };
};

export const deployNounsDescriptor = async (
  deployer?: SignerWithAddress
): Promise<NounsDescriptor> => {
  const signer = deployer || (await getSigners()).deployer;
  const nftDescriptorLibraryFactory = await ethers.getContractFactory(
    "NFTDescriptor",
    signer
  );
  const nftDescriptorLibrary = await nftDescriptorLibraryFactory.deploy();
  const nounsDescriptorFactory = new NounsDescriptorFactory(
    {
      "contracts/libs/NFTDescriptor.sol:NFTDescriptor":
        nftDescriptorLibrary.address,
    },
    signer
  );

  return nounsDescriptorFactory.deploy();
};

export const deployNounsDescriptorV2 = async (
  deployer?: SignerWithAddress
): Promise<NounsDescriptorV2> => {
  const signer = deployer || (await getSigners()).deployer;
  const nftDescriptorLibraryFactory = await ethers.getContractFactory(
    "NFTDescriptorV2",
    signer
  );
  const nftDescriptorLibrary = await nftDescriptorLibraryFactory.deploy();
  const nounsDescriptorFactory = new NounsDescriptorV2Factory(
    {
      "contracts/libs/NFTDescriptorV2.sol:NFTDescriptorV2":
        nftDescriptorLibrary.address,
    },
    signer
  );

  const renderer = await new SVGRendererFactory(signer).deploy();
  const descriptor = await nounsDescriptorFactory.deploy(
    ethers.constants.AddressZero,
    renderer.address
  );

  const inflator = await new Inflator__factory(signer).deploy();

  const art = await new NounsArtFactory(signer).deploy(
    descriptor.address,
    inflator.address
  );
  await descriptor.setArt(art.address);

  return descriptor;
};

export const populateDescriptorV2 = async (
  nounsDescriptor: NounsDescriptorV2
): Promise<void> => {
  const { bgcolors, palette, images } = ImageDataV2;
  const { bodies, accessories, heads, glasses } = images;

  const {
    encodedCompressed: bodiesCompressed,
    originalLength: bodiesLength,
    itemCount: bodiesCount,
  } = dataToDescriptorInput(bodies.map(({ data }) => data));
  const {
    encodedCompressed: accessoriesCompressed,
    originalLength: accessoriesLength,
    itemCount: accessoriesCount,
  } = dataToDescriptorInput(accessories.map(({ data }) => data));
  const {
    encodedCompressed: headsCompressed,
    originalLength: headsLength,
    itemCount: headsCount,
  } = dataToDescriptorInput(heads.map(({ data }) => data));
  const {
    encodedCompressed: glassesCompressed,
    originalLength: glassesLength,
    itemCount: glassesCount,
  } = dataToDescriptorInput(glasses.map(({ data }) => data));

  await nounsDescriptor.addManyBackgrounds(bgcolors);
  await nounsDescriptor.setPalette(0, `0x000000${palette.join("")}`);
  await nounsDescriptor.addBodies(bodiesCompressed, bodiesLength, bodiesCount);
  await nounsDescriptor.addAccessories(
    accessoriesCompressed,
    accessoriesLength,
    accessoriesCount
  );

  // TODO: For some reason, only `heads` fails to load.
  // await nounsDescriptor.addHeads(headsCompressed, headsLength, headsCount);
  await nounsDescriptor.addHeads(bodiesCompressed, bodiesLength, bodiesCount);
  // console.log(await nounsDescriptor.heads(0));

  await nounsDescriptor.addGlasses(
    glassesCompressed,
    glassesLength,
    glassesCount
  );
};

/**
 * Return a function used to mint `amount` Nouns on the provided `token`
 * @param token The Nouns ERC721 token
 * @param amount The number of Nouns to mint
 */
export const MintNouns = (
  token: NounsToken,
  burnNoundersTokens = true
): ((amount: number) => Promise<void>) => {
  return async (amount: number): Promise<void> => {
    for (let i = 0; i < amount; i++) {
      await token.mint(0, 0, 0, 0, 0); // TODO:
    }
    if (!burnNoundersTokens) return;

    await setTotalSupply(token, amount);
  };
};

/**
 * Mints or burns tokens to target a total supply. Due to Nounders' rewards tokens may be burned and tokenIds will not be sequential
 */
export const setTotalSupply = async (
  token: NounsToken,
  newTotalSupply: number
): Promise<void> => {
  const totalSupply = (await token.totalSupply()).toNumber();

  if (totalSupply < newTotalSupply) {
    for (let i = 0; i < newTotalSupply - totalSupply; i++) {
      await token.mint(0, 0, 0, 0, 0); // TODO:
    }
    // If Nounder's reward tokens were minted totalSupply will be more than expected, so run setTotalSupply again to burn extra tokens
    await setTotalSupply(token, newTotalSupply);
  }

  if (totalSupply > newTotalSupply) {
    for (let i = newTotalSupply; i < totalSupply; i++) {
      await token.burn(i);
    }
  }
};

// The following adapted from `https://github.com/compound-finance/compound-protocol/blob/master/tests/Utils/Ethereum.js`

const rpc = <T = unknown>({
  method,
  params,
}: {
  method: string;
  params?: unknown[];
}): Promise<T> => {
  return network.provider.send(method, params);
};

export const encodeParameters = (
  types: string[],
  values: unknown[]
): string => {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
};

export const blockByNumber = async (n: number | string): Promise<Block> => {
  return rpc({ method: "eth_getBlockByNumber", params: [n, false] });
};

export const increaseTime = async (seconds: number): Promise<unknown> => {
  await rpc({ method: "evm_increaseTime", params: [seconds] });
  return rpc({ method: "evm_mine" });
};

export const freezeTime = async (seconds: number): Promise<unknown> => {
  await rpc({ method: "evm_increaseTime", params: [-1 * seconds] });
  return rpc({ method: "evm_mine" });
};

export const advanceBlocks = async (blocks: number): Promise<void> => {
  for (let i = 0; i < blocks; i++) {
    await mineBlock();
  }
};

export const blockNumber = async (parse = true): Promise<number> => {
  const result = await rpc<number>({ method: "eth_blockNumber" });
  return parse ? parseInt(result.toString()) : result;
};

export const blockTimestamp = async (
  n: number | string,
  parse = true
): Promise<number | string> => {
  const block = await blockByNumber(n);
  return parse ? parseInt(block.timestamp.toString()) : block.timestamp;
};

export const setNextBlockBaseFee = async (value: BigNumber): Promise<void> => {
  await network.provider.send("hardhat_setNextBlockBaseFeePerGas", [
    value.toHexString(),
  ]);
};

export const setNextBlockTimestamp = async (
  n: number,
  mine = true
): Promise<void> => {
  await rpc({ method: "evm_setNextBlockTimestamp", params: [n] });
  if (mine) await mineBlock();
};

export const minerStop = async (): Promise<void> => {
  await network.provider.send("evm_setAutomine", [false]);
  await network.provider.send("evm_setIntervalMining", [0]);
};

export const minerStart = async (): Promise<void> => {
  await network.provider.send("evm_setAutomine", [true]);
};

export const mineBlock = async (): Promise<void> => {
  await network.provider.send("evm_mine");
};

export const chainId = async (): Promise<number> => {
  return parseInt(await network.provider.send("eth_chainId"), 16);
};

export const address = (n: number): string => {
  return `0x${n.toString(16).padStart(40, "0")}`;
};

export const propStateToString = (stateInt: number): string => {
  const states: string[] = [
    "Pending",
    "Active",
    "Canceled",
    "Defeated",
    "Succeeded",
    "Queued",
    "Expired",
    "Executed",
    "Vetoed",
  ];
  return states[stateInt];
};

function dataToDescriptorInput(data: string[]): {
  encodedCompressed: string;
  originalLength: number;
  itemCount: number;
} {
  const abiEncoded = ethers.utils.defaultAbiCoder.encode(["bytes[]"], [data]);
  const encodedCompressed = `0x${deflateRawSync(
    Buffer.from(abiEncoded.substring(2), "hex")
  ).toString("hex")}`;

  const originalLength = abiEncoded.substring(2).length / 2;
  const itemCount = data.length;

  return {
    encodedCompressed,
    originalLength,
    itemCount,
  };
}
