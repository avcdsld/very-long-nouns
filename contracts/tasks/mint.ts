import { Result } from "ethers/lib/utils";
import { task, types } from "hardhat/config";

task("mint", "Mints a Noun")
  .addOptionalParam(
    "nounsToken",
    "The `NounsToken` contract address",
    "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707", // Localhost
    // "0x6D124Bcc1b7C5ea58F3774D3bBE9FaEecAd019D8", // Goerli
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

    const value = await nftContract.price();
    const receipt = await (
      await nftContract.mint(background, body, accessory, head, glasses, {
        value,
      })
    ).wait();
    console.log(receipt.status);
    const nounCreated = receipt.events?.[1];
    const { tokenId } = nounCreated?.args as Result;

    // await nftContract.withdraw("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");

    console.log(`Noun minted with ID: ${tokenId.toString()}.`);

    // console.log(await nftContract.dataURI(0));
  });
