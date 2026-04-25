import "dotenv/config";

import cron from "node-cron";
import { formatEther, type Address } from "viem";
import { getAiRecommendation } from "./ai.js";
import { callAutoInvest, getVaultState } from "./chain.js";

const ACTIVE_USERS: Address[] = (process.env.ACTIVE_USERS ?? "")
  .split(",")
  .map((address) => address.trim())
  .filter(Boolean)
  .map((address) => address as Address);

async function runCycle(): Promise<void> {
  console.log(`[executor] cycle start - ${new Date().toISOString()}`);

  for (const user of ACTIVE_USERS) {
    try {
      const state = await getVaultState(user);
      if (!state.policy.autoInvestEnabled) {
        console.log(`[executor] ${user}: auto-invest disabled, skip`);
        continue;
      }

      const rec = await getAiRecommendation(state);
      console.log(
        `[executor] ${user}: AI -> ${rec.action} ${formatEther(rec.amount)} USDC - ${rec.reason}`,
      );

      if (rec.action === "invest" && rec.amount > 0n) {
        await callAutoInvest(user, rec.amount);
      }
    } catch (err) {
      console.error(`[executor] ${user}: error -`, err);
    }
  }

  console.log("[executor] cycle done");
}

cron.schedule("*/2 * * * *", runCycle);
console.log("[executor] started - cron every 2 min");
