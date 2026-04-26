"use client";

import { useEffect, useState } from "react";
import { parseEther } from "viem";
import { useSetPolicy } from "@/hooks/use-set-policy";
import { useVaultPolicy } from "@/hooks/use-vault-policy";
import { fmt } from "@/lib/utils";
import type { VaultPolicy, RiskLevel } from "@/types";

const RISK_OPTS = [
  { value: 0 as RiskLevel, pill: "LOW",  pillColor: "#0ECB81", pillBg: "var(--green-dim)",  title: "Safe",     titleColor: "#0ECB81" },
  { value: 1 as RiskLevel, pill: "MED",  pillColor: "#F0B90B", pillBg: "var(--yellow-dim)", title: "Balanced", titleColor: "#F0B90B" },
  { value: 2 as RiskLevel, pill: "HIGH", pillColor: "#F05A28", pillBg: "var(--red-dim)",    title: "Degen",    titleColor: "#F05A28" },
] as const;

type AssetSlice = { label: string; pct: number; color: string };

const ALLOCATIONS: Record<RiskLevel, AssetSlice[]> = {
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

const CIRCUMFERENCE = 2 * Math.PI * 38;

function DonutChart({ slices, label, labelColor }: { slices: AssetSlice[]; label: string; labelColor: string }) {
  let cumulative = 0;

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      {slices.map((s) => {
        const dash = (s.pct / 100) * CIRCUMFERENCE;
        const el = (
          <circle
            key={s.label}
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke={s.color}
            strokeWidth="20"
            strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
            strokeDashoffset={-cumulative}
            transform="rotate(-90 50 50)"
          />
        );
        cumulative += dash;
        return el;
      })}
      <circle cx="50" cy="50" r="27" fill="#13161b" />
      <text x="50" y="47" textAnchor="middle" fill={labelColor} fontSize="10" fontWeight="700">{label}</text>
      <text x="50" y="59" textAnchor="middle" fill="#474D57" fontSize="8">risk</text>
    </svg>
  );
}

const RISK_LABEL: Record<RiskLevel, string> = { 0: "LOW", 1: "MED", 2: "HIGH" };
const RISK_BORDER: Record<RiskLevel, string> = { 0: "#0ECB81", 1: "#F0B90B", 2: "#F05A28" };

function normalizeRiskLevel(value: unknown): RiskLevel {
  const riskValue = typeof value === "bigint" ? Number(value) : value;
  return riskValue === 0 || riskValue === 1 || riskValue === 2 ? riskValue : 0;
}

function AllocationPanel({ risk }: { risk: RiskLevel }) {
  const safeRisk = normalizeRiskLevel(risk);
  const slices = ALLOCATIONS[safeRisk];
  const label = RISK_LABEL[safeRisk];
  const borderColor = RISK_BORDER[safeRisk];

  return (
    <div style={{ maxHeight: "220px", overflow: "hidden", transition: "max-height 0.3s ease", marginTop: "10px" }}>
      <div style={{
        background: "#13161b",
        border: `1px solid ${borderColor}`,
        borderTop: `2px solid ${borderColor}`,
        borderRadius: "10px",
        padding: "14px 14px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}>
        <DonutChart slices={slices} label={label} labelColor={borderColor} />
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          {slices.map((s) => (
            <div key={s.label} style={{ fontSize: "9px", color: "#848E9C", display: "flex", gap: "4px", alignItems: "center" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.color, display: "inline-block" }} />
              <span>{s.label}</span>
              <span style={{ color: "#EAECEF", fontWeight: 600 }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#1E2026",
  border: "1.5px solid var(--border)", borderRadius: "8px",
  padding: "10px 52px 10px 14px",
  fontFamily: "var(--font-mono), monospace",
  fontSize: "14px", fontWeight: 500,
  color: "#EAECEF", outline: "none",
};

export function PrefsTab() {
  const { data: policyRaw } = useVaultPolicy();
  const { setPolicy, isPending, isConfirming, isSuccess } = useSetPolicy();
  const pol = policyRaw as VaultPolicy | undefined;

  const [maxSingle, setMaxSingle] = useState("50");
  const [monthly,   setMonthly]   = useState("100");
  const [reserve,   setReserve]   = useState("10");
  const [risk,      setRisk]      = useState<RiskLevel>(0);
  const [autoOn,    setAutoOn]    = useState(true);

  useEffect(() => {
    if (!pol) return;
    setMaxSingle(fmt(pol.maxSingleInvestment));
    setMonthly(fmt(pol.monthlyLimit));
    setReserve(fmt(pol.minReserve));
    setRisk(normalizeRiskLevel(pol.riskLevel));
    setAutoOn(pol.autoInvestEnabled);
  }, [pol]);

  const handleSave = () =>
    setPolicy({
      maxSingleInvestment: parseEther(maxSingle || "0"),
      monthlyLimit:        parseEther(monthly   || "0"),
      minReserve:          parseEther(reserve   || "0"),
      autoInvestEnabled:   autoOn,
      riskLevel:           risk,
    });

  const LIMIT_FIELDS = [
    { label: "Max Single Trade", hint: "per AI decision", value: maxSingle, set: setMaxSingle },
    { label: "Monthly Limit",    hint: "total cap",       value: monthly,   set: setMonthly   },
    { label: "Min Reserve",      hint: "always keep",     value: reserve,   set: setReserve   },
  ] as const;

  return (
    <div style={{ animation: "slideUp 0.28s ease both" }}>

      {/* ── Risk Level ── */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#474D57", marginBottom: "11px" }}>
          Risk Level
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {RISK_OPTS.map((opt) => (
            <div
              key={opt.value}
              onClick={() => setRisk(opt.value)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "7px",
                padding: "15px 10px",
                background: risk === opt.value ? opt.pillBg : "#1E2026",
                border: `1.5px solid ${risk === opt.value ? opt.pillColor : "var(--border)"}`,
                borderRadius: "10px", cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", padding: "2px 8px", borderRadius: "20px", background: opt.pillBg, color: opt.pillColor }}>
                {opt.pill}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: opt.titleColor }}>{opt.title}</span>
            </div>
          ))}
        </div>
        <AllocationPanel risk={risk} />
      </div>

      <div style={{ height: "1px", background: "var(--border)", marginBottom: "18px" }} />

      {/* ── Limits ── */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#474D57", marginBottom: "11px" }}>
          Investment Limits
        </div>
        {LIMIT_FIELDS.map((f) => (
          <div key={f.label} style={{ marginBottom: "11px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "#848E9C" }}>{f.label}</span>
              <span style={{ fontSize: "9.5px", color: "#474D57" }}>{f.hint}</span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                style={inputStyle}
              />
              <span style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", fontSize: "10.5px", fontWeight: 700, color: "#474D57", pointerEvents: "none" }}>
                USDC
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Save ── */}
      <button
        onClick={handleSave}
        disabled={isPending || isConfirming}
        style={{
          width: "100%", padding: "12px",
          background: "#F0B90B", color: "#0B0E11",
          border: "none", borderRadius: "8px",
          fontFamily: "var(--font-sora), sans-serif",
          fontSize: "13px", fontWeight: 700, letterSpacing: "0.04em",
          cursor: isPending || isConfirming ? "not-allowed" : "pointer",
          opacity: isPending || isConfirming ? 0.6 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {isSuccess ? "Saved to Vault ✓" : isPending || isConfirming ? "Saving…" : "Save to Vault"}
      </button>

    </div>
  );
}
