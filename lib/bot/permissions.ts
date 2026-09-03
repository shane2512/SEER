import type { MarketView } from "../dreamdex/event-contracts";
import type { TradeRequest } from "../seer/validation";

export interface RiskLimits {
  maxOrderSize: number;
  maxPriceDeviation: number;
}

export type ValidationResult = { ok: true } | { ok: false; reason: string };

/**
 * Minimum time-before-expiry a trade must clear. This is a FLAT floor, not a
 * scaled-per-cadence threshold. An earlier draft tried to scale it as a
 * fraction of the *remaining* time — `Math.max(30_000, Math.min(300_000,
 * remainingMs * 0.4))` — but that is mathematically inert: `remainingMs *
 * 0.4` is always less than `remainingMs` itself, so the comparison
 * `remainingMs < headroom` can only ever fire when the 30s floor already
 * dominates, for every cadence. ec-core's own `headroomSec` avoids this by
 * scaling off the market's FIXED interval (`expiry - tradingStart`, a
 * constant), never off the shrinking remaining time — but `MarketView`
 * doesn't carry that interval field, and adding it is out of scope for the
 * MVP. A flat 30s floor is an honest, safe minimum for every cadence this
 * venue runs today (shortest is ~1 minute) — revisit if per-cadence scaling
 * is ever needed, by adding an interval field to MarketView first.
 */
const MIN_HEADROOM_MS = 30_000;

/** Every REQUIREMENTS.md FR-07 guardrail, checked before any signing occurs. */
export function validateTrade(
  market: MarketView,
  request: TradeRequest,
  limits: RiskLimits,
  now: number,
): ValidationResult {
  if (market.marketId !== request.marketId) {
    return { ok: false, reason: "market does not match the trade request" };
  }
  if (market.status !== "Trading") {
    return { ok: false, reason: `market status is ${market.status}, not Trading` };
  }
  const remainingMs = market.expiryMs - now;
  if (remainingMs <= 0) {
    return { ok: false, reason: "market has already expired" };
  }
  if (remainingMs < MIN_HEADROOM_MS) {
    return { ok: false, reason: "too close to expiry — inside the required headroom" };
  }
  if (request.side !== "YES" && request.side !== "NO") {
    return { ok: false, reason: `invalid side: ${String(request.side)}` };
  }
  // !(x > 0) and !(x <= max), not the negated forms, so a NaN size (which
  // compares false against every bound) is rejected rather than silently
  // passing both checks.
  if (!(request.size > 0)) {
    return { ok: false, reason: "size must be greater than 0" };
  }
  if (!(request.size <= limits.maxOrderSize)) {
    return { ok: false, reason: `size ${request.size} exceeds the configured max of ${limits.maxOrderSize}` };
  }

  // The book only carries YES bid/ask (MarketView has no NO fields) — the
  // venue itself quotes everything in YES terms, and "a NO order's price is
  // the complement" (docs/event-contracts.md sharp edge #7), so a NO ask is
  // `1 - yesBid` and a NO reference mid is `1 - yesMid`, never `yesMid`
  // itself. Comparing a NO price against the YES mid (an earlier draft's
  // bug) tests proximity to 0.5, not real NO-side book health.
  //
  // Fail CLOSED whenever either the tradable price or the reference mid is
  // unavailable — a one-sided book (yesAsk set, yesBid/yesMid null) is a
  // real, reachable MarketView state, not just a fully-empty one, and must
  // reject rather than silently skip the deviation check.
  const askOrBid = request.side === "YES" ? market.yesAsk : market.yesBid !== null ? 1 - market.yesBid : null;
  const referenceMid =
    market.yesMid === null ? null : request.side === "YES" ? market.yesMid : 1 - market.yesMid;
  if (askOrBid === null || referenceMid === null) {
    return { ok: false, reason: `no ${request.side} liquidity or reference price on the book` };
  }
  const deviation = Math.abs(askOrBid - referenceMid) / referenceMid;
  if (deviation > limits.maxPriceDeviation) {
    return { ok: false, reason: `price deviates ${(deviation * 100).toFixed(1)}% from the book mid` };
  }

  return { ok: true };
}
