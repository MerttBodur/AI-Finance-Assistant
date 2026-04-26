import type { RiskLevel } from "@/types";

export type AssetSlice = { label: string; pct: number; color: string };

export const ALLOCATIONS: Record<RiskLevel, AssetSlice[]> = {
  0: [
    { label: "USDC", pct: 50, color: "#0ECB81" },
    { label: "XAUT", pct: 30, color: "#22C55E" },
    { label: "XAGX", pct: 20, color: "#86EFAC" },
  ],
  1: [
    { label: "XAUT", pct: 40, color: "#F0B90B" },
    { label: "BTC",  pct: 35, color: "#F59E0B" },
    { label: "ETH",  pct: 25, color: "#FDE047" },
  ],
  2: [
    { label: "BTC", pct: 45, color: "#F97316" },
    { label: "ETH", pct: 35, color: "#EA580C" },
    { label: "SOL", pct: 20, color: "#B91C1C" },
  ],
};
