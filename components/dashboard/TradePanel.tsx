"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Status } from "@/components/ui/Status";
import type { Decision } from "@/lib/seer/decision";
import type { TradeState } from "@/lib/blockchain/transactions";

const DEFAULT_SIZE = 5;

export function TradePanel({
  decision,
  tradeState,
  onExecute,
}: {
  decision: Decision;
  tradeState: TradeState;
  onExecute: (side: "YES" | "NO", size: number) => void;
}) {
  const [size] = useState(DEFAULT_SIZE);
  const side: "YES" | "NO" = decision.direction === "BEARISH" ? "NO" : "YES";
  const inFlight = tradeState.status === "validating" || tradeState.status === "submitting";
  const disabled = decision.direction === "NEUTRAL" || inFlight;

  return (
    <Card label="EXECUTION // WALLET-SIGNED ORDER">
      <dl className="grid grid-cols-2 gap-y-1 font-mono text-sm">
        <dt className="text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">Order Size</dt>
        <dd className="text-right text-text-bright" data-numeric>{size.toFixed(2)} contracts</dd>
        <dt className="text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">Derived Action</dt>
        <dd className="text-right text-text-bright">
          Buy {side} ({decision.direction})
        </dd>
      </dl>
      <div className="mt-3 flex items-center justify-between border-t border-border-dim pt-3">
        <Button disabled={disabled} onClick={() => onExecute(side, size)}>
          Execute {side}
        </Button>
        <Status state={tradeState.status} />
      </div>
      {tradeState.status === "failed" && <p className="mt-2 font-mono text-sm text-error">{tradeState.error}</p>}
    </Card>
  );
}
