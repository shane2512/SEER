import type { MarketView } from "../dreamdex/event-contracts";
import type { TradeRequest } from "../seer/validation";

export interface RiskLimits {
  maxOrderSize: number;
  maxPriceDeviation: number;
}

export type ValidationResult = { ok: true } | { ok: false; reason: string };

/**
 * Scaled headroom before expiry a trade must clear — a fixed threshold cannot
 * serve every cadence (a 300s minimum would reject every market on a 5-minute
 * venue); scale to a fraction of the time-to-expiry seen at request time
 * instead. Mirrors ec-core's `minLeftSec` (docs/event-contracts.md sharp edge #8).
 */
function headroomMs(remainingMs: number): number {
  return Math.max(30_000, Math.min(300_000, remainingMs * 0.4));
}

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
  if (remainingMs < headroomMs(remainingMs)) {
    return { ok: false, reason: "too close to expiry — inside the required headroom" };
  }
  if (request.size <= 0) {
    return { ok: false, reason: "size must be greater than 0" };
  }
  if (request.size > limits.maxOrderSize) {
    return { ok: false, reason: `size ${request.size} exceeds the configured max of ${limits.maxOrderSize}` };
  }

  const askOrBid = request.side === "YES" ? market.yesAsk : market.yesMid !== null ? 1 - market.yesMid : null;
  if (askOrBid === null) {
    return { ok: false, reason: `no ${request.side} liquidity on the book` };
  }
  if (market.yesMid !== null) {
    const deviation = Math.abs(askOrBid - market.yesMid) / market.yesMid;
    if (deviation > limits.maxPriceDeviation) {
      return { ok: false, reason: `price deviates ${(deviation * 100).toFixed(1)}% from the book mid` };
    }
  }

  return { ok: true };
}
