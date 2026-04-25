"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDeposit } from "@/hooks/use-deposit";
import { useState } from "react";

export function DepositForm() {
  const [amount, setAmount] = useState("");
  const { deposit, isPending, isConfirming, isSuccess } = useDeposit();

  return (
    <Card>
      <p className="mb-2 text-sm text-gray-400">Deposit USDC</p>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="100"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="min-w-0 flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
        />
        <Button onClick={() => deposit(amount)} loading={isPending || isConfirming}>
          {isSuccess ? "Done" : "Deposit"}
        </Button>
      </div>
    </Card>
  );
}
