import { describe, expect, it } from "vitest";
import { validateTrade, type RiskLimits } from "@/lib/bot/permissions";
import type { MarketView } from "@/lib/dreamdex/event-contracts";
import type { TradeRequest } from "@/lib/seer/validation";

const NOW = 1_800_000_000_000;
const LIMITS: RiskLimits = { maxOrderSize: 20, maxPriceDeviation: 0.05 };

function market(overrides: Partial<MarketView> = {}): MarketView {
  return {
    marketId: "0xabc" as `0x${string}`,
    symbol: "BTC-95000-31DEC26/USDC",
    asset: "BTC",
    referenceKind: "strike",
    referencePrice: 95_000,
    expiryMs: NOW + 5 * 60_000,
    status: "Trading",
    yesBid: 0.6,
    yesAsk: 0.62,
    yesMid: 0.61,
    spread: 0.02,
    ...overrides,
  };
}

function request(overrides: Partial<TradeRequest> = {}): TradeRequest {
  return { marketId: "0xabc", side: "YES", size: 5, ...overrides };
}

describe("validateTrade", () => {
  it("accepts a well-formed trade on a live, liquid market", () => {
    expect(validateTrade(market(), request(), LIMITS, NOW)).toEqual({ ok: true });
  });

  it("rejects when the on-chain status is not Trading", () => {
    const result = validateTrade(market({ status: "Locked" }), request(), LIMITS, NOW);
    expect(result).toEqual({ ok: false, reason: expect.stringMatching(/status/i) });
  });

  it("rejects when the market has already expired", () => {
    const result = validateTrade(market({ expiryMs: NOW - 1 }), request(), LIMITS, NOW);
    expect(result).toEqual({ ok: false, reason: expect.stringMatching(/expir/i) });
  });

  it("rejects when too little time remains before expiry", () => {
    // headroom scaled to a 5-minute-class market: reject inside the last ~30s
    const result = validateTrade(market({ expiryMs: NOW + 10_000 }), request(), LIMITS, NOW);
    expect(result).toEqual({ ok: false, reason: expect.stringMatching(/headroom|too close|expir/i) });
  });

  it("rejects a size over the configured max", () => {
    const result = validateTrade(market(), request({ size: 21 }), LIMITS, NOW);
    expect(result).toEqual({ ok: false, reason: expect.stringMatching(/size/i) });
  });

  it("accepts a size exactly at the configured max", () => {
    expect(validateTrade(market(), request({ size: 20 }), LIMITS, NOW)).toEqual({ ok: true });
  });

  it("rejects when the book has no liquidity on the requested side", () => {
    const result = validateTrade(market({ yesAsk: null, yesMid: null }), request({ side: "YES" }), LIMITS, NOW);
    expect(result).toEqual({ ok: false, reason: expect.stringMatching(/liquidity|book/i) });
  });

  it("rejects when the market is missing entirely (null passed as not-found sentinel)", () => {
    const result = validateTrade(market({ status: "Voided" }), request(), LIMITS, NOW);
    expect(result.ok).toBe(false);
  });
});
