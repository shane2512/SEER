import { describe, expect, it } from "vitest";
import { SpotHistory, estimateUp } from "@/lib/seer/evaluator";

describe("SpotHistory.momentum", () => {
  it("returns null before two samples exist", () => {
    const h = new SpotHistory(60_000, 120_000);
    h.record("BTC", { price: 100, at: 0 });
    expect(h.momentum("BTC", 0)).toBeNull();
  });

  it("computes return over the lookback window", () => {
    const h = new SpotHistory(60_000, 120_000);
    h.record("BTC", { price: 100, at: 0 });
    h.record("BTC", { price: 105, at: 60_000 });
    const m = h.momentum("BTC", 60_000);
    expect(m).not.toBeNull();
    expect(m!.spot).toBe(105);
    expect(m!.r).toBeCloseTo(0.05, 5);
  });

  it("returns null when the latest sample is older than maxAgeMs", () => {
    const h = new SpotHistory(60_000, 5_000);
    h.record("BTC", { price: 100, at: 0 });
    h.record("BTC", { price: 105, at: 60_000 });
    expect(h.momentum("BTC", 60_000 + 10_000)).toBeNull();
  });
});

describe("estimateUp", () => {
  const base = {
    spot: 100_000,
    r: 0,
    windowMs: 60_000,
    expectedMove: 0.01,
    sensitivity: 1,
    anchorUp: 0.5,
  };

  it("reads bullish (pUp > anchor) when spot sits above the strike", () => {
    const est = estimateUp({
      ...base,
      strike: 95_000,
      timeToExpiryMs: 120_000,
      model: "strike",
    });
    expect(est.pUp).toBeGreaterThan(0.5);
    expect(est.tilt).toBeGreaterThan(0);
    expect(est.anchored).toBe(false);
  });

  it("reads bearish (pUp < anchor) when spot sits below the strike", () => {
    const est = estimateUp({
      ...base,
      strike: 105_000,
      timeToExpiryMs: 120_000,
      model: "strike",
    });
    expect(est.pUp).toBeLessThan(0.5);
    expect(est.tilt).toBeLessThan(0);
  });

  it("clamps pUp to [0.05, 0.95]", () => {
    const est = estimateUp({
      ...base,
      spot: 200_000,
      strike: 50_000,
      timeToExpiryMs: 1_000,
      expectedMove: 0.001,
      model: "strike",
    });
    expect(est.pUp).toBeLessThanOrEqual(0.95);
    expect(est.pUp).toBeGreaterThanOrEqual(0.05);
  });

  it("falls back to anchor + sensitivity*r when strike/expiry are unavailable", () => {
    const est = estimateUp({
      ...base,
      r: 0.02,
      strike: null,
      timeToExpiryMs: null,
      model: "momentum",
      anchorUp: 0.5,
      sensitivity: 2,
    });
    expect(est.pUp).toBeCloseTo(0.54, 5);
    expect(est.tilt).toBeCloseTo(0.04, 5);
    expect(est.anchored).toBe(true);
  });
});
