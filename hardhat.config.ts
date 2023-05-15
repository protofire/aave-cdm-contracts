import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    mumbai: {
      url: process.env.MUMBAI_URL,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    token: process.env.REPORT_GAS ? "MATIC" : undefined,
    coinmarketcap: process.env.REPORT_GAS
      ? process.env.COIN_MARKET_CAP
      : undefined,
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.ETHERSCAN_API_KEY || "",
    },
  },
};

export default config;
