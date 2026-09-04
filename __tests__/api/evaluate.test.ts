import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dreamdex/client", () => ({
  loadDreamDexConfig: vi.fn().mockReturnValue({ network: "testnet", chainId: 50312, rpcUrl: "", wsRpcUrl: "", indexerUrl: "" }),
  createDreamDexExchange: vi.fn().mockReturnValue({
    fetchPrice: vi.fn().mockResolvedValue({ price: 96_000, ema: 95_800, timestamp: Date.now() }),
  }),
}));
vi.mock("@/lib/dreamdex/markets", () => ({
  activeMarkets: vi.fn().mockResolvedValue([{ id: "0xabc", symbol: "BTC-95000-31DEC26/USDC" }]),
}));
vi.mock("@/lib/dreamdex/event-contracts", () => ({
  normalizeMarkets: vi.fn().mockResolvedValue([
    {
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
    },
  ]),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/evaluate", { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/evaluate", () => {
  it("returns a Decision for a known market", async () => {
    const { POST } = await import("@/app/api/evaluate/route");
    const response = await POST(makeRequest({ marketId: "0xabc" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(["BULLISH", "BEARISH", "NEUTRAL"]).toContain(body.decision.direction);
    expect(body.decision.marketId).toBe("0xabc");
  });

  it("returns 400 on an invalid request body", async () => {
    const { POST } = await import("@/app/api/evaluate/route");
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it("returns 404 when the market is not found among active markets", async () => {
    const { POST } = await import("@/app/api/evaluate/route");
    const response = await POST(makeRequest({ marketId: "0xnotfound" }));
    expect(response.status).toBe(404);
  });
});
