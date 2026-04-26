import type { RiskLevel, VaultPolicy } from "@/types";

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_BALANCE: bigint = 5_000n * 10n ** 18n;

export let demoRiskLevel: RiskLevel = 1;

export function setDemoRiskLevel(r: RiskLevel): void {
  demoRiskLevel = r;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("demo-risk-change", { detail: r }));
  }
}

export const DEMO_POLICY: VaultPolicy = {
  maxSingleInvestment: 500n * 10n ** 18n,
  monthlyLimit: 1_000n * 10n ** 18n,
  minReserve: 500n * 10n ** 18n,
  riskLevel: 1,
  autoInvestEnabled: true,
};
