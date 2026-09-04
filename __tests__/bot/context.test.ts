import { describe, expect, it } from "vitest";
import { requireOperatorConfig, loadRiskLimits } from "@/lib/bot/context";

describe("requireOperatorConfig", () => {
  it("returns the config when BOT_OPERATOR_PRIVATE_KEY is set", () => {
    const config = requireOperatorConfig({
      BOT_OPERATOR_PRIVATE_KEY: "0xdeadbeef",
    } as unknown as NodeJS.ProcessEnv);
    expect(config.privateKey).toBe("0xdeadbeef");
  });

  it("throws a clear error when BOT_OPERATOR_PRIVATE_KEY is missing", () => {
    expect(() => requireOperatorConfig({} as unknown as NodeJS.ProcessEnv)).toThrow(
      /BOT_OPERATOR_PRIVATE_KEY/,
    );
  });
});

describe("loadRiskLimits", () => {
  it("reads configured limits from env", () => {
    const limits = loadRiskLimits({
      MAX_ORDER_SIZE: "10",
      MAX_PRICE_DEVIATION: "0.02",
    } as unknown as NodeJS.ProcessEnv);
    expect(limits).toEqual({ maxOrderSize: 10, maxPriceDeviation: 0.02 });
  });

  it("falls back to safe defaults when unset", () => {
    const limits = loadRiskLimits({} as unknown as NodeJS.ProcessEnv);
    expect(limits.maxOrderSize).toBeGreaterThan(0);
    expect(limits.maxPriceDeviation).toBeGreaterThan(0);
  });

  it("throws instead of silently defeating the guardrail on a malformed MAX_ORDER_SIZE", () => {
    expect(() =>
      loadRiskLimits({ MAX_ORDER_SIZE: "not-a-number" } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/MAX_ORDER_SIZE/);
  });

  it("throws instead of silently defeating the guardrail on a malformed MAX_PRICE_DEVIATION", () => {
    expect(() =>
      loadRiskLimits({ MAX_PRICE_DEVIATION: "0.05x" } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/MAX_PRICE_DEVIATION/);
  });
});
