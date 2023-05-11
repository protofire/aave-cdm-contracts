import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    mumbai: {
      url: "",
      accounts: [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    token: process.env.REPORT_GAS ? "ETH" : undefined,
    coinmarketcap: process.env.REPORT_GAS
      ? process.env.COIN_MARKET_CAP
      : undefined,
  },
  // etherscan: {
  //   apiKey: {
  //     mumbai: process.env.ETHERSCAN_API_KEY,
  //   },
  // },
};

export default config;
