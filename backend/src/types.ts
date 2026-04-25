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
