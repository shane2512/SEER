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
vi.mock("@/lib/dreamdex/client", () => ({
  createDreamDexExchange: vi.fn().mockReturnValue({ createOrder: vi.fn().mockResolvedValue({ id: "1", status: "closed", filled: 5, price: 0.62, txHash: "0xTX" }) }),
}));
// Partial mock: lib/bot/execution.ts (Task 10's submitTrade) imports the real
// `outcomeSymbols` from this same module by relative path, and vi.mock
// replaces by resolved file, not by import specifier — a full replacement
// here would silently drop `outcomeSymbols` out from under submitTrade too.
// Keep the real exports and stub only what this route test needs to control.
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
