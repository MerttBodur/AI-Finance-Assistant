"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEmergencyStop } from "@/hooks/use-emergency-stop";

export function EmergencyStop() {
  const { pause, unpause, isPending, isConfirming } = useEmergencyStop();

  return (
    <Card>
      <p className="mb-2 text-sm text-gray-400">Emergency Controls</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="destructive"
          loading={isPending || isConfirming}
          onClick={() => pause()}
        >
          Pause Vault
        </Button>
        <Button
          variant="outline"
          loading={isPending || isConfirming}
          onClick={() => unpause()}
        >
          Unpause
        </Button>
      </div>
    </Card>
  );
}
