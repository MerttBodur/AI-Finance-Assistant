import "dotenv/config";

import cron from "node-cron";
import { createServer } from "http";
import { formatEther, type Address } from "viem";
import { getAiRecommendation } from "./ai.js";
import { callAutoInvest, getVaultState } from "./chain.js";
import type { VaultState } from "./types.js";

const DEMO_MODE = process.env.DEMO_MODE === "true";
const PORT = Number(process.env.PORT ?? 3001);

// ── In-memory trade log ───────────────────────────────────────────────────────

type TradeRecord = {
  id: number;
  timestamp: string;
  user: string;
  action: "invest" | "skip";
  amount: string; // formatted USDC
  reason: string;
};

const trades: TradeRecord[] = [];
let nextId = 1;

function recordTrade(
  user: string,
  action: "invest" | "skip",
  amount: bigint,
  reason: string,
): void {
  trades.unshift({
    id: nextId++,
    timestamp: new Date().toISOString(),
    user,
    action,
    amount: Number(formatEther(amount)).toFixed(2),
    reason,
  });
  if (trades.length > 50) trades.pop();
}

// ── Demo vault state ──────────────────────────────────────────────────────────

const DEMO_USER = "0xDEMO000000000000000000000000000000000001" as Address;

function getDemoState(): VaultState {
  const invested = trades
    .filter((t) => t.action === "invest")
    .reduce((sum, t) => sum + BigInt(Math.round(Number(t.amount) * 1e18)), 0n);

  return {
    user: DEMO_USER,
    balance: 5_000n * 10n ** 18n - invested,
    monthlyInvested: invested,
    policy: {
      maxSingleInvestment: 500n * 10n ** 18n,
      monthlyLimit: 1_000n * 10n ** 18n,
      minReserve: 500n * 10n ** 18n,
      autoInvestEnabled: true,
      riskLevel: 1,
    },
  };
}

// ── HTTP server ───────────────────────────────────────────────────────────────

createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/trades" && req.method === "GET") {
    res.end(JSON.stringify(trades));
  } else if (req.url === "/health" && req.method === "GET") {
    res.end(JSON.stringify({ ok: true, demo: DEMO_MODE }));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  }
}).listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});

// ── Cron cycle ────────────────────────────────────────────────────────────────

const ACTIVE_USERS: Address[] = DEMO_MODE
  ? [DEMO_USER]
  : (process.env.ACTIVE_USERS ?? "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
      .map((a) => a as Address);

async function runCycle(): Promise<void> {
  console.log(`[executor] cycle start - ${new Date().toISOString()}`);

  for (const user of ACTIVE_USERS) {
    try {
      const state = DEMO_MODE ? getDemoState() : await getVaultState(user);

      if (!state.policy.autoInvestEnabled) {
        console.log(`[executor] ${user}: auto-invest disabled, skip`);
        continue;
      }

      const rec = await getAiRecommendation(state);
      console.log(
        `[executor] ${user}: AI -> ${rec.action} ${formatEther(rec.amount)} USDC - ${rec.reason}`,
      );

      recordTrade(user, rec.action, rec.amount, rec.reason);

      if (!DEMO_MODE && rec.action === "invest" && rec.amount > 0n) {
        await callAutoInvest(user, rec.amount);
      }
    } catch (err) {
      console.error(`[executor] ${user}: error -`, err);
    }
  }

  console.log("[executor] cycle done");
}

cron.schedule("*/2 * * * *", runCycle);
console.log(`[executor] started - cron every 2 min - demo=${DEMO_MODE}`);

runCycle();
