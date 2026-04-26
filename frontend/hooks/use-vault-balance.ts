import { VAULT_ADDRESS } from "@/constants";
import { VAULT_ABI } from "@/constants/abis/Vault";
import { DEMO_MODE, DEMO_BALANCE } from "@/lib/demo-data";
import type { Abi } from "viem";
import { useAccount, useReadContract } from "wagmi";

export function useVaultBalance() {
  const { address } = useAccount();
  const result = useReadContract({
    abi: VAULT_ABI as Abi,
    address: VAULT_ADDRESS,
    functionName: "balances",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !DEMO_MODE },
  });

  if (DEMO_MODE) return { data: DEMO_BALANCE, isLoading: false };
  return result;
}
