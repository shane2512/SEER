import { describe, expect, it } from "vitest";
import { toDecision, type DecisionContext } from "@/lib/seer/decision";

function ctx(tilt: number, overrides: Partial<DecisionContext> = {}): DecisionContext {
  return {
    marketId: "0xabc",
    asset: "BTC",
    spot: 63_912,
    referencePrice: 63_500,
    referenceKind: "strike",
    timeToExpiryMs: 161_000,
    estimate: { pUp: 0.5 + tilt, tilt, anchored: false },
    now: 1_800_000_000_000,
    ...overrides,
  };
}

describe("toDecision", () => {
  it("is BULLISH when tilt exceeds the deadzone", () => {
    const d = toDecision(ctx(0.08));
    expect(d.direction).toBe("BULLISH");
    expect(d.confidence).toBeGreaterThan(0);
    expect(d.confidence).toBeLessThanOrEqual(1);
  });

  it("is BEARISH when tilt is below the negative deadzone", () => {
    const d = toDecision(ctx(-0.08));
    expect(d.direction).toBe("BEARISH");
  });

  it("is NEUTRAL inside the deadzone", () => {
    const d = toDecision(ctx(0.01));
    expect(d.direction).toBe("NEUTRAL");
    expect(d.confidence).toBe(0);
  });

  it("is deterministic: identical input yields identical output", () => {
    const input = ctx(0.08);
    expect(toDecision(input)).toEqual(toDecision(input));
  });

  it("clamps confidence to 1 for a very large tilt", () => {
    const d = toDecision(ctx(0.9));
    expect(d.confidence).toBe(1);
  });

  it("cites spot, the reference price, and time remaining in the rationale", () => {
    const d = toDecision(ctx(0.08));
    expect(d.rationale).toContain("63,912");
    expect(d.rationale).toContain("63,500");
    expect(d.rationale).toMatch(/\d+m\s?\d*s?\s+remaining|remaining/i);
  });

  it("carries the marketId and a timestamp through", () => {
    const d = toDecision(ctx(0.08));
    expect(d.marketId).toBe("0xabc");
    expect(d.timestamp).toBe(1_800_000_000_000);
  });

  it("does NOT cite the reference price in the rationale when estimate.anchored is true (the momentum fallback ran)", () => {
    // anchored: true means estimateUp() took the fallback branch — the
    // caller judged referencePrice too unreliable to trust (see Task 14).
    // The rationale must not cite it as if it were a confirmed number.
    const d = toDecision(ctx(0.08, { estimate: { pUp: 0.58, tilt: 0.08, anchored: true } }));
    expect(d.rationale).not.toContain("63,500");
    expect(d.rationale).toContain("63,912"); // spot is still real data, fine to cite
    expect(d.rationale).toMatch(/could not be confirmed|market's own implied probability/i);
  });
});
