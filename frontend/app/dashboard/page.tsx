"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { AutoTradeTab } from "@/components/vault/autotrade-tab";
import { DisplayTab } from "@/components/vault/display-tab";
import { PrefsTab } from "@/components/vault/prefs-tab";

type Tab = "display" | "prefs" | "auto";

const NAV = [
  { id: "display" as Tab, icon: "📊", label: "Display" },
  { id: "prefs"   as Tab, icon: "⚙️",  label: "Prefs"   },
  { id: "auto"    as Tab, icon: "🤖", label: "AutoTrade" },
] as const;

export default function DashboardPage() {
  const { isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("display");

  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px" }}>
      <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* ── HEADER ── */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 0 13px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{
              width: "30px", height: "30px", background: "#F0B90B", borderRadius: "6px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-mono), monospace", fontWeight: 700, fontSize: "12px", color: "#0B0E11",
            }}>AV</div>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#EAECEF" }}>
              Auto<span style={{ color: "#F0B90B" }}>Vault</span>
            </span>
          </div>
          <ConnectButton />
        </header>

        {/* ── CONTENT ── */}
        <div style={{ flex: 1, padding: "20px 0 10px", overflowY: "auto" }}>
          {!isConnected ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
              <p style={{ color: "#474D57", fontSize: "13px" }}>Connect wallet to continue</p>
            </div>
          ) : (
            <>
              <div style={{ display: tab === "display" ? "block" : "none" }}><DisplayTab /></div>
              <div style={{ display: tab === "prefs"   ? "block" : "none" }}><PrefsTab /></div>
              <div style={{ display: tab === "auto"    ? "block" : "none" }}><AutoTradeTab /></div>
            </>
          )}
        </div>

        {/* ── BOTTOM NAV ── */}
        {isConnected && (
          <nav style={{
            display: "flex",
            borderTop: "1px solid var(--border)",
            background: "rgba(11,14,17,0.98)",
            flexShrink: 0,
            position: "sticky", bottom: 0,
          }}>
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  padding: "11px 6px", cursor: "pointer", border: "none", background: "none",
                  color: tab === n.id ? "#F0B90B" : "#474D57",
                  borderTop: `2px solid ${tab === n.id ? "#F0B90B" : "transparent"}`,
                  transition: "color 0.18s",
                  fontFamily: "var(--font-sora), sans-serif",
                }}
              >
                <span style={{ fontSize: "16px" }}>{n.icon}</span>
                <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{n.label}</span>
              </button>
            ))}
          </nav>
        )}

      </div>
    </div>
  );
}
