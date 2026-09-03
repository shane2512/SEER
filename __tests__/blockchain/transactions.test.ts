import { describe, expect, it } from "vitest";
import { canTransition, nextState, type TradeState } from "@/lib/blockchain/transactions";

describe("canTransition", () => {
  it.each([
    ["idle", "validating", true],
    ["validating", "submitting", true],
    ["submitting", "submitted", true],
    ["submitted", "confirmed", true],
    ["validating", "failed", true],
    ["submitting", "failed", true],
    ["submitted", "failed", true],
    ["idle", "submitted", false],
    ["confirmed", "submitting", false],
    ["failed", "confirmed", false],
  ] as const)("%s -> %s is %s", (from, to, expected) => {
    expect(canTransition(from, to)).toBe(expected);
  });
});

describe("nextState", () => {
  it("applies a legal transition", () => {
    const current: TradeState = { status: "idle" };
    const event: TradeState = { status: "validating", requestId: "r1" };
    expect(nextState(current, event)).toEqual(event);
  });

  it("throws on an illegal transition", () => {
    const current: TradeState = { status: "confirmed", txHash: "0x1", filled: 5, price: 0.6 };
    const event: TradeState = { status: "submitting", requestId: "r1" };
    expect(() => nextState(current, event)).toThrow(/illegal transition/i);
  });
});
