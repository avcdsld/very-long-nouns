import { task, types } from "hardhat/config";
// import ImageData from "../../tools/output/image-data-org.json";
import ImageData from "../../tools/output/image-data.json";
import { dataToDescriptorInput } from "./utils";

task("populate", "Populates the descriptor with color palettes and Noun parts")
  .addOptionalParam(
    "nftDescriptor",
    "The `NFTDescriptorV2` contract address",
    // "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Localhost
    "0x4863b68a2350e3a34e415801B1046B15CF511452", // Goerli
    types.string
  )
  .addOptionalParam(
    "nounsDescriptor",
    "The `NounsDescriptorV2` contract address",
    // "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // Localhost
    "0xCa6c76F4aD37b82A56d55F083c2A1F1CCAeDDD56", // Goerli
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
      const bgcolors = ["d5d7e1", "e1d7d5", "e1d7d5"]; // TODO:
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
