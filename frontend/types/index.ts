import type { Address } from "viem";

export type RiskLevel = 0 | 1 | 2;

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
