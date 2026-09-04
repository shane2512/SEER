import { describe, expect, it, vi } from "vitest";
import { submitTrade, type TradeExecutor } from "@/lib/bot/execution";
import type { MarketView } from "@/lib/dreamdex/event-contracts";
import type { TradeRequest } from "@/lib/seer/validation";

const market: MarketView = {
  marketId: "0xabc",
  symbol: "BTC-95000-31DEC26/USDC",
  asset: "BTC",
  referenceKind: "strike",
  referencePrice: 95_000,
  expiryMs: Date.now() + 300_000,
  status: "Trading",
  yesBid: 0.6,
  yesAsk: 0.62,
  yesMid: 0.61,
  spread: 0.02,
};

describe("submitTrade", () => {
  it("submits an IOC order on the correct outcome symbol and side", async () => {
    const createOrder = vi.fn().mockResolvedValue({
      id: "1",
      status: "closed",
      filled: 5,
      price: 0.62,
      txHash: "0xTX",
    });
    const executor: TradeExecutor = { createOrder };
    const request: TradeRequest = { marketId: "0xabc", side: "YES", size: 5 };

    const result = await submitTrade(executor, market, request);

    expect(createOrder).toHaveBeenCalledWith(
      expect.stringContaining("#YES"),
      "limit",
      "buy",
      5,
      expect.any(Number),
      { timeInForce: "IOC" },
    );
    expect(result).toEqual({ ok: true, txHash: "0xTX", filled: 5, price: 0.62, orderStatus: "closed" });
  });

  it("reports a canceled (unfilled IOC) order as not ok with a clear reason", async () => {
    const executor: TradeExecutor = {
      createOrder: vi.fn().mockResolvedValue({ id: "1", status: "canceled", filled: 0, txHash: "0xTX" }),
    };
    const request: TradeRequest = { marketId: "0xabc", side: "YES", size: 5 };

    const result = await submitTrade(executor, market, request);
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/no fill|canceled/i) });
  });

  it("maps a thrown ContractRevertError-like error to a failed result", async () => {
    const executor: TradeExecutor = {
      createOrder: vi.fn().mockRejectedValue(new Error("reverted: InvalidPrice")),
    };
    const request: TradeRequest = { marketId: "0xabc", side: "NO", size: 5 };

    const result = await submitTrade(executor, market, request);
    expect(result).toEqual({ ok: false, error: expect.stringContaining("InvalidPrice") });
  });

  it("crosses the NO side from the real NO ask (1 - yesBid), not the NO mid (1 - yesMid)", async () => {
    // yesBid: 0.6 -> real NO ask is 1-0.6=0.4, cross = 0.402.
    // The old (buggy) formula used 1-yesMid=1-0.61=0.39, cross = 0.392 —
    // this assertion pins the correct number so that bug can't come back.
    const createOrder = vi.fn().mockResolvedValue({ id: "1", status: "closed", filled: 5, price: 0.402, txHash: "0xTX" });
    const executor: TradeExecutor = { createOrder };
    const request: TradeRequest = { marketId: "0xabc", side: "NO", size: 5 };

    await submitTrade(executor, market, request);

    expect(createOrder).toHaveBeenCalledWith(
      expect.stringContaining("#NO"),
      "limit",
      "buy",
      5,
      expect.closeTo(0.402, 5),
      { timeInForce: "IOC" },
    );
  });
});
