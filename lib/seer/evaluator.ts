//
// Ported from somnia-chain/dreamdex-bot-kit's
// strategies/ec-oracle-follow/src/signal.ts (MIT license): the strike/
// momentum directional model and its rolling spot-history buffer. Math is
// unchanged; only the live price-feed plumbing was trimmed (SEER's API route
// owns that, see Task 14).

export interface Spot {
  price: number;
  at: number;
}

/** Per-asset ring of recent spot observations. */
export class SpotHistory {
  private readonly samples = new Map<string, Spot[]>();
  private readonly retainMs: number;

  constructor(
    private readonly windowMs: number,
    private readonly maxAgeMs: number,
    retainMs = windowMs * 2,
  ) {
    this.retainMs = Math.max(retainMs, windowMs * 2);
  }

  record(asset: string, s: Spot): void {
    const arr = this.samples.get(asset) ?? [];
    if (arr.length > 0 && arr[arr.length - 1]!.at === s.at) return;
    arr.push(s);
    const cutoff = s.at - this.retainMs;
    while (arr.length > 0 && arr[0]!.at < cutoff) arr.shift();
    this.samples.set(asset, arr);
  }

  /** Return over the lookback window, or null while warming up or stale. */
  momentum(asset: string, now: number): { spot: number; r: number } | null {
    const arr = this.samples.get(asset);
    if (!arr || arr.length < 2) return null;

    const latest = arr[arr.length - 1]!;
    if (now - latest.at > this.maxAgeMs) return null;

    const target = latest.at - this.windowMs;
    if (arr[0]!.at > target) return null;

    let lag = arr[0]!;
    for (const s of arr) {
      if (s.at <= target) lag = s;
      else break;
    }
    if (!(lag.price > 0)) return null;
    return { spot: latest.price, r: (latest.price - lag.price) / lag.price };
  }
}

const clamp = (p: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, p));
const NORMAL_CDF_K = Math.sqrt(2 / Math.PI);

export interface ModelInput {
  spot: number;
  r: number;
  strike: number | null;
  timeToExpiryMs: number | null;
  windowMs: number;
  expectedMove: number;
  sensitivity: number;
  model: "strike" | "momentum";
  anchorUp: number;
}

export interface Estimate {
  pUp: number;
  tilt: number;
  anchored: boolean;
}

/**
 * The model's P(up) and its signed gap to the market's own implied P(up).
 * `strike` mode produces a standalone fair value from moneyness + momentum
 * drift; `momentum` mode (used when strike/expiry are unreadable) is anchor
 * plus a momentum tilt.
 */
export function estimateUp(i: ModelInput): Estimate {
  const PMIN = 0.05;
  const PMAX = 0.95;

  const strikeAware =
    i.model === "strike" && i.strike !== null && i.timeToExpiryMs !== null;
  if (!strikeAware) {
    const anchor = clamp(i.anchorUp, PMIN, PMAX);
    const raw = i.sensitivity * i.r;
    const room = raw > 0 ? PMAX - anchor : anchor - PMIN;
    const tilt = Math.sign(raw) * Math.min(Math.abs(raw), Math.max(room, 0));
    return { pUp: anchor + tilt, tilt, anchored: true };
  }

  const horizons = Math.max(i.timeToExpiryMs! / i.windowMs, 0.05);
  const moneyness = (i.spot - i.strike!) / i.strike!;
  const drift = i.r * Math.sqrt(horizons);
  const scale = i.expectedMove * Math.sqrt(horizons);
  if (!(scale > 0)) return { pUp: i.anchorUp, tilt: 0, anchored: false };

  const z = (moneyness + drift) / scale;
  const pUp = clamp(0.5 + 0.5 * Math.tanh(NORMAL_CDF_K * z), PMIN, PMAX);
  return { pUp, tilt: pUp - i.anchorUp, anchored: false };
}
