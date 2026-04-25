"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSetPolicy } from "@/hooks/use-set-policy";
import { parseEther } from "viem";
import { useState } from "react";

export function PolicyForm() {
  const [maxSingle, setMaxSingle] = useState("50");
  const [monthly, setMonthly] = useState("100");
  const [reserve, setReserve] = useState("10");
  const [autoOn, setAutoOn] = useState(true);
  const [risk, setRisk] = useState<0 | 1>(0);
  const { setPolicy, isPending, isConfirming, isSuccess } = useSetPolicy();

  const input =
    "w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white";

  return (
    <Card>
      <p className="mb-3 text-sm text-gray-400">Investment Policy</p>
      <div className="space-y-2">
        <div>
          <label className="text-xs text-gray-500">Max Single (USDC)</label>
          <input
            className={input}
            value={maxSingle}
            onChange={(e) => setMaxSingle(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Monthly Limit (USDC)</label>
          <input
            className={input}
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Min Reserve (USDC)</label>
          <input
            className={input}
            value={reserve}
            onChange={(e) => setReserve(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="auto"
            type="checkbox"
            checked={autoOn}
            onChange={(e) => setAutoOn(e.target.checked)}
          />
          <label htmlFor="auto" className="text-sm text-gray-300">
            Auto-Invest Enabled
          </label>
        </div>
        <div className="flex gap-2">
          {(["LOW", "MEDIUM"] as const).map((label, i) => (
            <button
              key={label}
              onClick={() => setRisk(i as 0 | 1)}
              className={
                risk === i
                  ? "rounded bg-yellow-400 px-3 py-1 text-xs font-semibold text-black"
                  : "rounded bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-400"
              }
            >
              {label}
            </button>
          ))}
        </div>
        <Button
          className="mt-2 w-full"
          loading={isPending || isConfirming}
          onClick={() =>
            setPolicy({
              maxSingleInvestment: parseEther(maxSingle),
              monthlyLimit: parseEther(monthly),
              minReserve: parseEther(reserve),
              autoInvestEnabled: autoOn,
              riskLevel: risk,
            })
          }
        >
          {isSuccess ? "Saved" : "Save Policy"}
        </Button>
      </div>
    </Card>
  );
}
