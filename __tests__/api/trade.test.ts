import { describe, expect, it, vi } from "vitest";

const activeMarket = {
  marketId: "0xabc",
  symbol: "BTC-95000-31DEC26/USDC",
  asset: "BTC",
  referenceKind: "strike",
  referencePrice: 95_000,
  expiryMs: Date.now() + 300_000,
  status: "Trading",
  yesBid: 0.6,
  yesAsk: 0.62,
  yesMid: 0.61,
  spread: 0.02,
};

vi.mock("@/lib/bot/context", () => ({
  requireOperatorConfig: vi.fn().mockReturnValue({ network: "testnet", chainId: 50312, rpcUrl: "", wsRpcUrl: "", indexerUrl: "", privateKey: "0xkey" }),
  loadRiskLimits: vi.fn().mockReturnValue({ maxOrderSize: 20, maxPriceDeviation: 0.05 }),
}));
const mockCreateOrder = vi.fn().mockResolvedValue({ id: "1", status: "closed", filled: 5, price: 0.62, txHash: "0xTX" });
vi.mock("@/lib/dreamdex/client", () => ({
  createDreamDexExchange: vi.fn().mockReturnValue({ createOrder: mockCreateOrder }),
}));
// Partial mock, not a full replacement: lib/bot/execution.ts's submitTrade
// imports outcomeSymbols from this SAME module by relative path, and Vitest
// mocks resolve by file path, not import specifier — a full mock here (just
// { activeMarkets: ... }) silently drops outcomeSymbols too, which makes
// submitTrade throw for every call and the route's catch-all swallow it into
// a spurious 502. Keep the real (pure) exports via importOriginal, stub only
// activeMarkets.
vi.mock("@/lib/dreamdex/markets", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dreamdex/markets")>();
  return {
    ...actual,
    activeMarkets: vi.fn().mockResolvedValue([{ id: "0xabc", symbol: "BTC-95000-31DEC26/USDC" }]),
  };
});
vi.mock("@/lib/dreamdex/event-contracts", () => ({
  normalizeMarkets: vi.fn().mockResolvedValue([activeMarket]),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/trade", { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/trade", () => {
  it("submits a valid trade and returns a submitted/confirmed state", async () => {
    const { POST } = await import("@/app/api/trade/route");
    const response = await POST(makeRequest({ marketId: "0xabc", side: "YES", size: 5 }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(["submitted", "confirmed"]).toContain(body.state.status);
    // Reaching the mock alone doesn't prove the SYMBOL/PRICE sent to the
    // venue were right — assert on the actual call arguments. yesAsk 0.62 ->
    // cross = min(0.99, 0.62+0.002) = 0.622.
    expect(mockCreateOrder).toHaveBeenCalledWith(
      "BTC-95000-31DEC26/USDC#YES",
      "limit",
      "buy",
      5,
      expect.closeTo(0.622, 5),
      { timeInForce: "IOC" },
    );
  });

  it("returns 422 with the guardrail reason when validation fails", async () => {
    const { POST } = await import("@/app/api/trade/route");
    const response = await POST(makeRequest({ marketId: "0xabc", side: "YES", size: 999 }));
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toMatch(/size/i);
  });

  it("returns 400 on a malformed request body", async () => {
    const { POST } = await import("@/app/api/trade/route");
    const response = await POST(makeRequest({ marketId: "0xabc", side: "UP", size: 5 }));
    expect(response.status).toBe(400);
  });
});
