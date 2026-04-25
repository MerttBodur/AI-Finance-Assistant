# Auto-Invest AI Vault — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working end-to-end DeFi auto-investment bot: user deposits USDC into Vault → Backend Executor polls OpenAI every 2 min → calls autoInvest() on Vault → USDC routed to MockAave — all enforced by smart contract policy rules.

**Architecture:** Dual-write: user wallet (MetaMask + wagmi) writes deposit/policy/pause; autonomous executor server wallet (viem WalletClient) writes autoInvest(). Smart contract enforces all policy limits. AI only recommends — never touches funds.

**Tech Stack:** Solidity 0.8.28, Hardhat 3.4.1, OpenZeppelin v5, Next.js 14 App Router, wagmi v2, viem, RainbowKit, node-cron, OpenAI gpt-4o-mini, Base Sepolia testnet.

**Team:** Person A = contracts track. Person B = frontend + backend tracks. Run in parallel after Task 1.

---

## Track Setup

### Task 1: Repository & Dependency Setup (Both people, 45 min)

**Files:**
- Modify: `contracts/hardhat.config.ts`
- Create: `contracts/.env.example`
- Create: `frontend/` (Next.js scaffold)
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`

#### Person A — Contracts

- [ ] **Step 1.A.1: Install OpenZeppelin in contracts**

```bash
cd contracts
npm install @openzeppelin/contracts
```

Expected: `node_modules/@openzeppelin/contracts/` exists.

- [ ] **Step 1.A.2: Update hardhat.config.ts with network config**

Replace `contracts/hardhat.config.ts` entirely:

```typescript
import { defineConfig } from "hardhat/config";

export default defineConfig({
  solidity: { version: "0.8.28" },
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL ?? "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
});
```

- [ ] **Step 1.A.3: Create contracts directory structure**

```bash
mkdir -p contracts/contracts contracts/test contracts/scripts
```

- [ ] **Step 1.A.4: Create contracts/.env.example**

```
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
```

- [ ] **Step 1.A.5: Commit**

```bash
cd contracts
git add .
git commit -m "chore: setup contracts — OpenZeppelin v5 + network config"
```

#### Person B — Frontend scaffold

- [ ] **Step 1.B.1: Scaffold Next.js frontend**

```bash
cd auto-investor-ai-bot
pnpm create next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint
```

- [ ] **Step 1.B.2: Install wagmi + viem + RainbowKit**

```bash
cd frontend
pnpm add wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

- [ ] **Step 1.B.3: Create frontend directory structure**

```bash
mkdir -p frontend/components/ui frontend/components/vault frontend/hooks frontend/constants/abis frontend/types
```

- [ ] **Step 1.B.4: Create frontend/.env.example**

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_VAULT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_USDC_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_MOCK_AAVE_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_CHAIN_ID=84532
```

Copy to `.env.local` and fill in after deploy.

- [ ] **Step 1.B.5: Init backend**

```bash
cd auto-investor-ai-bot
mkdir -p backend/src
cd backend
pnpm init
pnpm add viem openai node-cron dotenv
pnpm add -D typescript tsx @types/node @types/node-cron
```

- [ ] **Step 1.B.6: Create backend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 1.B.7: Create backend/.env.example**

```
EXECUTOR_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
OPENAI_API_KEY=sk-...
VAULT_ADDRESS=0x0000000000000000000000000000000000000000
USDC_ADDRESS=0x0000000000000000000000000000000000000000
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
ACTIVE_USERS=0x0000000000000000000000000000000000000000
```

- [ ] **Step 1.B.8: Commit**

```bash
cd auto-investor-ai-bot
git add frontend/ backend/
git commit -m "chore: scaffold frontend (Next.js 14) and backend (Node.js executor)"
```

---

## Track A — Smart Contracts (Person A, 2h 30min)

### Task 2: MockUSDC.sol

**Files:**
- Create: `contracts/contracts/MockUSDC.sol`

- [ ] **Step 2.1: Write MockUSDC.sol**

```solidity
// contracts/contracts/MockUSDC.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    // Anyone can mint on testnet — no access control intentional
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

- [ ] **Step 2.2: Compile and verify no errors**

```bash
cd contracts
npx hardhat compile
```

Expected: `Compiled 1 Solidity file successfully`

- [ ] **Step 2.3: Commit**

```bash
git add contracts/contracts/MockUSDC.sol
git commit -m "feat: add MockUSDC ERC20 with public mint"
```

---

### Task 3: MockAave.sol

**Files:**
- Create: `contracts/contracts/MockAave.sol`

- [ ] **Step 3.1: Write MockAave.sol**

```solidity
// contracts/contracts/MockAave.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Simulated yield pool. Holds USDC, 5% APY calculated off-chain for MVP.
contract MockAave {
    IERC20 public usdc;
    mapping(address => uint256) private _deposits;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address usdcAddress) {
        usdc = IERC20(usdcAddress);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "amount = 0");
        usdc.transferFrom(msg.sender, address(this), amount);
        _deposits[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(_deposits[msg.sender] >= amount, "insufficient");
        _deposits[msg.sender] -= amount;
        usdc.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function balanceOf(address user) external view returns (uint256) {
        return _deposits[user];
    }
}
```

- [ ] **Step 3.2: Compile**

```bash
cd contracts
npx hardhat compile
```

Expected: `Compiled 2 Solidity files successfully`

- [ ] **Step 3.3: Commit**

```bash
git add contracts/contracts/MockAave.sol
git commit -m "feat: add MockAave simulated yield pool"
```

---

### Task 4: Vault.sol

**Files:**
- Create: `contracts/contracts/Vault.sol`

- [ ] **Step 4.1: Write Vault.sol**

```solidity
// contracts/contracts/Vault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MockAave.sol";

contract Vault is Ownable, Pausable, ReentrancyGuard {
    struct Policy {
        uint256 maxSingleInvestment; // 18 decimals
        uint256 monthlyLimit;        // 18 decimals
        uint256 minReserve;          // 18 decimals
        bool    autoInvestEnabled;
        uint8   riskLevel;           // 0 = LOW, 1 = MEDIUM
    }

    IERC20    public usdc;
    MockAave  public aave;
    address   public executor;

    mapping(address => uint256) public balances;
    mapping(address => Policy)  public policies;
    mapping(address => uint256) public monthlyInvested;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event AutoInvested(address indexed user, uint256 amount, uint8 riskLevel);
    event PolicyUpdated(address indexed user);

    modifier onlyExecutor() {
        require(msg.sender == executor, "not executor");
        _;
    }

    constructor(address usdcAddress, address aaveAddress, address executorAddress)
        Ownable(msg.sender)
    {
        usdc     = IERC20(usdcAddress);
        aave     = MockAave(aaveAddress);
        executor = executorAddress;
    }

    function deposit(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "amount = 0");
        usdc.transferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external whenNotPaused nonReentrant {
        require(balances[msg.sender] >= amount, "insufficient balance");
        balances[msg.sender] -= amount;
        usdc.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function setPolicy(Policy calldata p) external whenNotPaused {
        policies[msg.sender] = p;
        emit PolicyUpdated(msg.sender);
    }

    function autoInvest(address user, uint256 amount)
        external
        onlyExecutor
        whenNotPaused
        nonReentrant
    {
        Policy storage p = policies[user];
        require(p.autoInvestEnabled,                              "auto-invest disabled");
        require(amount <= p.maxSingleInvestment,                  "exceeds maxSingle");
        require(monthlyInvested[user] + amount <= p.monthlyLimit, "exceeds monthly");
        require(balances[user] >= amount + p.minReserve,          "below minReserve");

        balances[user]        -= amount;
        monthlyInvested[user] += amount;

        usdc.approve(address(aave), amount);
        aave.deposit(amount);

        emit AutoInvested(user, amount, p.riskLevel);
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
```

- [ ] **Step 4.2: Compile**

```bash
cd contracts
npx hardhat compile
```

Expected: `Compiled 3 Solidity files successfully`

- [ ] **Step 4.3: Commit**

```bash
git add contracts/contracts/Vault.sol
git commit -m "feat: Vault.sol — deposit, withdraw, setPolicy, autoInvest, pause"
```

---

### Task 5: Vault Tests

**Files:**
- Create: `contracts/test/Vault.test.ts`

- [ ] **Step 5.1: Install test dependencies**

```bash
cd contracts
npm install --save-dev @nomicfoundation/hardhat-ethers ethers chai @types/chai
```

Add import to top of `contracts/hardhat.config.ts`:
```typescript
import "@nomicfoundation/hardhat-ethers";
```

- [ ] **Step 5.2: Write contracts/test/Vault.test.ts**

```typescript
import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Vault", function () {
  let vault: any;
  let usdc: any;
  let aave: any;
  let owner: SignerWithAddress;
  let executor: SignerWithAddress;
  let user: SignerWithAddress;
  let attacker: SignerWithAddress;

  const DEPOSIT = ethers.parseEther("100");
  const POLICY = {
    maxSingleInvestment: ethers.parseEther("50"),
    monthlyLimit:        ethers.parseEther("100"),
    minReserve:          ethers.parseEther("10"),
    autoInvestEnabled:   true,
    riskLevel:           0,
  };

  beforeEach(async function () {
    [owner, executor, user, attacker] = await ethers.getSigners();

    usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    aave = await (await ethers.getContractFactory("MockAave")).deploy(await usdc.getAddress());
    vault = await (await ethers.getContractFactory("Vault")).deploy(
      await usdc.getAddress(),
      await aave.getAddress(),
      executor.address
    );

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
      vault.connect(executor).autoInvest(user.address, ethers.parseEther("51"))
    ).to.be.revertedWith("exceeds maxSingle");
  });

  it("non-executor cannot call autoInvest", async function () {
    await vault.connect(user).deposit(DEPOSIT);
    await vault.connect(user).setPolicy(POLICY);
    await expect(
      vault.connect(attacker).autoInvest(user.address, ethers.parseEther("10"))
    ).to.be.revertedWith("not executor");
  });

  it("pause blocks deposit", async function () {
    await vault.connect(owner).pause();
    await expect(
      vault.connect(user).deposit(DEPOSIT)
    ).to.be.revertedWithCustomError(vault, "EnforcedPause");
  });
});
```

- [ ] **Step 5.3: Run tests**

```bash
cd contracts
npx hardhat test
```

Expected:
```
Vault
  ✓ deposit stores balance
  ✓ withdraw reduces balance
  ✓ autoInvest respects maxSingleInvestment
  ✓ non-executor cannot call autoInvest
  ✓ pause blocks deposit

5 passing
```

- [ ] **Step 5.4: Commit**

```bash
git add contracts/test/ contracts/hardhat.config.ts
git commit -m "test: Vault — 5 policy enforcement tests passing"
```

---

### Task 6: Deploy Script + Testnet Deploy

**Files:**
- Create: `contracts/scripts/deploy.ts`

- [ ] **Step 6.1: Write contracts/scripts/deploy.ts**

```typescript
import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const usdc = await (await hre.ethers.getContractFactory("MockUSDC")).deploy();
  await usdc.waitForDeployment();
  console.log("MockUSDC:", await usdc.getAddress());

  const aave = await (await hre.ethers.getContractFactory("MockAave")).deploy(await usdc.getAddress());
  await aave.waitForDeployment();
  console.log("MockAave:", await aave.getAddress());

  // executor = deployer for MVP demo
  const vault = await (await hre.ethers.getContractFactory("Vault")).deploy(
    await usdc.getAddress(),
    await aave.getAddress(),
    deployer.address
  );
  await vault.waitForDeployment();
  console.log("Vault:", await vault.getAddress());

  console.log("\n--- Copy these addresses ---");
  console.log(`USDC_ADDRESS=${await usdc.getAddress()}`);
  console.log(`MOCK_AAVE_ADDRESS=${await aave.getAddress()}`);
  console.log(`VAULT_ADDRESS=${await vault.getAddress()}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 6.2: Create contracts/.env (gitignored)**

```
PRIVATE_KEY=0x<your_deployer_private_key>
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/<your_alchemy_key>
```

- [ ] **Step 6.3: Deploy to Base Sepolia**

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network baseSepolia
```

**Save all 3 printed addresses** — needed in Tasks 14.

- [ ] **Step 6.4: Commit**

```bash
git add contracts/scripts/deploy.ts
git commit -m "feat: deploy script — MockUSDC + MockAave + Vault"
```

---

## Track B1 — Frontend (Person B, 2h)

### Task 7: Wagmi Config + Providers

**Files:**
- Create: `frontend/lib/wagmi.ts`
- Create: `frontend/lib/utils.ts`
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 7.1: Write frontend/lib/wagmi.ts**

```typescript
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Auto-Invest AI Vault",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [baseSepolia],
});
```

- [ ] **Step 7.2: Install clsx + tailwind-merge, write frontend/lib/utils.ts**

```bash
cd frontend && pnpm add clsx tailwind-merge
```

```typescript
// frontend/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits } from "viem";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const fmt = (wei: bigint, decimals = 18) => Number(formatUnits(wei, decimals)).toFixed(2);
export const shortAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;
```

- [ ] **Step 7.3: Replace frontend/app/layout.tsx**

```tsx
"use client";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7.4: Commit**

```bash
git add frontend/lib/ frontend/app/layout.tsx
git commit -m "feat: wagmi v2 + RainbowKit providers"
```

---

### Task 8: Types + Constants

**Files:**
- Create: `frontend/types/index.ts`
- Create: `frontend/constants/index.ts`
- Create: `frontend/constants/abis/Vault.ts`
- Create: `frontend/constants/abis/MockUSDC.ts`

- [ ] **Step 8.1: Write frontend/types/index.ts**

```typescript
import type { Address } from "viem";

export type RiskLevel = 0 | 1;

export type VaultPolicy = {
  maxSingleInvestment: bigint;
  monthlyLimit: bigint;
  minReserve: bigint;
  autoInvestEnabled: boolean;
  riskLevel: RiskLevel;
};

export type VaultState = {
  user: Address;
  balance: bigint;
  policy: VaultPolicy;
  monthlyInvested: bigint;
};
```

- [ ] **Step 8.2: Write frontend/constants/index.ts**

```typescript
export const VAULT_ADDRESS =
  (process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? "0x0") as `0x${string}`;
export const USDC_ADDRESS =
  (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "0x0") as `0x${string}`;
export const MOCK_AAVE_ADDRESS =
  (process.env.NEXT_PUBLIC_MOCK_AAVE_ADDRESS ?? "0x0") as `0x${string}`;
export const CHAIN_ID = 84532;
```

- [ ] **Step 8.3: Create ABI stubs (fill after Task 6 deploy)**

```typescript
// frontend/constants/abis/Vault.ts
export const VAULT_ABI = [] as const;
```

```typescript
// frontend/constants/abis/MockUSDC.ts
export const USDC_ABI = [] as const;
```

- [ ] **Step 8.4: Commit**

```bash
git add frontend/types/ frontend/constants/
git commit -m "feat: frontend types + constants stubs"
```

---

### Task 9: Contract Hooks

**Files:**
- Create: `frontend/hooks/use-vault-balance.ts`
- Create: `frontend/hooks/use-vault-policy.ts`
- Create: `frontend/hooks/use-deposit.ts`
- Create: `frontend/hooks/use-set-policy.ts`
- Create: `frontend/hooks/use-emergency-stop.ts`

- [ ] **Step 9.1: Write use-vault-balance.ts**

```typescript
import { useReadContract, useAccount } from "wagmi";
import { VAULT_ABI } from "@/constants/abis/Vault";
import { VAULT_ADDRESS } from "@/constants";

export function useVaultBalance() {
  const { address } = useAccount();
  return useReadContract({
    abi: VAULT_ABI,
    address: VAULT_ADDRESS,
    functionName: "balances",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}
```

- [ ] **Step 9.2: Write use-vault-policy.ts**

```typescript
import { useReadContract, useAccount } from "wagmi";
import { VAULT_ABI } from "@/constants/abis/Vault";
import { VAULT_ADDRESS } from "@/constants";

export function useVaultPolicy() {
  const { address } = useAccount();
  return useReadContract({
    abi: VAULT_ABI,
    address: VAULT_ADDRESS,
    functionName: "policies",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}
```

- [ ] **Step 9.3: Write use-deposit.ts**

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { VAULT_ABI } from "@/constants/abis/Vault";
import { USDC_ABI } from "@/constants/abis/MockUSDC";
import { VAULT_ADDRESS, USDC_ADDRESS } from "@/constants";

export function useDeposit() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = async (amountEth: string) => {
    const amount = parseEther(amountEth);
    await writeContractAsync({ abi: USDC_ABI, address: USDC_ADDRESS, functionName: "approve", args: [VAULT_ADDRESS, amount] });
    await writeContractAsync({ abi: VAULT_ABI, address: VAULT_ADDRESS, functionName: "deposit", args: [amount] });
  };

  return { deposit, isPending, isConfirming, isSuccess };
}
```

- [ ] **Step 9.4: Write use-set-policy.ts**

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { VAULT_ABI } from "@/constants/abis/Vault";
import { VAULT_ADDRESS } from "@/constants";
import type { VaultPolicy } from "@/types";

export function useSetPolicy() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setPolicy = (policy: VaultPolicy) =>
    writeContract({ abi: VAULT_ABI, address: VAULT_ADDRESS, functionName: "setPolicy", args: [policy] });

  return { setPolicy, isPending, isConfirming, isSuccess };
}
```

- [ ] **Step 9.5: Write use-emergency-stop.ts**

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { VAULT_ABI } from "@/constants/abis/Vault";
import { VAULT_ADDRESS } from "@/constants";

export function useEmergencyStop() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const pause   = () => writeContract({ abi: VAULT_ABI, address: VAULT_ADDRESS, functionName: "pause",   args: [] });
  const unpause = () => writeContract({ abi: VAULT_ABI, address: VAULT_ADDRESS, functionName: "unpause", args: [] });

  return { pause, unpause, isPending, isConfirming, isSuccess };
}
```

- [ ] **Step 9.6: Commit**

```bash
git add frontend/hooks/
git commit -m "feat: all wagmi contract hooks"
```

---

### Task 10: Dashboard Page + Components

**Files:**
- Create: `frontend/components/ui/button.tsx`
- Create: `frontend/components/ui/card.tsx`
- Create: `frontend/components/vault/vault-balance.tsx`
- Create: `frontend/components/vault/deposit-form.tsx`
- Create: `frontend/components/vault/policy-form.tsx`
- Create: `frontend/components/vault/emergency-stop.tsx`
- Modify: `frontend/app/page.tsx`
- Create: `frontend/app/dashboard/page.tsx`

- [ ] **Step 10.1: Write components/ui/button.tsx**

```tsx
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

type Variant = "default" | "destructive" | "outline";
const variants: Record<Variant, string> = {
  default:     "bg-yellow-400 text-black hover:bg-yellow-300",
  destructive: "bg-red-600 text-white hover:bg-red-500",
  outline:     "border border-gray-600 text-gray-200 hover:bg-gray-800",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({ variant = "default", loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn("px-4 py-2 rounded font-semibold text-sm transition-colors disabled:opacity-50", variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Loading…" : children}
    </button>
  );
}
```

- [ ] **Step 10.2: Write components/ui/card.tsx**

```tsx
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("bg-gray-900 border border-gray-800 rounded-lg p-4", className)}>
      {children}
    </div>
  );
}
```

- [ ] **Step 10.3: Write components/vault/vault-balance.tsx**

```tsx
"use client";
import { useVaultBalance } from "@/hooks/use-vault-balance";
import { Card } from "@/components/ui/card";
import { fmt } from "@/lib/utils";

export function VaultBalance() {
  const { data: balance, isLoading } = useVaultBalance();
  return (
    <Card>
      <p className="text-gray-400 text-sm">Vault Balance</p>
      <p className="text-2xl font-bold text-yellow-400 mt-1">
        {isLoading ? "…" : `${fmt(balance ?? 0n)} USDC`}
      </p>
    </Card>
  );
}
```

- [ ] **Step 10.4: Write components/vault/deposit-form.tsx**

```tsx
"use client";
import { useState } from "react";
import { useDeposit } from "@/hooks/use-deposit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DepositForm() {
  const [amount, setAmount] = useState("");
  const { deposit, isPending, isConfirming, isSuccess } = useDeposit();

  return (
    <Card>
      <p className="text-gray-400 text-sm mb-2">Deposit USDC</p>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="100"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
        />
        <Button onClick={() => deposit(amount)} loading={isPending || isConfirming}>
          {isSuccess ? "Done!" : "Deposit"}
        </Button>
      </div>
    </Card>
  );
}
```

- [ ] **Step 10.5: Write components/vault/policy-form.tsx**

```tsx
"use client";
import { useState } from "react";
import { useSetPolicy } from "@/hooks/use-set-policy";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseEther } from "viem";

export function PolicyForm() {
  const [maxSingle, setMaxSingle] = useState("50");
  const [monthly, setMonthly]     = useState("100");
  const [reserve, setReserve]     = useState("10");
  const [autoOn, setAutoOn]       = useState(true);
  const [risk, setRisk]           = useState<0 | 1>(0);
  const { setPolicy, isPending, isConfirming, isSuccess } = useSetPolicy();

  const input = "w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm";

  return (
    <Card>
      <p className="text-gray-400 text-sm mb-3">Investment Policy</p>
      <div className="space-y-2">
        <div><label className="text-xs text-gray-500">Max Single (USDC)</label><input className={input} value={maxSingle} onChange={(e) => setMaxSingle(e.target.value)} /></div>
        <div><label className="text-xs text-gray-500">Monthly Limit (USDC)</label><input className={input} value={monthly} onChange={(e) => setMonthly(e.target.value)} /></div>
        <div><label className="text-xs text-gray-500">Min Reserve (USDC)</label><input className={input} value={reserve} onChange={(e) => setReserve(e.target.value)} /></div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="auto" checked={autoOn} onChange={(e) => setAutoOn(e.target.checked)} />
          <label htmlFor="auto" className="text-sm text-gray-300">Auto-Invest Enabled</label>
        </div>
        <div className="flex gap-2">
          {(["LOW", "MEDIUM"] as const).map((label, i) => (
            <button key={label} onClick={() => setRisk(i as 0 | 1)}
              className={`px-3 py-1 rounded text-xs font-semibold ${risk === i ? "bg-yellow-400 text-black" : "bg-gray-800 text-gray-400"}`}>
              {label}
            </button>
          ))}
        </div>
        <Button className="w-full mt-2" loading={isPending || isConfirming}
          onClick={() => setPolicy({ maxSingleInvestment: parseEther(maxSingle), monthlyLimit: parseEther(monthly), minReserve: parseEther(reserve), autoInvestEnabled: autoOn, riskLevel: risk })}>
          {isSuccess ? "Saved!" : "Save Policy"}
        </Button>
      </div>
    </Card>
  );
}
```

- [ ] **Step 10.6: Write components/vault/emergency-stop.tsx**

```tsx
"use client";
import { useEmergencyStop } from "@/hooks/use-emergency-stop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmergencyStop() {
  const { pause, unpause, isPending, isConfirming } = useEmergencyStop();
  return (
    <Card>
      <p className="text-gray-400 text-sm mb-2">Emergency Controls</p>
      <div className="flex gap-2">
        <Button variant="destructive" loading={isPending || isConfirming} onClick={() => pause()}>Pause Vault</Button>
        <Button variant="outline"     loading={isPending || isConfirming} onClick={() => unpause()}>Unpause</Button>
      </div>
    </Card>
  );
}
```

- [ ] **Step 10.7: Write app/dashboard/page.tsx**

```tsx
"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { VaultBalance }   from "@/components/vault/vault-balance";
import { DepositForm }    from "@/components/vault/deposit-form";
import { PolicyForm }     from "@/components/vault/policy-form";
import { EmergencyStop }  from "@/components/vault/emergency-stop";

export default function DashboardPage() {
  const { isConnected } = useAccount();
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-yellow-400">Auto-Invest Vault</h1>
          <ConnectButton />
        </div>
        {!isConnected ? (
          <p className="text-gray-500 text-center mt-20">Connect wallet to continue.</p>
        ) : (
          <>
            <VaultBalance />
            <DepositForm />
            <PolicyForm />
            <EmergencyStop />
          </>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 10.8: Update app/page.tsx**

```tsx
import { redirect } from "next/navigation";
export default function Home() { redirect("/dashboard"); }
```

- [ ] **Step 10.9: Start dev server and visually verify**

```bash
cd frontend && pnpm dev
```

Open `http://localhost:3000`. Expected: redirects to `/dashboard`, ConnectButton visible, no console errors. Connect MetaMask → 4 cards appear.

- [ ] **Step 10.10: Commit**

```bash
git add frontend/
git commit -m "feat: dashboard — balance, deposit, policy, emergency stop"
```

---

## Track B2 — Backend Executor (Person B, 1h 30min)

### Task 11: chain.ts

**Files:**
- Create: `backend/src/types.ts`
- Create: `backend/src/chain.ts`

- [ ] **Step 11.1: Write backend/src/types.ts**

```typescript
import type { Address } from "viem";

export type RiskLevel = 0 | 1;

export type VaultPolicy = {
  maxSingleInvestment: bigint;
  monthlyLimit: bigint;
  minReserve: bigint;
  autoInvestEnabled: boolean;
  riskLevel: RiskLevel;
};

export type VaultState = {
  user: Address;
  balance: bigint;
  policy: VaultPolicy;
  monthlyInvested: bigint;
};

export type AiRecommendation = {
  action: "invest" | "skip";
  amount: bigint;
  token: "USDC";
  protocol: "aave";
  reason: string;
};
```

- [ ] **Step 11.2: Write backend/src/chain.ts**

After deploy, paste the full ABI from `contracts/artifacts/contracts/Vault.sol/Vault.json` into VAULT_ABI.

```typescript
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import type { Address } from "viem";
import type { VaultState } from "./types.js";

// Paste ABI from contracts/artifacts/contracts/Vault.sol/Vault.json after compile
export const VAULT_ABI = [] as const;

const account = privateKeyToAccount(process.env.EXECUTOR_PRIVATE_KEY as `0x${string}`);
const VAULT_ADDRESS = process.env.VAULT_ADDRESS as `0x${string}`;

export const publicClient = createPublicClient({ chain: baseSepolia, transport: http(process.env.BASE_SEPOLIA_RPC_URL) });
export const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http(process.env.BASE_SEPOLIA_RPC_URL) });

export async function getVaultState(user: Address): Promise<VaultState> {
  const [balance, policy, monthlyInvested] = await Promise.all([
    publicClient.readContract({ abi: VAULT_ABI, address: VAULT_ADDRESS, functionName: "balances",        args: [user] }),
    publicClient.readContract({ abi: VAULT_ABI, address: VAULT_ADDRESS, functionName: "policies",        args: [user] }),
    publicClient.readContract({ abi: VAULT_ABI, address: VAULT_ADDRESS, functionName: "monthlyInvested", args: [user] }),
  ]);
  return { user, balance: balance as bigint, policy: policy as VaultState["policy"], monthlyInvested: monthlyInvested as bigint };
}

export async function callAutoInvest(user: Address, amount: bigint): Promise<void> {
  const hash = await walletClient.writeContract({ abi: VAULT_ABI, address: VAULT_ADDRESS, functionName: "autoInvest", args: [user, amount] });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`[chain] autoInvest confirmed: ${hash}`);
}
```

- [ ] **Step 11.3: Commit**

```bash
git add backend/src/types.ts backend/src/chain.ts
git commit -m "feat: backend chain.ts — viem clients + contract calls"
```

---

### Task 12: ai.ts

**Files:**
- Create: `backend/src/ai.ts`

- [ ] **Step 12.1: Write backend/src/ai.ts**

```typescript
import OpenAI from "openai";
import { formatEther, parseEther } from "viem";
import type { VaultState, AiRecommendation } from "./types.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(state: VaultState): string {
  return `You are an autonomous DeFi investment advisor. Decide whether to invest based on these vault conditions:

Balance: ${formatEther(state.balance)} USDC
Min Reserve: ${formatEther(state.policy.minReserve)} USDC
Max Single Investment: ${formatEther(state.policy.maxSingleInvestment)} USDC
Monthly Limit: ${formatEther(state.policy.monthlyLimit)} USDC
Already invested this month: ${formatEther(state.monthlyInvested)} USDC
Risk Level: ${state.policy.riskLevel === 0 ? "LOW" : "MEDIUM"}
Auto-invest enabled: ${state.policy.autoInvestEnabled}

Rules:
1. Never invest if autoInvestEnabled is false
2. amount <= maxSingleInvestment
3. monthlyInvested + amount <= monthlyLimit
4. balance - amount >= minReserve

If conditions met, invest maximum allowed. Respond JSON only:
{ "action": "invest" | "skip", "amount": <number, no decimals>, "token": "USDC", "protocol": "aave", "reason": "<one sentence>" }`;
}

export async function getAiRecommendation(state: VaultState): Promise<AiRecommendation> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: buildPrompt(state) }],
  });
  const content = res.choices[0].message.content;
  if (!content) throw new Error("empty OpenAI response");
  const parsed = JSON.parse(content) as { action: string; amount: number; token: string; protocol: string; reason: string };
  if (parsed.action !== "invest" && parsed.action !== "skip") throw new Error("invalid action");
  return { action: parsed.action, amount: parseEther(String(parsed.amount)), token: "USDC", protocol: "aave", reason: parsed.reason };
}
```

- [ ] **Step 12.2: Commit**

```bash
git add backend/src/ai.ts
git commit -m "feat: ai.ts — OpenAI gpt-4o-mini recommendation engine"
```

---

### Task 13: executor.ts

**Files:**
- Create: `backend/src/executor.ts`
- Modify: `backend/package.json`

- [ ] **Step 13.1: Write backend/src/executor.ts**

```typescript
import "dotenv/config";
import cron from "node-cron";
import type { Address } from "viem";
import { getVaultState, callAutoInvest } from "./chain.js";
import { getAiRecommendation } from "./ai.js";

// For MVP: set ACTIVE_USERS in .env as comma-separated addresses
const ACTIVE_USERS: Address[] = (process.env.ACTIVE_USERS ?? "")
  .split(",")
  .filter(Boolean)
  .map((a) => a.trim() as Address);

async function runCycle(): Promise<void> {
  console.log(`[executor] cycle start — ${new Date().toISOString()}`);
  for (const user of ACTIVE_USERS) {
    try {
      const state = await getVaultState(user);
      if (!state.policy.autoInvestEnabled) {
        console.log(`[executor] ${user}: auto-invest disabled, skip`);
        continue;
      }
      const rec = await getAiRecommendation(state);
      console.log(`[executor] ${user}: AI → ${rec.action} ${rec.amount} USDC — ${rec.reason}`);
      if (rec.action === "invest" && rec.amount > 0n) {
        await callAutoInvest(user, rec.amount);
      }
    } catch (err) {
      console.error(`[executor] ${user}: error —`, err);
    }
  }
  console.log("[executor] cycle done");
}

// Every 2 minutes for demo. Change to '0 0 1 * *' for monthly in prod.
cron.schedule("*/2 * * * *", runCycle);
console.log("[executor] started — cron every 2 min");
```

- [ ] **Step 13.2: Add start script to backend/package.json**

Add to scripts:
```json
{
  "scripts": {
    "start": "tsx src/executor.ts",
    "dev":   "tsx watch src/executor.ts"
  }
}
```

- [ ] **Step 13.3: Commit**

```bash
git add backend/src/executor.ts backend/package.json
git commit -m "feat: executor.ts — cron loop, AI recommendation, autoInvest tx"
```

---

## Track C — Integration (Both People, 2h)

### Task 14: Wire ABIs + Addresses

- [ ] **Step 14.1: Copy Vault ABI from artifacts**

```bash
cd contracts && npx hardhat compile
```

Open `contracts/artifacts/contracts/Vault.sol/Vault.json`, copy the `abi` array.

Paste into:
- `frontend/constants/abis/Vault.ts` → `export const VAULT_ABI = [ /* paste */ ] as const`
- `backend/src/chain.ts` → `export const VAULT_ABI = [ /* paste */ ] as const`

Repeat for MockUSDC → `frontend/constants/abis/MockUSDC.ts`.

- [ ] **Step 14.2: Fill frontend/.env.local**

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<from cloud.walletconnect.com>
NEXT_PUBLIC_VAULT_ADDRESS=<from Task 6 deploy output>
NEXT_PUBLIC_USDC_ADDRESS=<from Task 6 deploy output>
NEXT_PUBLIC_MOCK_AAVE_ADDRESS=<from Task 6 deploy output>
NEXT_PUBLIC_CHAIN_ID=84532
```

- [ ] **Step 14.3: Fill backend/.env**

```
EXECUTOR_PRIVATE_KEY=<same private key used as executor at deploy>
OPENAI_API_KEY=sk-...
VAULT_ADDRESS=<from Task 6>
USDC_ADDRESS=<from Task 6>
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/<key>
ACTIVE_USERS=<your MetaMask address>
```

- [ ] **Step 14.4: Commit (no .env files)**

```bash
git add frontend/constants/abis/ backend/src/chain.ts
git commit -m "feat: wire ABIs — integration ready"
```

---

### Task 15: End-to-End Demo Test

- [ ] **Step 15.1: Mint test USDC**

On [basescan.org](https://basescan.org) → find MockUSDC address → Write Contract → connect wallet → `mint(yourAddress, 100000000000000000000)`

- [ ] **Step 15.2: Test deposit via frontend**

```bash
cd frontend && pnpm dev
```

Open `localhost:3000` → Connect MetaMask (Base Sepolia) → Deposit 100 → confirm 2 txs (approve + deposit) → balance card shows 100.00 USDC.

- [ ] **Step 15.3: Set policy via frontend**

maxSingle=50, monthly=100, reserve=10, autoInvest=ON, risk=LOW → Save → confirm tx.

- [ ] **Step 15.4: Start executor**

```bash
cd backend && pnpm dev
```

Wait up to 2 minutes. Expected console:
```
[executor] started — cron every 2 min
[executor] cycle start — 2026-04-25T...
[executor] 0xYOUR: AI → invest 50000000000000000000 USDC — Sufficient balance above reserve
[executor] 0xYOUR: autoInvest confirmed: 0xHASH
[executor] cycle done
```

- [ ] **Step 15.5: Verify on block explorer**

Check Vault address on basescan → Events → `AutoInvested` event visible.

- [ ] **Step 15.6: Test emergency stop**

Dashboard → Pause Vault → confirm → wait for next cron tick.
Expected executor error: `ContractFunctionExecutionError: EnforcedPause`

- [ ] **Step 15.7: Final commit + push**

```bash
git add .
git commit -m "chore: end-to-end integration verified on Base Sepolia"
git push origin main
```

---

## Scope Cuts (ordered — cut from bottom up if time runs short)

| # | Cut | Time saved |
|---|-----|-----------|
| 1 | Skip `tx-history` component entirely | 30 min |
| 2 | Remove `monthlyInvested` tracking, enforce only `maxSingleInvestment` | 20 min |
| 3 | Demo only LOW risk, skip MEDIUM branch logic | 15 min |
| 4 | Hardcode policy in deploy script, skip `policy-form` component | 30 min |

---

## Demo Script (2 min)

1. Connect MetaMask → Base Sepolia
2. Mint 100 USDC → deposit into Vault → balance updates
3. Set policy: maxSingle=50, autoInvest=ON
4. Show executor terminal — "AI runs autonomously every 2 minutes"
5. Cron fires → AI recommendation logged → tx hash confirmed
6. Basescan: `AutoInvested` event on-chain
7. Emergency Stop → pause tx → next cron blocked at contract level
8. **"AI önerir, smart contract sınırlar, blockchain uygular."**
