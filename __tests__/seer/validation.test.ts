import { describe, expect, it } from "vitest";
import { evaluateRequestSchema, tradeRequestSchema } from "@/lib/seer/validation";

describe("evaluateRequestSchema", () => {
  it("accepts a valid marketId", () => {
    const result = evaluateRequestSchema.safeParse({ marketId: "0xabc123" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing marketId", () => {
    const result = evaluateRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects an empty-string marketId", () => {
    const result = evaluateRequestSchema.safeParse({ marketId: "" });
    expect(result.success).toBe(false);
  });
});

describe("tradeRequestSchema", () => {
  it("accepts a valid trade request", () => {
    const result = tradeRequestSchema.safeParse({ marketId: "0xabc", side: "YES", size: 5 });
    expect(result.success).toBe(true);
  });

  it("rejects a side other than YES/NO", () => {
    const result = tradeRequestSchema.safeParse({ marketId: "0xabc", side: "UP", size: 5 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive size", () => {
    const result = tradeRequestSchema.safeParse({ marketId: "0xabc", side: "YES", size: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric size", () => {
    const result = tradeRequestSchema.safeParse({ marketId: "0xabc", side: "YES", size: "5" });
    expect(result.success).toBe(false);
  });
});
