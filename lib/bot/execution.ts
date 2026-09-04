import { outcomeSymbols } from "../dreamdex/markets";
import type { MarketView } from "../dreamdex/event-contracts";
import type { TradeRequest } from "../seer/validation";
import type { UnifiedMarket } from "@somnia-chain/markets-sdk";

/** The subset of SomniaMarkets execution needs — narrow so tests inject a
 *  fake instead of touching the real SDK/network. */
export interface TradeExecutor {
  createOrder(
    ref: string,
    type: "limit" | "market",
    side: "buy" | "sell",
    amount: number,
    price?: number,
    params?: { timeInForce?: "IOC" },
  ): Promise<{ id: string; status: string; filled: number; price?: number; txHash?: string }>;
}

export type ExecutionResult =
  | { ok: true; txHash: string; filled: number; price: number; orderStatus: string }
  | { ok: false; error: string };

/**
 * Submit a trade as an IOC cross (deliberate choice over resting post-only —
 * see spec §8 self-review) a touch through the visible touch, so the demo
 * gets an immediate fill/confirmation rather than a resting order.
 */
export async function submitTrade(
  executor: TradeExecutor,
  market: MarketView,
  request: TradeRequest,
): Promise<ExecutionResult> {
  // Build a minimal UnifiedMarket-shaped object for outcomeSymbols(); the
  // real caller (Task 15) has the actual UnifiedMarket already loaded and
  // should pass outcomeSymbols(market) in directly rather than reconstructing
  // it — this inline shape exists only so execution.ts stays independently
  // testable without importing the whole markets.ts discovery path.
  const { yes, no } = outcomeSymbols({ symbol: market.symbol, outcomes: undefined } as unknown as UnifiedMarket);
  const ref = request.side === "YES" ? yes : no;

  const touch = request.side === "YES" ? market.yesAsk : market.yesMid !== null ? 1 - market.yesMid : null;
  if (touch === null) {
    return { ok: false, error: `no ${request.side} liquidity to cross` };
  }
  const cross = request.side === "YES" ? Math.min(0.99, touch + 0.002) : Math.min(0.99, touch + 0.002);

  try {
    const order = await executor.createOrder(ref, "limit", "buy", request.size, cross, { timeInForce: "IOC" });
    if (order.filled <= 0) {
      return { ok: false, error: `order ${order.status} with no fill (IOC did not cross)` };
    }
    return {
      ok: true,
      txHash: order.txHash ?? "",
      filled: order.filled,
      price: order.price ?? cross,
      orderStatus: order.status,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
