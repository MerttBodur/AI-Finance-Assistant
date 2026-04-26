"use client";

import { useState } from "react";
import { useVaultBalance } from "@/hooks/use-vault-balance";
import { useVaultPolicy } from "@/hooks/use-vault-policy";
import { useDeposit } from "@/hooks/use-deposit";
import { fmt } from "@/lib/utils";
import type { VaultPolicy } from "@/types";

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
};

export function DisplayTab() {
  const { data: balance, isLoading: balLoading } = useVaultBalance();
  const { data: policyRaw } = useVaultPolicy();
  const { deposit, isPending, isConfirming, isSuccess } = useDeposit();
  const [amount, setAmount] = useState("");

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

      {/* ── Deposit ── */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#474D57", marginBottom: "10px" }}>
          Deposit USDC
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: "100%", background: "#1E2026",
                border: "1.5px solid var(--border)", borderRadius: "8px",
                padding: "10px 52px 10px 14px",
                ...mono, fontSize: "14px", fontWeight: 500,
                color: "#EAECEF", outline: "none",
              }}
            />
            <span style={{
              position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)",
              fontSize: "10.5px", fontWeight: 700, color: "#474D57", pointerEvents: "none",
            }}>USDC</span>
          </div>
          <button
            onClick={() => deposit(amount)}
            disabled={isPending || isConfirming}
            style={{
              padding: "10px 20px", background: "#F0B90B", color: "#0B0E11",
              border: "none", borderRadius: "8px",
              fontFamily: "var(--font-sora), sans-serif",
              fontSize: "12px", fontWeight: 700,
              cursor: isPending || isConfirming ? "not-allowed" : "pointer",
              opacity: isPending || isConfirming ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {isSuccess ? "Done ✓" : isPending || isConfirming ? "…" : "Deposit"}
          </button>
        </div>
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
