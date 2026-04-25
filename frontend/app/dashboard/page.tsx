"use client";

import { EmergencyStop } from "@/components/vault/emergency-stop";
import { DepositForm } from "@/components/vault/deposit-form";
import { PolicyForm } from "@/components/vault/policy-form";
import { VaultBalance } from "@/components/vault/vault-balance";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function DashboardPage() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen bg-gray-950 p-6 text-white">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-yellow-400">Auto-Invest Vault</h1>
          <ConnectButton />
        </div>
        {!isConnected ? (
          <p className="mt-20 text-center text-gray-500">
            Connect wallet to continue.
          </p>
        ) : (
          <>
            <VaultBalance />
            <DepositForm />
            <PolicyForm />
            <EmergencyStop />
          </>
        )}
      </div>
    </main>
  );
}
