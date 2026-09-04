// __tests__/api/markets.test.ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dreamdex/client", () => ({
  loadDreamDexConfig: vi.fn().mockReturnValue({ network: "testnet", chainId: 50312, rpcUrl: "", wsRpcUrl: "", indexerUrl: "" }),
  createDreamDexExchange: vi.fn().mockReturnValue({}),
}));
vi.mock("@/lib/dreamdex/markets", () => ({
  activeMarkets: vi.fn().mockResolvedValue([{ id: "0x1", symbol: "BTC-95000-31DEC26/USDC" }]),
}));
vi.mock("@/lib/dreamdex/event-contracts", () => ({
  normalizeMarkets: vi.fn().mockResolvedValue([
    {
      marketId: "0x1",
      symbol: "BTC-95000-31DEC26/USDC",
      asset: "BTC",
      referenceKind: "strike",
      referencePrice: 95000,
      expiryMs: 1_800_300_000_000,
      status: "Trading",
      yesBid: 0.6,
      yesAsk: 0.62,
      yesMid: 0.61,
      spread: 0.02,
    },
  ]),
}));

describe("GET /api/markets", () => {
  it("returns normalized markets as JSON", async () => {
    const { GET } = await import("@/app/api/markets/route");
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.markets).toHaveLength(1);
    expect(body.markets[0].symbol).toBe("BTC-95000-31DEC26/USDC");
  });

  it("returns a 502 with a structured error when the exchange read fails", async () => {
    const { activeMarkets } = await import("@/lib/dreamdex/markets");
    vi.mocked(activeMarkets).mockRejectedValueOnce(new Error("indexer unavailable"));

    const { GET } = await import("@/app/api/markets/route");
    const response = await GET();
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toMatch(/market/i);
    expect(body.error).not.toMatch(/indexer unavailable/); // no raw internal detail leaked
  });
});
