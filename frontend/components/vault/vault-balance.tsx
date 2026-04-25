"use client";

import { Card } from "@/components/ui/card";
import { useVaultBalance } from "@/hooks/use-vault-balance";
import { fmt } from "@/lib/utils";

export function VaultBalance() {
  const { data, isLoading } = useVaultBalance();
  const balance = data as bigint | undefined;

  return (
    <Card>
      <p className="text-sm text-gray-400">Vault Balance</p>
      <p className="mt-1 text-2xl font-bold text-yellow-400">
        {isLoading ? "..." : `${fmt(balance ?? 0n)} USDC`}
      </p>
    </Card>
  );
}
