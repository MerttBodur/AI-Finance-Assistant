import { useState, useEffect } from "react";
import { VAULT_ADDRESS } from "@/constants";
import { VAULT_ABI } from "@/constants/abis/Vault";
import { DEMO_MODE, DEMO_POLICY, demoRiskLevel } from "@/lib/demo-data";
import type { RiskLevel } from "@/types";
import type { Abi } from "viem";
import { useAccount, useReadContract } from "wagmi";

export function useVaultPolicy() {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(demoRiskLevel);

  useEffect(() => {
    if (!DEMO_MODE) return;
    const handler = (e: Event) => setRiskLevel((e as CustomEvent<RiskLevel>).detail);
    window.addEventListener("demo-risk-change", handler);
    return () => window.removeEventListener("demo-risk-change", handler);
  }, []);

  const { address } = useAccount();
  const result = useReadContract({
    abi: VAULT_ABI as Abi,
    address: VAULT_ADDRESS,
    functionName: "policies",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !DEMO_MODE },
  });

  if (DEMO_MODE) return { data: { ...DEMO_POLICY, riskLevel }, isLoading: false };
  return result;
}
