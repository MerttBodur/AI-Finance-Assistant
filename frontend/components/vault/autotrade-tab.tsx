"use client";

import { useEffect, useState } from "react";
import { useVaultPolicy } from "@/hooks/use-vault-policy";
import { useSetPolicy } from "@/hooks/use-set-policy";
import { useEmergencyStop } from "@/hooks/use-emergency-stop";
import { useAccount } from "wagmi";
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

export function AutoTradeTab() {
  const { data: policyRaw, isLoading } = useVaultPolicy();
  const { setPolicy, isPending: setPending, isConfirming: setConfirming } = useSetPolicy();
  const { pause, unpause, isPending: pausePending, isConfirming: pauseConfirming } = useEmergencyStop();

  const { isConnected } = useAccount();
  const pol = policyRaw as VaultPolicy | undefined;
  const autoOn  = pol?.autoInvestEnabled ?? false;
  const isBusy      = setPending   || setConfirming;
  const isPauseBusy = pausePending || pauseConfirming;
  const countdown = useNextRunCountdown(autoOn);

  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const stored = window.localStorage.getItem("autoTradeCooldownEnd");
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) {
        setCooldownEnd(parsed);
      }
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const cooldownRemaining = cooldownEnd ? Math.max(cooldownEnd - now, 0) : 0;
  const cooldownActive = cooldownRemaining > 0;
  const cooldownLabel = cooldownActive
    ? `${Math.floor(cooldownRemaining / 86400000)}g ${String(Math.floor((cooldownRemaining % 86400000) / 3600000)).padStart(2, "0")}s ${String(Math.floor((cooldownRemaining % 3600000) / 60000)).padStart(2, "0")}d`
    : null;

  const canToggle = isConnected && !isBusy && !isLoading && (!cooldownActive || autoOn);

  const toggleAutoInvest = () => {
    if (!isConnected || !canToggle) return;

    const basePolicy: VaultPolicy = {
      maxSingleInvestment: 0n,
      monthlyLimit: 0n,
      minReserve: 0n,
      autoInvestEnabled: false,
      riskLevel: 0,
    };
    const nextPolicy = pol ?? basePolicy;

    if (!autoOn) {
      const nextAllowed = Date.now() + 30 * 24 * 60 * 60 * 1000;
      window.localStorage.setItem("autoTradeCooldownEnd", String(nextAllowed));
      setCooldownEnd(nextAllowed);
    }

    // Spread full policy — only flip autoInvestEnabled to preserve limits
    setPolicy({ ...nextPolicy, autoInvestEnabled: !autoOn });
  };

  return (
    <div style={{ animation: "slideUp 0.28s ease both" }}>

      {/* ── Power button ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", marginBottom: "22px" }}>
        <button
          onClick={toggleAutoInvest}
          disabled={!canToggle}
          aria-label="Toggle auto-trade"
          style={{
            width: "114px", height: "114px", borderRadius: "50%",
            border: "2px solid transparent",
            background: autoOn
              ? "linear-gradient(180deg, #EF5350, #D32F2F)"
              : "linear-gradient(180deg, #66BB6A, #388E3C)",
            cursor: !canToggle ? "not-allowed" : "pointer",
            position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: "5px",
            boxShadow: autoOn
              ? "0 0 0 4px rgba(239,83,80,0.3), 0 0 20px rgba(211,47,47,0.4)"
              : "0 0 0 4px rgba(102,187,106,0.3), 0 0 20px rgba(56,142,60,0.4)",
            transition: "all 0.35s",
            outline: "none",
          }}
        >
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
            {isBusy
              ? "SAVING…"
              : isLoading
                ? "LOADING…"
                : autoOn
                  ? "ENABLED"
                  : cooldownActive
                    ? "COOLDOWN"
                    : "ENABLE"
            }
          </span>
        </button>
        <div style={{ fontSize: "13px", color: "#FFFFFF", textAlign: "center", lineHeight: 1.6, fontWeight: 600 }}>
          {cooldownActive && !autoOn
            ? `Next enable in ${cooldownLabel}`
            : autoOn
              ? "AI is monitoring & executing trades"
              : "Tap to enable automatic trading"
          }
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
