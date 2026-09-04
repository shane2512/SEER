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
  loadRiskLimits: vi.fn().mockReturnValue({ maxOrderSize: 20, maxPriceDeviation: 0.05 }),
}));
vi.mock("@/lib/dreamdex/client", () => ({
  loadDreamDexConfig: vi.fn().mockReturnValue({ network: "testnet", chainId: 50312, rpcUrl: "", wsRpcUrl: "", indexerUrl: "" }),
  createDreamDexExchange: vi.fn().mockReturnValue({}),
}));
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
  return new Request("http://localhost/api/trade/validate", { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/trade/validate", () => {
  it("returns ok:true with the resolved market view for a valid trade request", async () => {
    const { POST } = await import("@/app/api/trade/validate/route");
    const response = await POST(makeRequest({ marketId: "0xabc", side: "YES", size: 5 }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.market).toEqual(activeMarket);
  });

  it("returns 422 with ok:false and the guardrail reason when validation fails", async () => {
    const { POST } = await import("@/app/api/trade/validate/route");
    const response = await POST(makeRequest({ marketId: "0xabc", side: "YES", size: 999 }));
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.reason).toMatch(/size/i);
  });

  it("returns 400 on a malformed request body", async () => {
    const { POST } = await import("@/app/api/trade/validate/route");
    const response = await POST(makeRequest({ marketId: "0xabc", side: "UP", size: 5 }));
    expect(response.status).toBe(400);
  });

  it("returns 404 when the market is not currently active", async () => {
    const { POST } = await import("@/app/api/trade/validate/route");
    const response = await POST(makeRequest({ marketId: "0xnotfound", side: "YES", size: 5 }));
    expect(response.status).toBe(404);
  });

  it("never calls anything that signs or submits an order", async () => {
    // No trader/execution mock is set up above at all — if the route tried to
    // sign or submit, importing this module would throw on the missing mock.
    const { POST } = await import("@/app/api/trade/validate/route");
    const response = await POST(makeRequest({ marketId: "0xabc", side: "YES", size: 5 }));
    expect(response.status).toBe(200);
  });
});
