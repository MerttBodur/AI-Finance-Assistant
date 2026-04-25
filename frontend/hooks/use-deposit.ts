import { VAULT_ADDRESS, USDC_ADDRESS } from "@/constants";
import { USDC_ABI } from "@/constants/abis/MockUSDC";
import { VAULT_ABI } from "@/constants/abis/Vault";
import { parseEther, type Abi } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

export function useDeposit() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (amountEth: string) => {
    const amount = parseEther(amountEth);
    await writeContractAsync({
      abi: USDC_ABI as Abi,
      address: USDC_ADDRESS,
      functionName: "approve",
      args: [VAULT_ADDRESS, amount],
    });
    await writeContractAsync({
      abi: VAULT_ABI as Abi,
      address: VAULT_ADDRESS,
      functionName: "deposit",
      args: [amount],
    });
  };

  return { deposit, isPending, isConfirming, isSuccess };
}
