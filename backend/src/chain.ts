import {
  createPublicClient,
  createWalletClient,
  http,
  type Abi,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import type { VaultState } from "./types.js";

// Filled from contracts/artifacts/contracts/Vault.sol/Vault.json in Task 14.
export const VAULT_ABI = [] as const;

const executorPrivateKey = process.env.EXECUTOR_PRIVATE_KEY as
  | `0x${string}`
  | undefined;
const vaultAddress = process.env.VAULT_ADDRESS as `0x${string}`;
const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;

if (!executorPrivateKey) {
  throw new Error("EXECUTOR_PRIVATE_KEY is required");
}

const account = privateKeyToAccount(executorPrivateKey);

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(rpcUrl),
});

export const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(rpcUrl),
});

export async function getVaultState(user: Address): Promise<VaultState> {
  const [balance, policy, monthlyInvested] = await Promise.all([
    publicClient.readContract({
      abi: VAULT_ABI as Abi,
      address: vaultAddress,
      functionName: "balances",
      args: [user],
    }),
    publicClient.readContract({
      abi: VAULT_ABI as Abi,
      address: vaultAddress,
      functionName: "policies",
      args: [user],
    }),
    publicClient.readContract({
      abi: VAULT_ABI as Abi,
      address: vaultAddress,
      functionName: "monthlyInvested",
      args: [user],
    }),
  ]);

  return {
    user,
    balance: balance as bigint,
    policy: policy as VaultState["policy"],
    monthlyInvested: monthlyInvested as bigint,
  };
}

export async function callAutoInvest(
  user: Address,
  amount: bigint,
): Promise<void> {
  const hash = await walletClient.writeContract({
    abi: VAULT_ABI as Abi,
    address: vaultAddress,
    functionName: "autoInvest",
    args: [user, amount],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`[chain] autoInvest confirmed: ${hash}`);
}
