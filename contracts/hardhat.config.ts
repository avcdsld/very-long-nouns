/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { HardhatUserConfig } from "hardhat/config";
import dotenv from "dotenv";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "./tasks";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10_000,
      },
    },
  },
  networks: {
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: process.env.MNEMONIC
        ? { mnemonic: process.env.MNEMONIC }
        : [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
    },
    hardhat: {
      initialBaseFeePerGas: 0,
    },
    localhost: {
      url: `http://127.0.0.1:8545`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
      initialBaseFeePerGas: 0,
      timeout: 10_000_000,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: "./typechain",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 50,
    src: "contracts",
    coinmarketcap: "7643dfc7-a58f-46af-8314-2db32bdd18ba",
  },
  mocha: {
    timeout: 500_000_000,
  },
};

export default config;
