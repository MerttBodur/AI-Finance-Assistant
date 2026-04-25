import { VAULT_ADDRESS } from "@/constants";
import { VAULT_ABI } from "@/constants/abis/Vault";
import type { VaultPolicy } from "@/types";
import type { Abi } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

export function useSetPolicy() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setPolicy = (policy: VaultPolicy) =>
    writeContract({
      abi: VAULT_ABI as Abi,
      address: VAULT_ADDRESS,
      functionName: "setPolicy",
      args: [policy],
    });

  return { setPolicy, isPending, isConfirming, isSuccess };
}
