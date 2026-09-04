"use client";
import { useState } from "react";
import type { TradeState } from "@/lib/blockchain/transactions";

export function useTrade() {
  const [state, setState] = useState<TradeState>({ status: "idle" });

  async function execute(marketId: string, side: "YES" | "NO", size: number) {
    setState({ status: "validating", requestId: crypto.randomUUID() });
    try {
      const res = await fetch("/api/trade", { method: "POST", body: JSON.stringify({ marketId, side, size }) });
      const body = await res.json();
      if (!res.ok) {
        setState({ status: "failed", error: body.error ?? "trade failed" });
        return;
      }
      setState(body.state);
    } catch (err) {
      setState({ status: "failed", error: err instanceof Error ? err.message : String(err) });
    }
  }

  return { state, execute };
}
