"use client";

import { useVaultBalance } from "@/hooks/use-vault-balance";
import { useVaultPolicy } from "@/hooks/use-vault-policy";
import { fmt } from "@/lib/utils";
import type { VaultPolicy } from "@/types";

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
};

export function DisplayTab() {
  const { data: balance, isLoading: balLoading } = useVaultBalance();
  const { data: policyRaw } = useVaultPolicy();

  const bal = balance as bigint | undefined;
  const pol = policyRaw as VaultPolicy | undefined;

  const stats = [
    { label: "Vault Balance",  value: balLoading ? "…" : `$${fmt(bal ?? 0n)}`, color: "#F0B90B" },
    { label: "Monthly Limit",  value: pol ? `$${fmt(pol.monthlyLimit)}` : "—",  color: "#EAECEF" },
    { label: "Min Reserve",    value: pol ? `$${fmt(pol.minReserve)}` : "—",    color: "#EAECEF" },
    { label: "Risk Level",     value: pol ? (pol.riskLevel === 0 ? "LOW" : "MED") : "—", color: pol?.riskLevel === 0 ? "#0ECB81" : "#F0B90B" },
  ];

  return (
    <div style={{ animation: "slideUp 0.28s ease both" }}>

      {/* ── Balance card ── */}
      <div style={{
        background: "#1E2026", border: "1px solid var(--border)", borderRadius: "12px",
        padding: "18px", marginBottom: "12px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, #F0B90B 0%, transparent 70%)",
        }} />
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#474D57", marginBottom: "10px" }}>
          Vault Balance
        </div>
        <div style={{ ...mono, fontSize: "34px", fontWeight: 700, color: "#F0B90B", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "8px" }}>
          {balLoading ? "…" : `$${fmt(bal ?? 0n)}`}
        </div>
        <div style={{ fontSize: "10.5px", color: "#474D57" }}>USDC · Base Sepolia</div>
      </div>

      {/* ── Stats grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "#1E2026", border: "1px solid var(--border)", borderRadius: "10px", padding: "13px 14px" }}>
            <div style={{ fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#474D57", marginBottom: "6px" }}>
              {s.label}
            </div>
            <div style={{ ...mono, fontSize: "16px", fontWeight: 600, color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Activity ── */}
      <div>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#474D57", marginBottom: "10px" }}>
          Recent Activity
        </div>
        <div style={{ background: "#1E2026", border: "1px solid var(--border)", borderRadius: "10px", padding: "28px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#474D57" }}>No transactions yet</div>
        </div>
      </div>

    </div>
  );
}
