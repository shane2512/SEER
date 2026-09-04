"use client";
import { useState } from "react";
import { useWalletClient } from "wagmi";
import type { TradeState } from "@/lib/blockchain/transactions";
import { createBrowserDreamDexExchange } from "@/lib/dreamdex/browserClient";
import { submitTrade, type TradeExecutor } from "@/lib/bot/execution";
import type { MarketView } from "@/lib/dreamdex/event-contracts";

export function useTrade() {
  const [state, setState] = useState<TradeState>({ status: "idle" });
  const { data: walletClient } = useWalletClient();

  async function execute(marketId: string, side: "YES" | "NO", size: number) {
    if (!walletClient) {
      setState({ status: "failed", error: "Connect a wallet before trading." });
      return;
    }

    const requestId = crypto.randomUUID();
    setState({ status: "validating", requestId });
    try {
      const res = await fetch("/api/trade/validate", {
        method: "POST",
        body: JSON.stringify({ marketId, side, size }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setState({ status: "failed", error: body.reason ?? body.error ?? "trade validation failed" });
        return;
      }
      const market = body.market as MarketView;

      setState({ status: "submitting", requestId });
      const exchange = createBrowserDreamDexExchange(walletClient);
      const result = await submitTrade(exchange as unknown as TradeExecutor, market, { marketId, side, size });
      if (!result.ok) {
        setState({ status: "failed", error: result.error });
        return;
      }
      setState({ status: "confirmed", txHash: result.txHash, filled: result.filled, price: result.price });
    } catch (err) {
      setState({ status: "failed", error: err instanceof Error ? err.message : String(err) });
    }
  }

  return { state, execute };
}
