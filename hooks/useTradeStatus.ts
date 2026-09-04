"use client";
import { useEffect, useState } from "react";
import type { TradeState } from "@/lib/blockchain/transactions";

export function useTradeStatus(txHash: string | null) {
  const [state, setState] = useState<TradeState | null>(null);

  useEffect(() => {
    if (!txHash) return;
    let cancelled = false;
    const poll = () =>
      fetch(`/api/trade/status?txHash=${txHash}`)
        .then((res) => res.json())
        .then((body) => {
          if (!cancelled) setState(body.state);
        })
        .catch(() => undefined);

    poll();
    const id = setInterval(poll, 3_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [txHash]);

  return { state };
}
