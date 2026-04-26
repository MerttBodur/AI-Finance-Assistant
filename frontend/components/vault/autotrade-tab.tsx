"use client";

import { useEffect, useState } from "react";
import { useVaultPolicy } from "@/hooks/use-vault-policy";
import { useSetPolicy } from "@/hooks/use-set-policy";
import { useEmergencyStop } from "@/hooks/use-emergency-stop";
import type { VaultPolicy } from "@/types";

// Seconds until next backend cron tick — executor runs "*/2 * * * *"
function useNextRunCountdown(active: boolean) {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!active) return;
    const calc = () => {
      const now = new Date();
      const elapsed = (now.getMinutes() * 60 + now.getSeconds()) % 120;
      return 120 - elapsed;
    };
    setSecs(calc());
    const id = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return "--:--";
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

const STATUS_CHIPS = [
  { label: "AI Engine", val: "Connected", color: "#0ECB81", pulse: true  },
  { label: "Executor",  val: "Ready",     color: "#0ECB81", pulse: true  },
  { label: "Network",   val: "Sepolia",   color: "#F0B90B", pulse: false },
] as const;

export function AutoTradeTab() {
  const { data: policyRaw, isLoading } = useVaultPolicy();
  const { setPolicy, isPending: setPending, isConfirming: setConfirming } = useSetPolicy();
  const { pause, unpause, isPending: pausePending, isConfirming: pauseConfirming } = useEmergencyStop();

  const pol = policyRaw as VaultPolicy | undefined;
  const autoOn  = pol?.autoInvestEnabled ?? false;
  const isBusy      = setPending   || setConfirming;
  const isPauseBusy = pausePending || pauseConfirming;
  const countdown = useNextRunCountdown(autoOn);

  const toggleAutoInvest = () => {
    if (!pol || isBusy || isLoading) return;
    // Spread full policy — only flip autoInvestEnabled to preserve limits
    setPolicy({ ...pol, autoInvestEnabled: !autoOn });
  };

  return (
    <div style={{ animation: "slideUp 0.28s ease both" }}>

      {/* ── Status chips ── */}
      <div style={{ display: "flex", gap: "7px", marginBottom: "22px" }}>
        {STATUS_CHIPS.map((chip) => (
          <div key={chip.label} style={{
            flex: 1, background: "#1E2026", border: "1px solid var(--border)",
            borderRadius: "9px", padding: "11px 8px", textAlign: "center",
          }}>
            <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#474D57", marginBottom: "6px" }}>
              {chip.label}
            </div>
            <div style={{ fontSize: "10.5px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", color: chip.color }}>
              <span style={{
                width: "5px", height: "5px", borderRadius: "50%",
                background: chip.color, display: "inline-block",
                animation: chip.pulse ? "blink 2s ease-in-out infinite" : "none",
              }} />
              {chip.val}
            </div>
          </div>
        ))}
      </div>

      {/* ── Power button ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", marginBottom: "22px" }}>
        <button
          onClick={toggleAutoInvest}
          disabled={isBusy || isLoading}
          aria-label="Toggle auto-trade"
          style={{
            width: "114px", height: "114px", borderRadius: "50%",
            border: `2px solid ${autoOn ? "#F0B90B" : "var(--border)"}`,
            background: autoOn ? "var(--yellow-dim)" : "#1E2026",
            cursor: isBusy || isLoading ? "not-allowed" : "pointer",
            position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: "5px",
            boxShadow: autoOn
              ? "0 0 0 4px rgba(240,185,11,0.08), 0 0 32px rgba(240,185,11,0.22)"
              : "none",
            transition: "all 0.35s",
            outline: "none",
          }}
        >
          <div style={{
            position: "absolute", inset: "6px", borderRadius: "50%",
            border: `1.5px solid ${autoOn ? "rgba(240,185,11,0.3)" : "var(--border)"}`,
            transition: "border-color 0.35s",
          }} />
          <span style={{
            fontSize: "26px", lineHeight: 1,
            filter: autoOn ? "drop-shadow(0 0 8px rgba(240,185,11,0.6))" : "none",
            transition: "filter 0.3s",
          }}>⏻</span>
          <span style={{
            fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.12em",
            color: autoOn ? "#F0B90B" : "#474D57",
            fontFamily: "var(--font-sora), sans-serif",
            transition: "color 0.3s",
          }}>
            {isBusy ? "SAVING…" : autoOn ? "ENABLED" : "DISABLED"}
          </span>
        </button>
        <div style={{ fontSize: "10.5px", color: "#474D57", textAlign: "center", lineHeight: 1.6 }}>
          {autoOn ? "AI is monitoring & executing trades" : "Tap to enable automatic trading"}
        </div>
      </div>

      {/* ── Next AI run ── */}
      <div style={{ background: "#1E2026", border: "1px solid var(--border)", borderRadius: "10px", padding: "13px 15px", marginBottom: "9px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#474D57" }}>
            Next AI Run
          </span>
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "13px", fontWeight: 600, color: autoOn ? "#F0B90B" : "#474D57" }}>
            {countdown}
          </span>
        </div>
      </div>

      {/* ── Last AI recommendation ── */}
      <div style={{ background: "#1E2026", border: "1px solid var(--border)", borderRadius: "10px", padding: "13px 15px", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#474D57" }}>
            Last AI Recommendation
          </span>
          <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", background: "var(--yellow-dim)", color: "#F0B90B", padding: "2px 8px", borderRadius: "20px" }}>
            GPT-4o-mini
          </span>
        </div>
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: "11px", color: "#848E9C", lineHeight: 1.8 }}>
          {autoOn ? (
            <>
              action: <span style={{ color: "#F0B90B", fontWeight: 600 }}>"invest"</span><br />
              amount: <span style={{ color: "#F0B90B", fontWeight: 600 }}>50 USDC</span><br />
              protocol: <span style={{ color: "#F0B90B", fontWeight: 600 }}>aave</span><br />
              reason: <span style={{ color: "#F0B90B", fontWeight: 600 }}>"low volatility window"</span>
            </>
          ) : (
            <span style={{ color: "#474D57" }}>Enable auto-trade to see recommendations</span>
          )}
        </div>
      </div>

      {/* ── Emergency controls ── */}
      <div style={{ background: "#1E2026", border: "1px solid rgba(246,70,93,0.15)", borderRadius: "10px", padding: "13px 15px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#474D57", marginBottom: "10px" }}>
          Emergency Controls
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => pause()}
            disabled={isPauseBusy}
            style={{
              flex: 1, padding: "10px",
              background: "rgba(246,70,93,0.1)", color: "#F6465D",
              border: "1px solid rgba(246,70,93,0.2)", borderRadius: "8px",
              fontFamily: "var(--font-sora), sans-serif",
              fontSize: "12px", fontWeight: 700,
              cursor: isPauseBusy ? "not-allowed" : "pointer",
              opacity: isPauseBusy ? 0.6 : 1,
            }}
          >
            {pausePending || pauseConfirming ? "…" : "Pause Vault"}
          </button>
          <button
            onClick={() => unpause()}
            disabled={isPauseBusy}
            style={{
              flex: 1, padding: "10px",
              background: "transparent", color: "#848E9C",
              border: "1px solid var(--border)", borderRadius: "8px",
              fontFamily: "var(--font-sora), sans-serif",
              fontSize: "12px", fontWeight: 700,
              cursor: isPauseBusy ? "not-allowed" : "pointer",
              opacity: isPauseBusy ? 0.6 : 1,
            }}
          >
            Unpause
          </button>
        </div>
      </div>

    </div>
  );
}
