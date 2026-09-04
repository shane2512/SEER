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
    // flat 30s floor (see the Note below Step 3 on why this isn't scaled)
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

  it("rejects a NaN size (NaN compares false against every bound, so a naive <=/> check lets it through)", () => {
    const result = validateTrade(market(), request({ size: Number.NaN }), LIMITS, NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid side value at runtime, not just at the type level", () => {
    const result = validateTrade(market(), request({ side: "UP" as unknown as "YES" }), LIMITS, NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects when the book has no liquidity on the requested side", () => {
    const result = validateTrade(market({ yesAsk: null, yesMid: null }), request({ side: "YES" }), LIMITS, NOW);
    expect(result).toEqual({ ok: false, reason: expect.stringMatching(/liquidity|book/i) });
  });

  it("rejects a YES trade when the book is one-sided (yesAsk present, no yesMid reference) instead of silently skipping the price check", () => {
    // A partial book is a real, reachable state — yesMid is null whenever
    // EITHER side is missing (see normalizeMarkets), not just when both are.
    // The price-deviation guardrail must fail CLOSED here, not fall through
    // to { ok: true } because there's technically an ask to read.
    const result = validateTrade(
      market({ yesAsk: 0.7, yesBid: null, yesMid: null }),
      request({ side: "YES" }),
      LIMITS,
      NOW,
    );
    expect(result.ok).toBe(false);
  });

  it("accepts a well-formed NO-side trade, comparing against the NO-side reference (not the YES mid)", () => {
    // side NO on the default market: askOrBid = 1 - yesBid = 0.4,
    // referenceMid = 1 - yesMid = 0.39 -> ~2.6% deviation, within the 5% limit.
    expect(validateTrade(market(), request({ side: "NO" }), LIMITS, NOW)).toEqual({ ok: true });
  });

  it("accepts a NO-side trade on a heavily skewed market with a normal absolute spread that the old relative-only check would have wrongly rejected", () => {
    // referenceMid (NO) = 1 - 0.99 = 0.01; askOrBid (NO) = 1 - 0.988 = 0.012.
    // Absolute gap is 0.002 -- a perfectly ordinary spread -- but relative
    // to a 1% reference that's a 20% "deviation" under a plain-relative
    // formula, which wrongly rejects a healthy book purely because the
    // reference sits near zero. Confirmed live against a real market
    // (BTC-...-36E0, NO side, reported 72.4%) before this fix. Flooring
    // the denominator at 0.05 brings this synthetic case to 4%, within
    // the 5% limit.
    const result = validateTrade(
      market({ yesBid: 0.988, yesAsk: 0.992, yesMid: 0.99 }),
      request({ side: "NO" }),
      LIMITS,
      NOW,
    );
    expect(result).toEqual({ ok: true });
  });

  it("still rejects a genuinely bad price deviation on a near-boundary market — the floor narrows the false-positive zone, it doesn't disable the guardrail", () => {
    // Same 1% NO reference as above, but a real 4-cent gap this time
    // (askOrBid 0.05 vs referenceMid 0.01) -- 80% even after flooring.
    const result = validateTrade(
      market({ yesBid: 0.95, yesAsk: 0.995, yesMid: 0.99 }),
      request({ side: "NO" }),
      LIMITS,
      NOW,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects when the market is missing entirely (null passed as not-found sentinel)", () => {
    const result = validateTrade(market({ status: "Voided" }), request(), LIMITS, NOW);
    expect(result.ok).toBe(false);
  });
});
