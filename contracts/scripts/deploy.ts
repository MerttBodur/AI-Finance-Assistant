import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("Deploying from:", deployer.address);

  const usdc = await ethers.deployContract("MockUSDC", [], deployer);
  await usdc.waitForDeployment();
  console.log("MockUSDC:", await usdc.getAddress());

  const aave = await ethers.deployContract(
    "MockAave",
    [await usdc.getAddress()],
    deployer,
  );
  await aave.waitForDeployment();
  console.log("MockAave:", await aave.getAddress());

  // Executor is deployer for the MVP demo.
  const vault = await ethers.deployContract(
    "Vault",
    [await usdc.getAddress(), await aave.getAddress(), deployer.address],
    deployer,
  );
  await vault.waitForDeployment();
  console.log("Vault:", await vault.getAddress());

  console.log("\n--- Copy these addresses ---");
  console.log(`USDC_ADDRESS=${await usdc.getAddress()}`);
  console.log(`MOCK_AAVE_ADDRESS=${await aave.getAddress()}`);
  console.log(`VAULT_ADDRESS=${await vault.getAddress()}`);
}

await main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
