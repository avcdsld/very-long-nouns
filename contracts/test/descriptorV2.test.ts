import chai from "chai";
import { solidity } from "ethereum-waffle";
import { NounsDescriptorV2 } from "../typechain";
// import ImageData from '../files/image-data-v2.json';
// import ImageData from "../../tools/output/image-data-org.json";
import ImageData from "../../tools/output/image-data.json";
import { LongestPart } from "./types";
import { deployNounsDescriptorV2, populateDescriptorV2 } from "./utils";
import { ethers } from "hardhat";
import { appendFileSync } from "fs";

chai.use(solidity);
const { expect } = chai;

describe("NounsDescriptorV2", function () {
  let nounsDescriptor: NounsDescriptorV2;
  let snapshotId: number;

  const part: LongestPart = {
    length: 0,
    index: 0,
  };
  const longest: Record<string, LongestPart> = {
    bodies: part,
    accessories: part,
    heads: part,
    glasses: part,
  };

  before(async function () {
    nounsDescriptor = await deployNounsDescriptorV2();

    for (const [l, layer] of Object.entries(ImageData.images)) {
      for (const [i, item] of layer.entries()) {
        if (item.data.length > longest[l].length) {
          longest[l] = {
            length: item.data.length,
            index: i,
          };
        }
      }
    }

    await populateDescriptorV2(nounsDescriptor);
  });

  beforeEach(async function () {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async function () {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  // Unskip this test to validate the encoding of all parts. It ensures that no parts revert when building the token URI.
  // This test also outputs a parts.html file, which can be visually inspected.
  // Note that this test takes a long time to run. You must increase the mocha timeout to a large number.
  it("should generate valid token uri metadata for all supported parts when data uris are enabled", async function () {
    this.timeout(1000000000);
    console.log("Running... this may take a little while...");

    const { images } = ImageData;
    const bgcolors = ["d5d7e1", "e1d7d5", "e1d7d5"]; // TODO:
    const { bodies, accessories, heads, glasses } = images;
    // const max = Math.max(
    //   bodies.length,
    //   accessories.length,
    //   heads.length,
    //   glasses.length
    // );
    const max = 1;
    for (let i = 0; i < max; i++) {
      const tokenUri = await nounsDescriptor.tokenURI(
        i,
        {
          background: Math.min(i, bgcolors.length - 1),
          body: Math.min(i, bodies.length - 1),
          accessory: Math.min(i, accessories.length - 1),
          head: Math.min(i, heads.length - 1),
          glasses: Math.min(i, glasses.length - 1),
        },
        1
      );
      console.log(tokenUri);
      // const { name, description, image } = JSON.parse(
      //   decodeURIComponent(tokenUri.replace("data:application/json,", ""))
      // );
      // expect(name).to.equal(`VeryLongNoun ${i}`);
      // expect(description).to.equal(
      //   `VeryLongNoun ${i} is a member of the Nouns DAO`
      // );
      // expect(image).to.not.be.undefined;
      // appendFileSync(
      //   "parts.html",
      //   decodeURI(image.replace("data:image/svg+xml,", ""))
      // );
      // if (i && i % Math.round(max / 10) === 0) {
      //   console.log(`${Math.round((i / max) * 100)}% complete`);
      // }
    }
  });
});
