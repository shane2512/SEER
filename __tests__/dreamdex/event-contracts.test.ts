import { describe, expect, it, vi } from "vitest";
import { normalizeMarkets } from "@/lib/dreamdex/event-contracts";
import type { DreamDexContext } from "@/lib/dreamdex/markets";
import type { UnifiedMarket, MarketOnchain } from "@somnia-chain/markets-sdk";

function fixedStrikeMarket(): UnifiedMarket {
  return {
    id: "0xFIXED",
    symbol: "BTC-95000-31DEC26/USDC",
    type: "binary",
    active: true,
    outcomes: [
      { symbol: "BTC-95000-31DEC26/USDC#YES", label: "YES", index: 0 },
      { symbol: "BTC-95000-31DEC26/USDC#NO", label: "NO", index: 1 },
    ],
    info: { marketType: "BINARY", id: "0xfixed", asset: "BTC", strike: "95000", mode: "fixed" },
  } as unknown as UnifiedMarket;
}

function referenceMarket(): UnifiedMarket {
  return {
    id: "0xREF",
    symbol: "ETH-0-05AUG26/USDC",
    type: "binary",
    active: true,
    outcomes: [
      { symbol: "ETH-0-05AUG26/USDC#YES", label: "YES", index: 0 },
      { symbol: "ETH-0-05AUG26/USDC#NO", label: "NO", index: 1 },
    ],
    info: { marketType: "BINARY", id: "0xref", asset: "ETH", strike: "0", mode: "reference" },
  } as unknown as UnifiedMarket;
}

function onchain(overrides: Partial<MarketOnchain> = {}): MarketOnchain {
  return {
    status: 1, // Trading
    expiry: BigInt(1893456000),
    ...overrides,
  } as MarketOnchain;
}

describe("normalizeMarkets", () => {
  it("resolves a fixed-strike market's reference price from strike", async () => {
    const ctx: DreamDexContext = {
      config: { network: "testnet", chainId: 50312, rpcUrl: "", wsRpcUrl: "", indexerUrl: "" },
      exchange: {
        loadMarkets: vi.fn(),
        fetchOrderBook: vi.fn().mockResolvedValue({ bids: [[0.6, 10]], asks: [[0.62, 8]] }),
        fetchPrice: vi.fn(),
        client: { getMarketOnchain: vi.fn().mockResolvedValue(onchain()), getOpeningPrices: vi.fn() },
      },
    };

    const views = await normalizeMarkets(ctx, [fixedStrikeMarket()]);
    const view = views[0]!;

    expect(view.referenceKind).toBe("strike");
    expect(view.referencePrice).toBeCloseTo(95000, 0);
    expect(view.status).toBe("Trading");
    expect(view.yesBid).toBe(0.6);
    expect(view.yesAsk).toBe(0.62);
    expect(view.yesMid).toBeCloseTo(0.61, 5);
    expect(view.spread).toBeCloseTo(0.02, 5);
  });

  it("resolves an up/down market's reference price from the posted opening answer", async () => {
    const ctx: DreamDexContext = {
      config: { network: "testnet", chainId: 50312, rpcUrl: "", wsRpcUrl: "", indexerUrl: "" },
      exchange: {
        loadMarkets: vi.fn(),
        fetchOrderBook: vi.fn().mockResolvedValue({ bids: [], asks: [] }),
        fetchPrice: vi.fn(),
        client: { getMarketOnchain: vi.fn().mockResolvedValue(onchain()), getOpeningPrices: vi.fn() },
      },
    };

    const views = await normalizeMarkets(ctx, [referenceMarket()], {
      // injected opening-price fetcher — overrides the ctx.exchange.client default
      fetchOpeningPrices: async () => ({ "0xref": "350000" }),
    });
    const view = views[0]!;

    expect(view.referenceKind).toBe("opening");
    expect(view.referencePrice).toBeCloseTo(350000, 0);
    expect(view.yesBid).toBeNull();
    expect(view.yesAsk).toBeNull();
    expect(view.yesMid).toBeNull();
  });

  it("maps every on-chain MarketStatus number to its label", async () => {
    const ctx: DreamDexContext = {
      config: { network: "testnet", chainId: 50312, rpcUrl: "", wsRpcUrl: "", indexerUrl: "" },
      exchange: {
        loadMarkets: vi.fn(),
        fetchOrderBook: vi.fn().mockResolvedValue({ bids: [], asks: [] }),
        fetchPrice: vi.fn(),
        client: { getMarketOnchain: vi.fn().mockResolvedValue(onchain({ status: 4 })), getOpeningPrices: vi.fn() },
      },
    };
    const views = await normalizeMarkets(ctx, [fixedStrikeMarket()]);
    const view = views[0]!;
    expect(view.status).toBe("Resolved");
  });
});
