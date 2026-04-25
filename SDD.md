# Auto-Invest AI Vault — Software Design Document

---

## 1. Executive Summary

Auto-Invest AI Vault is an autonomous Web3 investment bot: it monitors a user's on-chain vault, calls OpenAI to decide how much to invest, and routes USDC to a Mock Aave yield pool — all within policy limits the user sets once via a dashboard. The core technical challenge is a **dual-write architecture**: the user writes to the Vault from MetaMask (deposits, policy, emergency stop), while an autonomous Node.js executor holds a separate server wallet and writes `autoInvest()` transactions triggered by a cron job and AI recommendation.

**Stack**: Hardhat 3 (already initialized) + Next.js 14 (App Router) + wagmi v2/viem/RainbowKit + Node.js cron executor. Hardhat 3 is kept because it is already set up and the team knows it; a fresh project would use Foundry for faster test iteration. The Node.js executor is architecturally justified as an autonomous agent process — it is not a web API and does not expose HTTP endpoints.

**Starting point**: `contracts/` is initialized with Hardhat 3.4.1 and Solidity 0.8.28. Everything else is greenfield.

---

## 2. Tech Stack & Architecture

**Tier: C — AI dApp** (on-chain trust layer + AI-driven investment decisions). 2 people, 8 hours. Scope is locked to what can demo end-to-end.

```
- Framework:       Next.js 14, App Router, TypeScript
- Styling:         Tailwind CSS v3
- Smart Contracts: Hardhat 3.4.1, Solidity 0.8.28, OpenZeppelin v5
- Web3 Layer:      wagmi v2, viem, RainbowKit  (frontend)
                   viem WalletClient           (executor — server-side only)
- AI:              OpenAI API, gpt-4o-mini (cost+speed), server-side only
- Automation:      node-cron (executor trigger)
- Deployment:      Vercel (frontend) + Base Sepolia (contracts)
- Package Manager: pnpm
```

**Data flow:**

```
[Browser + MetaMask]
        │
        │  wagmi v2 (deposit / withdraw / setPolicy / pause)
        ▼
[Next.js Frontend] ──wagmi read──► [Vault.sol] ──► [MockAave.sol]
                                        ▲
                                        │  viem WalletClient.writeContract(autoInvest)
                                   [Node.js Executor]
                                        │
                                   [node-cron]  (every 2 min for demo; monthly in prod)
                                        │
                                   [OpenAI API]  →  { action, amount, token, protocol }
```

**Key constraint:** The executor wallet address is registered as `executor` in Vault.sol at deploy time. The `onlyExecutor` modifier blocks any other address from calling `autoInvest()`. User funds can never be moved without passing Vault policy checks.

---

## 3. Project Folder Structure

```
auto-investor-ai-bot/
│
├── contracts/                        # Hardhat 3 project — already initialized
│   ├── contracts/
│   │   ├── Vault.sol                 # Core vault: deposit, withdraw, autoInvest, policy
│   │   ├── MockUSDC.sol              # Mintable ERC20 test token
│   │   └── MockAave.sol              # Simulated yield pool (deposit/withdraw + interest)
│   ├── test/
│   │   └── Vault.test.ts             # Hardhat 3 native TS tests
│   ├── scripts/
│   │   └── deploy.ts                 # Deploy all three contracts + print addresses
│   ├── hardhat.config.ts             # Already exists (Solidity 0.8.28)
│   ├── package.json                  # Already exists
│   └── .env                          # PRIVATE_KEY, BASE_SEPOLIA_RPC_URL — gitignored
│
├── frontend/                         # Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx                # Root layout: WagmiProvider + RainbowKit + QueryClient
│   │   ├── page.tsx                  # Redirect → /dashboard
│   │   └── dashboard/
│   │       └── page.tsx              # Main dashboard page
│   ├── components/
│   │   ├── ui/                       # Stateless primitives (no hooks, props-only)
│   │   │   ├── button.tsx
│   │   │   ├── badge.tsx
│   │   │   └── card.tsx
│   │   └── vault/                    # Feature components (use hooks, scoped to vault domain)
│   │       ├── vault-balance.tsx     # Shows USDC balance + invested amount
│   │       ├── risk-selector.tsx     # LOW / MEDIUM toggle
│   │       ├── policy-form.tsx       # maxSingleInvestment, monthlyLimit, minReserve inputs
│   │       ├── deposit-form.tsx      # Deposit USDC input + approve + deposit buttons
│   │       ├── tx-history.tsx        # List of AutoInvest events from contract logs
│   │       └── emergency-stop.tsx    # Pause / unpause button (owner only)
│   ├── hooks/
│   │   ├── use-vault-balance.ts      # useReadContract: balances, investedAmount
│   │   ├── use-vault-policy.ts       # useReadContract: getPolicy
│   │   ├── use-deposit.ts            # useWriteContract: approve + deposit
│   │   ├── use-set-policy.ts         # useWriteContract: setPolicy
│   │   └── use-emergency-stop.ts     # useWriteContract: pause / unpause
│   ├── lib/
│   │   ├── wagmi.ts                  # wagmiConfig singleton (RainbowKit getDefaultConfig)
│   │   └── utils.ts                  # cn(), formatUnits wrapper, shortAddress
│   ├── constants/
│   │   ├── abis/
│   │   │   ├── Vault.ts              # export const VAULT_ABI = [...] as const
│   │   │   ├── MockUSDC.ts
│   │   │   └── MockAave.ts
│   │   └── index.ts                  # VAULT_ADDRESS, USDC_ADDRESS, AAVE_ADDRESS, CHAIN_ID
│   ├── types/
│   │   └── index.ts                  # AiRecommendation, VaultPolicy, RiskLevel
│   ├── .env.local                    # Local secrets — gitignored
│   ├── .env.example                  # Committed template
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
└── backend/                          # Autonomous executor — NOT a web API
    ├── src/
    │   ├── executor.ts               # Entry: cron job → AI → autoInvest tx
    │   ├── ai.ts                     # OpenAI client: buildPrompt + parseRecommendation
    │   ├── chain.ts                  # viem publicClient + walletClient (executor wallet)
    │   └── types.ts                  # AiRecommendation, VaultState types
    ├── .env                          # EXECUTOR_PRIVATE_KEY, OPENAI_API_KEY — gitignored
    ├── .env.example
    ├── package.json
    └── tsconfig.json
```

> **Note on `ai/`:** Merged into `backend/src/ai.ts`. A separate directory adds indirection without benefit at this scope.

---

## 4. Smart Contract Structure

### Contracts

**`Vault.sol`** — core contract. Inherits `Ownable`, `Pausable`, `ReentrancyGuard` from OpenZeppelin.

```solidity
struct Policy {
    uint256 maxSingleInvestment;  // max USDC per autoInvest call (18 decimals)
    uint256 monthlyLimit;         // max USDC auto-invested this month
    uint256 minReserve;           // USDC that must stay in vault
    bool    autoInvestEnabled;
    uint8   riskLevel;            // 0 = LOW, 1 = MEDIUM
}

// State
mapping(address => uint256) public balances;        // user USDC deposits
mapping(address => Policy)  public policies;        // user-set policy
mapping(address => uint256) public monthlyInvested; // reset each month (manual for MVP)
address public executor;                             // set at deploy, onlyExecutor modifier
IERC20    public usdc;
IMockAave public aave;

// User-callable (whenNotPaused)
function deposit(uint256 amount) external
function withdraw(uint256 amount) external
function setPolicy(Policy calldata p) external

// Executor-only (whenNotPaused)
function autoInvest(address user, uint256 amount) external onlyExecutor

// Owner-only
function pause() external onlyOwner
function unpause() external onlyOwner

// Events
event Deposited(address indexed user, uint256 amount);
event Withdrawn(address indexed user, uint256 amount);
event AutoInvested(address indexed user, uint256 amount, uint8 riskLevel);
event PolicyUpdated(address indexed user);
```

**`MockUSDC.sol`** — minimal ERC20 with public `mint()` for testnet. Inherits `ERC20`.

**`MockAave.sol`** — simulated yield pool. Holds USDC deposits, adds 5% simulated APY (linear for MVP, calculated off-chain). Key functions: `deposit(uint256)`, `withdraw(uint256)`, `balanceOf(address)`.

### Tests (`contracts/test/Vault.test.ts`)

Cover: deposit stores balance, withdraw respects minReserve, autoInvest respects maxSingleInvestment, non-executor cannot call autoInvest, pause blocks all state-changing calls.

### Deploy Script (`contracts/scripts/deploy.ts`)

Deploys MockUSDC → MockAave → Vault (passing usdc/aave/executor addresses). Prints all three addresses to stdout for manual copy into `frontend/constants/index.ts` and `backend/.env`.

### Hardhat config additions needed

```typescript
// contracts/hardhat.config.ts — add networks + install OpenZeppelin
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

---

## 5. Component Architecture

**Tier A — UI Primitives** (`components/ui/`): stateless, no hooks, all data via props.
- `Button` — variant: `default | destructive | outline`
- `Badge` — variant: `low | medium | success | danger`
- `Card` — wrapper with consistent padding/border

**Tier B — Feature Components** (`components/vault/`): use hooks, scoped to vault domain. Never import other feature components — shared logic lives in `hooks/`.

**Page** (`app/dashboard/page.tsx`): assembles feature components. Handles top-level wallet-connected guard. No inline JSX beyond layout.

```
app/dashboard/page.tsx
  └── components/vault/
        ├── vault-balance.tsx      (uses: use-vault-balance)
        ├── deposit-form.tsx       (uses: use-deposit)
        ├── risk-selector.tsx      (uses: use-set-policy)
        ├── policy-form.tsx        (uses: use-vault-policy, use-set-policy)
        ├── tx-history.tsx         (uses: useWatchContractEvent or getLogs via viem)
        └── emergency-stop.tsx     (uses: use-emergency-stop)
```

---

## 6. State Management

**wagmi hooks handle all on-chain state.** `useState` for UI-only state (form inputs, modal open/close). No Zustand — the app has no cross-component shared client state that wagmi's query cache doesn't already cover.

```typescript
// Pattern for all contract reads
const { data: balance } = useReadContract({
  abi: VAULT_ABI,
  address: VAULT_ADDRESS,
  functionName: 'balances',
  args: [address],
  query: { enabled: !!address },
})

// Pattern for all contract writes — always expose all three states to UI
const { writeContract, data: hash, isPending } = useWriteContract()
const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
```

---

## 7. Web3 & Wallet Integration

```typescript
// frontend/lib/wagmi.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'Auto-Invest AI Vault',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [baseSepolia],
})
```

```typescript
// frontend/app/layout.tsx — provider order matters
<WagmiProvider config={wagmiConfig}>
  <QueryClientProvider client={queryClient}>
    <RainbowKitProvider>
      {children}
    </RainbowKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

```typescript
// frontend/constants/index.ts
export const VAULT_ADDRESS     = '0x...' as `0x${string}`
export const USDC_ADDRESS      = '0x...' as `0x${string}`
export const MOCK_AAVE_ADDRESS = '0x...' as `0x${string}`
export const CHAIN_ID          = 84532   // Base Sepolia
```

**ABI export workflow:** After `npx hardhat compile`, copy from `contracts/artifacts/contracts/Vault.sol/Vault.json` → `frontend/constants/abis/Vault.ts` as `export const VAULT_ABI = [...] as const`.

---

## 8. Backend Executor Architecture

The executor is an autonomous Node.js process. It does **not** expose HTTP endpoints. It holds the executor wallet private key and is the only component authorized to call `autoInvest()`.

```typescript
// backend/src/executor.ts  (simplified flow)
import cron from 'node-cron'
import { getAiRecommendation } from './ai'
import { autoInvest, getVaultState } from './chain'

// For demo: every 2 minutes. Production: '0 0 1 * *' (monthly)
cron.schedule('*/2 * * * *', async () => {
  const users = await getActiveUsers()
  for (const user of users) {
    const state = await getVaultState(user)
    const rec   = await getAiRecommendation(state)
    if (rec.action === 'invest' && rec.amount > 0n) {
      await autoInvest(user, rec.amount)
    }
  }
})
```

```typescript
// backend/src/ai.ts
import OpenAI from 'openai'

export async function getAiRecommendation(state: VaultState): Promise<AiRecommendation> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: buildPrompt(state) }],
  })
  return parseRecommendation(res.choices[0].message.content!)
}
// Returns: { action: 'invest' | 'skip', amount: bigint, token: 'USDC', protocol: 'aave', reason: string }
```

```typescript
// backend/src/chain.ts
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

const account = privateKeyToAccount(process.env.EXECUTOR_PRIVATE_KEY as `0x${string}`)
export const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() })
export const publicClient = createPublicClient({ chain: baseSepolia, transport: http() })

export async function autoInvest(user: `0x${string}`, amount: bigint) {
  const hash = await walletClient.writeContract({
    abi: VAULT_ABI, address: VAULT_ADDRESS,
    functionName: 'autoInvest', args: [user, amount],
  })
  await publicClient.waitForTransactionReceipt({ hash })
}
```

---

## 9. Styling Conventions

Tailwind only. No CSS modules. No inline `style` props except for JS-derived pixel values.

```typescript
// frontend/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
```

Color palette and risk-level colors defined in `tailwind.config.ts` under `theme.extend.colors`. Never write hex values in className strings.

---

## 10. Environment Variables

### `contracts/.env` (gitignored)
```
PRIVATE_KEY=0x...
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### `frontend/.env.example` (committed — fill `.env.local` locally)
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_MOCK_AAVE_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=84532
```

### `backend/.env.example` (committed — fill `.env` locally)
```
EXECUTOR_PRIVATE_KEY=0x...
OPENAI_API_KEY=sk-...
VAULT_ADDRESS=0x...
USDC_ADDRESS=0x...
BASE_SEPOLIA_RPC_URL=https://...
```

| Variable | Client-safe? | Used by |
|----------|-------------|---------|
| `NEXT_PUBLIC_*` | ✅ yes | frontend |
| `OPENAI_API_KEY` | ❌ server only | backend |
| `EXECUTOR_PRIVATE_KEY` | ❌ server only | backend |
| `PRIVATE_KEY` | ❌ server only | contracts deploy |

---

## 11. Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| React components | PascalCase `.tsx` | `VaultBalance.tsx` |
| Custom hooks | kebab-case, `use-` prefix, `.ts` | `use-vault-balance.ts` |
| Utility functions | camelCase | `formatUnits`, `shortAddress` |
| Constants (values) | SCREAMING_SNAKE_CASE | `VAULT_ADDRESS`, `CHAIN_ID` |
| Solidity contracts | PascalCase, filename = contract name | `Vault.sol` → `contract Vault` |
| Solidity test files | `.test.ts` (Hardhat 3 convention) | `Vault.test.ts` |
| TypeScript types | PascalCase, no `I` prefix | `type VaultPolicy`, `type AiRecommendation` |
| viem addresses | `` `0x${string}` `` type | never plain `string` for addresses |

---

## 12. TypeScript Standards

- `"strict": true` in every `tsconfig.json`. Non-negotiable.
- No `any`. Use `unknown` with type guards at system boundaries (OpenAI response parsing).
- `Address` / `Hex` / `Hash` from `viem` for all on-chain values — never plain `string`.
- `as const` required on all ABI arrays for wagmi type inference.
- Explicit return types on all hooks and `ai.ts`/`chain.ts` exports.
- Use 18 decimals for MockUSDC (simplifies bigint math; note: real USDC is 6).

```typescript
// types/index.ts
import type { Address } from 'viem'

export type RiskLevel = 0 | 1  // 0 = LOW, 1 = MEDIUM

export type VaultPolicy = {
  maxSingleInvestment: bigint
  monthlyLimit: bigint
  minReserve: bigint
  autoInvestEnabled: boolean
  riskLevel: RiskLevel
}

export type AiRecommendation = {
  action: 'invest' | 'skip'
  amount: bigint
  token: 'USDC'
  protocol: 'aave'
  reason: string
}

export type VaultState = {
  user: Address
  balance: bigint
  policy: VaultPolicy
  monthlyInvested: bigint
}
```

---

## 13. Phase Roadmap

8-hour window, 2 people. 7h planned work + 1h buffer.

| # | Focus | Person A | Person B | Duration | Clock |
|---|-------|----------|----------|----------|-------|
| **1** | Setup | Install OZ in contracts (`npm i @openzeppelin/contracts`), create `contracts/contracts/` + `test/` + `scripts/` dirs, update hardhat.config.ts with networks | `pnpm create next-app frontend` (App Router + TS + Tailwind), install wagmi/viem/RainbowKit; init `backend/` with pnpm + tsx + node-cron + openai | **45 min** | 0:00–0:45 |
| **2 (Parallel)** | Contracts // Frontend+Backend shells | Write MockUSDC.sol, MockAave.sol, Vault.sol with full policy enforcement + onlyExecutor + Pausable + ReentrancyGuard | Root layout with all providers, dashboard page with hardcoded stub data, all vault components rendering UI, backend executor skeleton (cron wired, AI + chain stubs) | **2:00 h** | 0:45–2:45 |
| **3 (Parallel)** | Tests + deploy // AI + executor | Write Vault.test.ts (5 key cases), run tests green, deploy to Base Sepolia, copy 3 addresses to stdout | Implement `ai.ts` (real OpenAI call + JSON parse + validation), `chain.ts` (real viem walletClient), smoke test executor against local Hardhat node | **1:30 h** | 2:45–4:15 |
| **4** | Integration | Copy addresses + ABIs into frontend/constants/; update backend .env; test `autoInvest` tx on testnet from executor | Wire frontend hooks to real contract reads; test deposit/withdraw/setPolicy end-to-end in browser with MetaMask | **2:00 h** | 4:15–6:15 |
| **5** | Demo polish | Smoke test full end-to-end flow, Vercel deploy, check emergency stop | Loading + confirming states on all write hooks, error toasts, empty states in tx-history | **45 min** | 6:15–7:00 |

**Buffer:** 7:00–8:00 for unexpected issues.

### End-to-end demo script
1. Connect MetaMask to Base Sepolia
2. Call `MockUSDC.mint(100e18)` (via block explorer or dashboard button)
3. Deposit 100 USDC into Vault
4. Set policy: `maxSingle=50, monthlyLimit=100, minReserve=10, autoInvestEnabled=true, riskLevel=LOW`
5. Wait for 2-min cron tick
6. Executor calls OpenAI → `{ action: "invest", amount: 50, token: "USDC", protocol: "aave" }`
7. Executor calls `autoInvest(user, 50e18)` → Vault checks policy → transfers 50 USDC to MockAave
8. Dashboard shows updated balance + `AutoInvested` event in tx history
9. Owner clicks Emergency Stop → Vault paused → next cron tick is blocked at contract level

### Scope cuts (ordered by priority if time runs short)
1. **Cut `tx-history.tsx`** — drop event log parsing; show static "last investment: X USDC" from contract read
2. **Simplify `monthlyLimit`** — remove per-month tracking; enforce only `maxSingleInvestment`
3. **Cut MEDIUM risk** — demo only LOW; the 80/20 split is contract logic, skip it
4. **Cut `policy-form.tsx`** — hardcode policy at deploy, user just toggles `autoInvestEnabled`

---

*AI önerir, smart contract sınırlar, blockchain uygular.*
