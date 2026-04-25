import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  solidity: { version: "0.8.28" },
  networks: {
    baseSepolia: {
      type: "http",
      chainType: "op",
      url: configVariable("BASE_SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
});
