import OpenAI from "openai";
import { formatEther, parseEther } from "viem";
import type { AiRecommendation, VaultState } from "./types.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function buildPrompt(state: VaultState): string {
  return `You are an autonomous DeFi investment advisor. Decide whether to invest based on these vault conditions:

Balance: ${formatEther(state.balance)} USDC
Min Reserve: ${formatEther(state.policy.minReserve)} USDC
Max Single Investment: ${formatEther(state.policy.maxSingleInvestment)} USDC
Monthly Limit: ${formatEther(state.policy.monthlyLimit)} USDC
Already invested this month: ${formatEther(state.monthlyInvested)} USDC
Risk Level: ${state.policy.riskLevel === 0 ? "LOW" : "MEDIUM"}
Auto-invest enabled: ${state.policy.autoInvestEnabled}

Rules:
1. Never invest if autoInvestEnabled is false
2. amount <= maxSingleInvestment
3. monthlyInvested + amount <= monthlyLimit
4. balance - amount >= minReserve

If conditions are met, invest the maximum allowed amount. Respond JSON only:
{ "action": "invest" | "skip", "amount": <number, no decimals>, "token": "USDC", "protocol": "aave", "reason": "<one sentence>" }`;
}

export async function getAiRecommendation(
  state: VaultState,
): Promise<AiRecommendation> {
  const res = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: buildPrompt(state) }],
  });

  const content = res.choices[0]?.message.content;
  if (!content) {
    throw new Error("empty OpenAI response");
  }

  const parsed = JSON.parse(content) as {
    action: string;
    amount: number;
    token: string;
    protocol: string;
    reason: string;
  };

  if (parsed.action !== "invest" && parsed.action !== "skip") {
    throw new Error("invalid action");
  }
  if (!Number.isFinite(parsed.amount) || parsed.amount < 0) {
    throw new Error("invalid amount");
  }

  return {
    action: parsed.action,
    amount: parseEther(String(parsed.amount)),
    token: "USDC",
    protocol: "aave",
    reason: parsed.reason,
  };
}
