# Risk Allocation Panel — Design Spec

**Date:** 2026-04-26
**Status:** Approved
**Scope:** `frontend/components/vault/prefs-tab.tsx`, `frontend/types/index.ts`

---

## Summary

Add a HIGH risk option to the existing LOW/MED risk selector, and show an animated accordion panel below the risk cards that displays a centered donut chart with the asset allocation for the selected risk level.

---

## Feature Details

### 1. HIGH Risk Option

- Add `2` to `RiskLevel` type: `export type RiskLevel = 0 | 1 | 2`
- Add a third card to `RISK_OPTS`:
  - pill: `HIGH`, color: `#F6465D`, background: `var(--red-dim)`
  - title: `Degen`, color: `#F6465D`
- Selected card border and background uses that risk's own color (LOW=green, MED=yellow, HIGH=red) instead of always yellow.

### 2. Accordion Panel

- Appears **below the three risk cards**, not inside them
- Always mounted; opens with a smooth CSS `max-height` transition (`0 → 220px`, `overflow: hidden`, `transition: max-height 0.3s ease`)
- Top border in the selected risk's accent color; dark background (`#13161b`); border-radius `10px`
- No close/collapse button — panel always shows while a risk is selected (which is always)

### 3. Donut Chart

- Pure SVG, no external chart library
- Size: 100×100px, centered
- Donut ring built from stacked `<circle>` elements with `stroke-dasharray` (no `<path>` math needed)
- Center hole shows: risk label (`LOW` / `MED` / `HIGH`) + `"risk"` subtitle
- Below donut: horizontal legend — colored dot · token name · percentage, spaced with flexbox

### 4. Asset Allocations (hardcoded constants)

| Risk | Assets | Percentages |
|------|--------|-------------|
| LOW (0) | USDC, XAUT, XAGX | 50%, 30%, 20% |
| MED (1) | XAUT, BTC, ETH | 40%, 35%, 25% |
| HIGH (2) | BTC, ETH, SOL | 45%, 35%, 20% |

Token colors:
- USDC: `#0ECB81`
- XAUT: `#D4AF37` (gold)
- XAGX: `#A8A9AD` (silver-grey)
- BTC: `#F7931A`
- ETH: `#627EEA`
- SOL: `#9945FF`

---

## Architecture

### Files to modify

| File | Change |
|------|--------|
| `frontend/types/index.ts` | `RiskLevel = 0 \| 1 \| 2` |
| `frontend/components/vault/prefs-tab.tsx` | Add HIGH to RISK_OPTS, fix selected border/bg color, add `AllocationPanel` |

### New component: `AllocationPanel` (co-located in `prefs-tab.tsx`)

```ts
type AssetSlice = { label: string; pct: number; color: string };
const ALLOCATIONS: Record<RiskLevel, AssetSlice[]> = {
  0: [{ label: "USDC", pct: 50, color: "#0ECB81" }, { label: "XAUT", pct: 30, color: "#D4AF37" }, { label: "XAGX", pct: 20, color: "#A8A9AD" }],
  1: [{ label: "XAUT", pct: 40, color: "#D4AF37" }, { label: "BTC",  pct: 35, color: "#F7931A" }, { label: "ETH",  pct: 25, color: "#627EEA" }],
  2: [{ label: "BTC",  pct: 45, color: "#F7931A" }, { label: "ETH",  pct: 35, color: "#627EEA" }, { label: "SOL",  pct: 20, color: "#9945FF" }],
};
```

SVG donut uses `stroke-dasharray` technique:
- circumference = `2π × r` where `r = 38` → ~239
- each slice: `stroke-dasharray = "pct/100 × 239  239"`, offset = cumulative prior slices

---

## Behavior

- Risk card click → `setRisk(value)` (existing state) → panel content re-renders instantly
- Accordion animation via CSS only (`max-height` transition), no JS animation library
- Panel is always mounted (not conditionally rendered) to allow the opening animation on first load

---

## Out of Scope

- Connecting allocations to smart contract logic (UI display only)
- Real-time price or dynamic percentages
- Backend or contract changes

---

## Acceptance Criteria

- [ ] Three risk cards: LOW, MED, HIGH
- [ ] Selected card uses its own risk color for border + background tint
- [ ] Accordion panel opens below cards with smooth animation
- [ ] Donut chart shows correct assets and percentages for selected risk
- [ ] Legend shows token name + percentage per slice
- [ ] Risk label appears in the center hole of the donut
- [ ] No compile errors, no hydration warnings
- [ ] `--red-dim` CSS variable defined in `globals.css` (add if missing)
