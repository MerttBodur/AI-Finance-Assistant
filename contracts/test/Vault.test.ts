import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create("hardhatOp");

describe("Vault", function () {
  let vault: any;
  let usdc: any;
  let aave: any;
  let owner: any;
  let executor: any;
  let user: any;
  let attacker: any;

  const DEPOSIT = ethers.parseEther("100");
  const POLICY = {
    maxSingleInvestment: ethers.parseEther("50"),
    monthlyLimit: ethers.parseEther("100"),
    minReserve: ethers.parseEther("10"),
    autoInvestEnabled: true,
    riskLevel: 0,
  };

  beforeEach(async function () {
    [owner, executor, user, attacker] = await ethers.getSigners();

    usdc = await ethers.deployContract("MockUSDC");
    aave = await ethers.deployContract("MockAave", [await usdc.getAddress()]);
    vault = await ethers.deployContract("Vault", [
      await usdc.getAddress(),
      await aave.getAddress(),
      executor.address,
    ]);

    await usdc.mint(user.address, DEPOSIT * 2n);
    await usdc.connect(user).approve(await vault.getAddress(), ethers.MaxUint256);
  });

  it("deposit stores balance", async function () {
    await vault.connect(user).deposit(DEPOSIT);
    expect(await vault.balances(user.address)).to.equal(DEPOSIT);
  });

  it("withdraw reduces balance", async function () {
    await vault.connect(user).deposit(DEPOSIT);
    await vault.connect(user).withdraw(ethers.parseEther("40"));
    expect(await vault.balances(user.address)).to.equal(ethers.parseEther("60"));
  });

  it("autoInvest respects maxSingleInvestment", async function () {
    await vault.connect(user).deposit(DEPOSIT);
    await vault.connect(user).setPolicy(POLICY);
    await expect(
      vault.connect(executor).autoInvest(user.address, ethers.parseEther("51")),
    ).to.be.revertedWith("exceeds maxSingle");
  });

  it("non-executor cannot call autoInvest", async function () {
    await vault.connect(user).deposit(DEPOSIT);
    await vault.connect(user).setPolicy(POLICY);
    await expect(
      vault.connect(attacker).autoInvest(user.address, ethers.parseEther("10")),
    ).to.be.revertedWith("not executor");
  });

  it("pause blocks deposit", async function () {
    await vault.connect(owner).pause();
    await expect(vault.connect(user).deposit(DEPOSIT)).to.be.revertedWithCustomError(
      vault,
      "EnforcedPause",
    );
  });
});
