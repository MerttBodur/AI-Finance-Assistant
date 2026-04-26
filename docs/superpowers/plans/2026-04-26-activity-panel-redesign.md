# Activity Panel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat "+$250 USDC" activity list with grouped AI cycle cards showing asset-level trades in "TOKEN → $amount" format, driven by the selected risk level's allocation percentages, with a live 30-second countdown.

**Architecture:** All simulation logic lives in `display-tab.tsx`. `ALLOCATIONS` is extracted from `prefs-tab.tsx` into `frontend/lib/allocations.ts` so both files share one source of truth. Each 30-second tick generates a new `CycleRecord` using the current risk level from `useVaultPolicy()`.

**Tech Stack:** React, TypeScript, inline styles (project convention)

---

## File Map

| File | Change |
|------|--------|
| `frontend/lib/allocations.ts` | Create — shared `AssetSlice` type + `ALLOCATIONS` constant |
| `frontend/components/vault/prefs-tab.tsx` | Modify — remove local `AssetSlice` + `ALLOCATIONS`, import from lib |
| `frontend/components/vault/display-tab.tsx` | Modify — new `CycleRecord` types, cycle generation, grouped card render |

---

## Task 1: Extract ALLOCATIONS to shared lib

**Files:**
- Create: `frontend/lib/allocations.ts`
- Modify: `frontend/components/vault/prefs-tab.tsx` lines 16–34

- [ ] **Step 1: Create `frontend/lib/allocations.ts`**

  ```ts
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
  ```

- [ ] **Step 2: Update `prefs-tab.tsx` — remove local declarations, add import**

  Remove lines 16–34 from `frontend/components/vault/prefs-tab.tsx`:
  ```ts
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
  ```

  Add after line 8 (after existing imports):
  ```ts
  import { ALLOCATIONS, type AssetSlice } from "@/lib/allocations";
  ```

- [ ] **Step 3: Verify build**

  ```bash
  cd frontend && npx tsc --noEmit
  ```
  Expected: no errors

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/lib/allocations.ts frontend/components/vault/prefs-tab.tsx
  git commit -m "refactor: extract ALLOCATIONS to shared lib"
  ```

---

## Task 2: Rewrite display-tab simulation

**Files:**
- Modify: `frontend/components/vault/display-tab.tsx`

- [ ] **Step 1: Replace the full file**

  ```tsx
  "use client";

  import { useState, useEffect, useRef } from "react";
  import { useVaultPolicy } from "@/hooks/use-vault-policy";
  import { fmt } from "@/lib/utils";
  import { ALLOCATIONS } from "@/lib/allocations";
  import type { RiskLevel, VaultPolicy } from "@/types";

  const mono: React.CSSProperties = {
    fontFamily: "var(--font-mono), monospace",
  };

  const PERIOD_S = 30;

  const RISK_LABEL: Record<RiskLevel, string> = { 0: "LOW", 1: "MED", 2: "HIGH" };
  const RISK_COLOR: Record<RiskLevel, string> = { 0: "#0ECB81", 1: "#F0B90B", 2: "#F05A28" };
  const RISK_BG: Record<RiskLevel, string> = { 0: "var(--green-dim)", 1: "var(--yellow-dim)", 2: "var(--red-dim)" };

  const SEED_BALANCE = 5_000n * 10n ** 18n;
  const CYCLE_TOTALS = [280, 320, 360, 400, 420, 300, 350];

  type AssetTrade = { token: string; amount: number; color: string };
  type CycleRecord = {
    id: number;
    timestamp: string;
    riskLevel: RiskLevel;
    trades: AssetTrade[];
    total: number;
  };

  function makeCycle(id: number, riskLevel: RiskLevel, secondsAgo: number): CycleRecord {
    const total = CYCLE_TOTALS[id % CYCLE_TOTALS.length];
    const trades: AssetTrade[] = ALLOCATIONS[riskLevel].map((s) => ({
      token: s.label,
      amount: Math.round((s.pct / 100) * total),
      color: s.color,
    }));
    return {
      id,
      timestamp: new Date(Date.now() - secondsAgo * 1000).toISOString(),
      riskLevel,
      trades,
      total,
    };
  }

  const SEED_CYCLES: CycleRecord[] = [
    makeCycle(5, 1, 150),
    makeCycle(4, 1, 300),
    makeCycle(3, 1, 450),
    makeCycle(2, 1, 600),
    makeCycle(1, 1, 750),
  ];

  function totalInvestedBigInt(cycles: CycleRecord[]): bigint {
    return cycles.reduce((sum, c) => sum + BigInt(c.total) * 10n ** 18n, 0n);
  }

  export function DisplayTab() {
    const [mounted, setMounted] = useState(false);
    const [cycles, setCycles] = useState<CycleRecord[]>(SEED_CYCLES);
    const [countdown, setCountdown] = useState(PERIOD_S);
    const nextId = useRef(SEED_CYCLES.length + 1);

    const { data: policyRaw } = useVaultPolicy();
    const pol = policyRaw as VaultPolicy | undefined;
    const riskLevel: RiskLevel = pol?.riskLevel ?? 1;

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
      const tick = setInterval(() => {
        setCountdown((s) => {
          if (s <= 1) {
            const id = nextId.current++;
            setCycles((prev) => [makeCycle(id, riskLevel, 0), ...prev].slice(0, 20));
            return PERIOD_S;
          }
          return s - 1;
        });
      }, 1000);
      return () => clearInterval(tick);
    }, [riskLevel]);

    const balance = SEED_BALANCE - totalInvestedBigInt(cycles);

    const stats = [
      { label: "Vault Balance", value: `$${fmt(balance)}`, color: "#F0B90B" },
      { label: "Monthly Limit", value: "$1,000.00",        color: "#EAECEF" },
      { label: "Min Reserve",   value: "$500.00",          color: "#EAECEF" },
      { label: "Risk Level",    value: RISK_LABEL[riskLevel], color: RISK_COLOR[riskLevel] },
    ];

    if (!mounted) return <div style={{ animation: "slideUp 0.28s ease both" }} />;

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
            ${fmt(balance)}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "10.5px", color: "#474D57" }}>USDC · Base Sepolia</div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#0ECB81", animation: "blink 1.4s ease infinite" }} />
              <span style={{ fontSize: "9.5px", color: "#474D57" }}>
                Next AI cycle in <span style={{ ...mono, color: "#EAECEF" }}>{countdown}s</span>
              </span>
            </div>
          </div>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {cycles.map((c) => (
              <div key={c.id} style={{
                background: "#1E2026",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "11px 14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                  <span style={{ fontSize: "9px", color: "#474D57" }}>
                    AI Cycle #{c.id} · {new Date(c.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span style={{
                    fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em",
                    padding: "1px 7px", borderRadius: "20px",
                    background: RISK_BG[c.riskLevel],
                    color: RISK_COLOR[c.riskLevel],
                  }}>
                    {RISK_LABEL[c.riskLevel]}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                  {c.trades.map((t) => (
                    <span key={t.token} style={{ ...mono, fontSize: "12px", fontWeight: 700, color: t.color }}>
                      {t.token} → ${t.amount}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: "9px", color: "#474D57" }}>
                  Total invested: ${c.total} USDC
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }
  ```

- [ ] **Step 2: Verify build**

  ```bash
  cd frontend && npx tsc --noEmit
  ```
  Expected: no errors

- [ ] **Step 3: Start dev server and visually verify**

  ```bash
  cd frontend && npm run dev
  ```

  Open `http://localhost:3000/dashboard`, Display tab:
  - 5 seed cycle cards on load, each showing `TOKEN → $amount` (e.g. `XAUT → $128 · BTC → $112 · ETH → $80`)
  - Balance = $5,000 minus seed totals
  - "Next AI cycle in 30s" countdown ticking, green dot blinking
  - Every 30s: new cycle card at top, balance decreases
  - Risk Level stat shows MED (demo default)
  - Switch to Prefs tab → HIGH → next cycle shows BTC/ETH/SOL
  - Switch to LOW → next cycle shows USDC/XAUT/XAGX

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/components/vault/display-tab.tsx
  git commit -m "feat: asset-based activity panel with risk-driven cycle simulation"
  ```
