# Risk Allocation Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a HIGH risk option to the risk selector and show an animated accordion panel with a centered SVG donut chart displaying asset allocation for the selected risk level.

**Architecture:** All changes are self-contained in `prefs-tab.tsx` and `types/index.ts`. The donut chart is pure SVG computed from a hardcoded `ALLOCATIONS` record — no chart library needed. The accordion uses a CSS `max-height` transition (always mounted, never conditionally rendered).

**Tech Stack:** React, TypeScript, inline styles (project convention), pure SVG

---

## File Map

| File | Change |
|------|--------|
| `frontend/app/globals.css` | Add `--red-dim` CSS variable |
| `frontend/types/index.ts` | Extend `RiskLevel` to `0 \| 1 \| 2` |
| `frontend/components/vault/prefs-tab.tsx` | Add HIGH to `RISK_OPTS`, fix selected card colors, add `ALLOCATIONS`, `DonutChart`, `AllocationPanel` |

---

## Task 1: Add `--red-dim` CSS variable

**Files:**
- Modify: `frontend/app/globals.css:9`

- [ ] **Step 1: Add the variable**

  In `frontend/app/globals.css`, add `--red-dim` after `--green-dim` inside `:root`:

  ```css
  :root {
    color-scheme: dark;
    --yellow-dim:  rgba(240, 185, 11, 0.10);
    --yellow-glow: rgba(240, 185, 11, 0.28);
    --green-dim:   rgba(14, 203, 129, 0.10);
    --red-dim:     rgba(246, 70, 93, 0.10);
    --border:      rgba(234, 236, 239, 0.07);
    --border-lit:  rgba(240, 185, 11, 0.22);
  }
  ```

- [ ] **Step 2: Verify build**

  ```bash
  cd frontend && npx tsc --noEmit
  ```
  Expected: no errors

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/app/globals.css
  git commit -m "feat: add --red-dim CSS variable for HIGH risk"
  ```

---

## Task 2: Extend RiskLevel type

**Files:**
- Modify: `frontend/types/index.ts:3`

- [ ] **Step 1: Update the type**

  Replace line 3 in `frontend/types/index.ts`:

  ```ts
  export type RiskLevel = 0 | 1 | 2;
  ```

- [ ] **Step 2: Verify build — expect type errors in prefs-tab**

  ```bash
  cd frontend && npx tsc --noEmit
  ```
  Expected: TypeScript errors in `prefs-tab.tsx` because `RISK_OPTS` still only covers `0 | 1`. This is intentional — fixed in Task 3.

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/types/index.ts
  git commit -m "feat: extend RiskLevel type to include HIGH (2)"
  ```

---

## Task 3: Add HIGH to RISK_OPTS and fix selected card colors

**Files:**
- Modify: `frontend/components/vault/prefs-tab.tsx:10-13` (RISK_OPTS), lines ~74-86 (card styles)

- [ ] **Step 1: Replace RISK_OPTS**

  Replace lines 10-13 in `frontend/components/vault/prefs-tab.tsx` with:

  ```ts
  const RISK_OPTS = [
    { value: 0 as RiskLevel, pill: "LOW",  pillColor: "#0ECB81", pillBg: "var(--green-dim)",  title: "Safe",     titleColor: "#0ECB81" },
    { value: 1 as RiskLevel, pill: "MED",  pillColor: "#F0B90B", pillBg: "var(--yellow-dim)", title: "Balanced", titleColor: "#F0B90B" },
    { value: 2 as RiskLevel, pill: "HIGH", pillColor: "#F6465D", pillBg: "var(--red-dim)",     title: "Degen",    titleColor: "#F6465D" },
  ] as const;
  ```

  Note: the `sub` field is removed — its text will live in the allocation panel instead.

- [ ] **Step 2: Fix selected card highlight color and remove the sub text span**

  In the `.map((opt) => ...)` block, replace the entire card `<div>` with:

  ```tsx
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
  ```

- [ ] **Step 3: Verify build**

  ```bash
  cd frontend && npx tsc --noEmit
  ```
  Expected: no errors

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/components/vault/prefs-tab.tsx
  git commit -m "feat: add HIGH risk option and fix per-risk selected card colors"
  ```

---

## Task 4: Add ALLOCATIONS constant and DonutChart component

**Files:**
- Modify: `frontend/components/vault/prefs-tab.tsx` (add after RISK_OPTS, before inputStyle)

- [ ] **Step 1: Add AssetSlice type, ALLOCATIONS constant, and CIRCUMFERENCE**

  Add immediately after the `RISK_OPTS` block:

  ```ts
  type AssetSlice = { label: string; pct: number; color: string };

  const ALLOCATIONS: Record<RiskLevel, AssetSlice[]> = {
    0: [
      { label: "USDC", pct: 50, color: "#0ECB81" },
      { label: "XAUT", pct: 30, color: "#D4AF37" },
      { label: "XAGX", pct: 20, color: "#A8A9AD" },
    ],
    1: [
      { label: "XAUT", pct: 40, color: "#D4AF37" },
      { label: "BTC",  pct: 35, color: "#F7931A" },
      { label: "ETH",  pct: 25, color: "#627EEA" },
    ],
    2: [
      { label: "BTC",  pct: 45, color: "#F7931A" },
      { label: "ETH",  pct: 35, color: "#627EEA" },
      { label: "SOL",  pct: 20, color: "#9945FF" },
    ],
  };

  const CIRCUMFERENCE = 2 * Math.PI * 38; // r=38 → ≈238.76
  ```

- [ ] **Step 2: Add DonutChart component**

  Add after the `CIRCUMFERENCE` constant, before `inputStyle`:

  ```tsx
  function DonutChart({ slices, label, labelColor }: { slices: AssetSlice[]; label: string; labelColor: string }) {
    let cumulative = 0;
    return (
      <svg width="100" height="100" viewBox="0 0 100 100">
        {slices.map((s) => {
          const dash = (s.pct / 100) * CIRCUMFERENCE;
          const el = (
            <circle
              key={s.label}
              cx="50" cy="50" r="38"
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
  ```

- [ ] **Step 3: Verify build**

  ```bash
  cd frontend && npx tsc --noEmit
  ```
  Expected: no errors

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/components/vault/prefs-tab.tsx
  git commit -m "feat: add ALLOCATIONS data and DonutChart SVG component"
  ```

---

## Task 5: Add AllocationPanel and wire into PrefsTab

**Files:**
- Modify: `frontend/components/vault/prefs-tab.tsx`

- [ ] **Step 1: Add AllocationPanel component**

  Add after `DonutChart`, before `inputStyle`:

  ```tsx
  const RISK_LABEL: Record<RiskLevel, string> = { 0: "LOW", 1: "MED", 2: "HIGH" };
  const RISK_BORDER: Record<RiskLevel, string> = { 0: "#0ECB81", 1: "#F0B90B", 2: "#F6465D" };

  function AllocationPanel({ risk }: { risk: RiskLevel }) {
    const slices = ALLOCATIONS[risk];
    const label = RISK_LABEL[risk];
    const borderColor = RISK_BORDER[risk];
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
                <span style={{ color: s.color }}>●</span>
                <span>{s.label}</span>
                <span style={{ color: "#EAECEF", fontWeight: 600 }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Wire AllocationPanel into PrefsTab's Risk Level section**

  Inside `PrefsTab`'s return, find the Risk Level section. After the closing `</div>` of the cards row, add `<AllocationPanel risk={risk} />`:

  ```tsx
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
  ```

- [ ] **Step 3: Verify build**

  ```bash
  cd frontend && npx tsc --noEmit
  ```
  Expected: no errors

- [ ] **Step 4: Start dev server and visually verify**

  ```bash
  cd frontend && npm run dev
  ```

  Open `http://localhost:3000/dashboard`, go to the Prefs tab, and check:
  - Three risk cards: LOW (green border when selected), MED (yellow), HIGH (red)
  - Clicking each card: border + background switches to that risk's color
  - Allocation panel appears below cards with a top border matching the selected risk color
  - Donut chart updates to show the correct assets for the selected risk
  - Donut center label shows LOW / MED / HIGH in the risk's color
  - Legend shows correct token names and percentages per slice
  - No console errors, no hydration warnings

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/components/vault/prefs-tab.tsx
  git commit -m "feat: add risk allocation panel with animated accordion donut chart"
  ```
