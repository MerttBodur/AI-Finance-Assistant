import { VAULT_ADDRESS } from "@/constants";
import { VAULT_ABI } from "@/constants/abis/Vault";
import type { Abi } from "viem";
import { useAccount, useReadContract } from "wagmi";

export function useVaultPolicy() {
  const { address } = useAccount();
  return useReadContract({
    abi: VAULT_ABI as Abi,
    address: VAULT_ADDRESS,
    functionName: "policies",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}
