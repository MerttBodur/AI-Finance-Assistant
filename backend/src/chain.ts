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
export const VAULT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "usdcAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "aaveAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "executorAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "riskLevel",
        "type": "uint8"
      }
    ],
    "name": "AutoInvested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Deposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "PolicyUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Withdrawn",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "aave",
    "outputs": [
      {
        "internalType": "contract MockAave",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "autoInvest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "balances",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "executor",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "monthlyInvested",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "policies",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "maxSingleInvestment",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "monthlyLimit",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minReserve",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "autoInvestEnabled",
        "type": "bool"
      },
      {
        "internalType": "uint8",
        "name": "riskLevel",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "maxSingleInvestment",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "monthlyLimit",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minReserve",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "autoInvestEnabled",
            "type": "bool"
          },
          {
            "internalType": "uint8",
            "name": "riskLevel",
            "type": "uint8"
          }
        ],
        "internalType": "struct Vault.Policy",
        "name": "p",
        "type": "tuple"
      }
    ],
    "name": "setPolicy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdc",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

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
