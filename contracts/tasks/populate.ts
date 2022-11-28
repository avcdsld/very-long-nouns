import { task, types } from "hardhat/config";
// import ImageData from "../../tools/output/image-data-org.json";
import ImageData from "../../tools/output/image-data.json";
import { dataToDescriptorInput } from "./utils";

task("populate", "Populates the descriptor with color palettes and Noun parts")
  .addOptionalParam(
    "nftDescriptor",
    "The `NFTDescriptorV2` contract address",
    // "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Localhost
    "0x727Fc904d40D549e78c37f20ea625E491F2D694b", // Goerli
    types.string
  )
  .addOptionalParam(
    "nounsDescriptor",
    "The `NounsDescriptorV2` contract address",
    // "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // Localhost
    "0xf43EcBf8F0fDfB16946d3Fbb5C118fCaE8DA7d5f", // Goerli
    types.string
  )
  .setAction(
    async ({ nftDescriptor, nounsDescriptor }, { ethers, network }) => {
      const options = {
        gasLimit: network.name === "hardhat" ? 30000000 : undefined,
      };

      const descriptorFactory = await ethers.getContractFactory(
        "NounsDescriptorV2",
        {
          libraries: {
            NFTDescriptorV2: nftDescriptor,
          },
        }
      );
      const descriptorContract = descriptorFactory.attach(nounsDescriptor);

      const { palette, images } = ImageData;
      const bgcolors = ["d5d7e1", "e1d7d5"]; // TODO:
      const { bodies, accessories, heads, glasses } = images;

      const bodiesPage = dataToDescriptorInput(bodies.map(({ data }) => data));
      const headsPage = dataToDescriptorInput(heads.map(({ data }) => data));
      const glassesPage = dataToDescriptorInput(
        glasses.map(({ data }) => data)
      );
      const accessoriesPage = dataToDescriptorInput(
        accessories.map(({ data }) => data)
      );

      await descriptorContract.addManyBackgrounds(bgcolors);
      await descriptorContract.setPalette(0, `0x000000${palette.join("")}`);

      await descriptorContract.addBodies(
        bodiesPage.encodedCompressed,
        bodiesPage.originalLength,
        bodiesPage.itemCount,
        options
      );
      await descriptorContract.addHeads(
        headsPage.encodedCompressed,
        headsPage.originalLength,
        headsPage.itemCount,
        options
      );
      await descriptorContract.addGlasses(
        glassesPage.encodedCompressed,
        glassesPage.originalLength,
        glassesPage.itemCount,
        options
      );
      await descriptorContract.addAccessories(
        accessoriesPage.encodedCompressed,
        accessoriesPage.originalLength,
        accessoriesPage.itemCount,
        options
      );

      console.log("Descriptor populated with palettes and parts.");
    }
  );
