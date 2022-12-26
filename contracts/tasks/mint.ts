import { Result } from "ethers/lib/utils";
import { task, types } from "hardhat/config";

const preMintSigner = "0xBcd4042DE499D14e55001CcbB24a551F3b954096";
const preMintSignerPrivateKey =
  "0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897";

const getSig = async (to: string) => {
  const { ethers } = require("ethers");
  const PRIVATE_KEY = preMintSignerPrivateKey;
  const wallet = new ethers.Wallet(PRIVATE_KEY);

  const expiredAt = Math.floor(new Date().getTime() / 1000) + 300; // until 5 min later
  const payload = ethers.utils.solidityPack(
    ["address", "uint256"],
    [to, expiredAt]
  );
  const hash = ethers.utils.keccak256(payload);
  const signature = await wallet.signMessage(
    ethers.utils.arrayify(hash),
    preMintSigner
  );
  return { expiredAt, signature };
};

task("mint", "Mints a Noun")
  .addOptionalParam(
    "nounsToken",
    "The `NounsToken` contract address",
    // "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707", // Localhost
    "0xacbd764FCd621592483196a7E61cCcb37e22043A", // Goerli
    types.string
  )
  .setAction(async ({ nounsToken }, { ethers }) => {
    const [deployer] = await ethers.getSigners();

    const nftFactory = await ethers.getContractFactory("NounsToken");
    const nftContract = nftFactory.attach(nounsToken);

    const background = 2;
    const body = 0;
    const accessory = 0;
    const head = 0;
    const glasses = 0;

    await (await nftContract.setPreMintSigner(preMintSigner)).wait();

    const to = deployer.address;
    const { expiredAt, signature } = await getSig(to);

    const value = await nftContract.price();
    const receiptPre = await (
      await nftContract.preMint(
        background,
        body,
        accessory,
        head,
        glasses,
        to,
        expiredAt,
        signature,
        {
          value,
        }
      )
    ).wait();
    console.log(receiptPre.status);

    await (await nftContract.setPublicMintPaused(false)).wait();
    // await (await nftContract.incrementGeneration(10_001_000)).wait();

    const receipt = await (
      await nftContract.mint(background, body + 1, accessory, head, glasses, {
        value,
      })
    ).wait();
    console.log(receipt.status);
    const nounCreated = receipt.events?.[1];
    const { tokenId } = nounCreated?.args as Result;

    // await nftContract.withdraw("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");

    console.log(`Noun minted with ID: ${tokenId.toString()}.`);

    // console.log(await nftContract.dataURI(10000000));
  });
