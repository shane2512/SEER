import type { Estimate } from "./evaluator";

export type Direction = "BULLISH" | "BEARISH" | "NEUTRAL";

export interface Decision {
  marketId: string;
  direction: Direction;
  confidence: number;
  rationale: string;
  timestamp: number;
}

export interface DecisionContext {
  marketId: string;
  asset: "BTC" | "ETH";
  spot: number;
  referencePrice: number;
  referenceKind: "strike" | "opening";
  timeToExpiryMs: number;
  estimate: Estimate;
  now: number;
}

const fmtUsd = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

function fmtRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m${s}s remaining` : `${s}s remaining`;
}

/**
 * Map a model estimate to SEER's structured decision. The market's own
 * implied probability is the reference point (tilt), not raw P(up) against
 * 0.5 — a market already priced at 0.75 needs a bearish signal to read
 * BEARISH even though raw P(up) is still above half (spec §7 / Estimate.tilt
 * doc in evaluator.ts).
 */
export function toDecision(ctx: DecisionContext, deadzone = 0.03, scale = 0.15): Decision {
  const { tilt } = ctx.estimate;
  const direction: Direction = tilt > deadzone ? "BULLISH" : tilt < -deadzone ? "BEARISH" : "NEUTRAL";
  const confidence = direction === "NEUTRAL" ? 0 : Math.min(1, Math.abs(tilt) / scale);

  const view = direction === "BULLISH" ? "UP" : direction === "BEARISH" ? "DOWN" : "no clear direction";

  // ctx.estimate.anchored is true exactly when estimateUp() took the
  // momentum/anchor fallback branch (evaluator.ts), which happens whenever
  // the caller judged referencePrice too unreliable to compare against spot
  // (see Task 14's plausibility check). In that case referencePrice must NOT
  // be cited as a trusted number in the rationale — the whole point of the
  // fallback was to stop trusting it, and a rationale that cites it anyway
  // silently reintroduces the exact "confident-looking but meaningless"
  // failure the fallback exists to prevent.
  const rationale = ctx.estimate.anchored
    ? `${ctx.asset} spot $${fmtUsd(ctx.spot)}; the ${ctx.referenceKind} price could not be confirmed ` +
      `against live spot, so the model instead follows the market's own implied probability with ` +
      `${fmtRemaining(ctx.timeToExpiryMs)} remaining; model favors ${view}.`
    : (() => {
        const pct = ((Math.abs(ctx.spot - ctx.referencePrice) / ctx.referencePrice) * 100).toFixed(1);
        const side = ctx.spot >= ctx.referencePrice ? "above" : "below";
        const referenceLabel = ctx.referenceKind === "strike" ? "strike" : "opening price";
        return (
          `${ctx.asset} spot $${fmtUsd(ctx.spot)} sits ${pct}% ${side} the $${fmtUsd(ctx.referencePrice)} ` +
          `${referenceLabel} with ${fmtRemaining(ctx.timeToExpiryMs)}; model favors ${view}.`
        );
      })();

  return {
    marketId: ctx.marketId,
    direction,
    confidence,
    rationale,
    timestamp: ctx.now,
  };
}
