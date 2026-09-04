import { describe, expect, it, vi } from "vitest";
import { activeMarkets, discoverVenues, marketOnchain, outcomeSymbols, type DreamDexContext } from "@/lib/dreamdex/markets";
import type { UnifiedMarket } from "@somnia-chain/markets-sdk";

function fakeMarket(overrides: Partial<UnifiedMarket> = {}): UnifiedMarket {
  return {
    id: "0x1",
    symbol: "BTC-95000-31DEC26/USDC",
    type: "binary",
    base: "BTC-95000-31DEC26",
    quote: "USDC",
    active: true,
    contract: false,
    precision: { price: 3, amount: 6 },
    limits: { amount: {} },
    outcomes: [
      { symbol: "BTC-95000-31DEC26/USDC#YES", label: "YES", index: 0 },
      { symbol: "BTC-95000-31DEC26/USDC#NO", label: "NO", index: 1 },
    ],
    indexed: true,
    info: { marketType: "BINARY", venueId: "0xVENUE", asset: "BTC" } as unknown as UnifiedMarket["info"],
    ...overrides,
  } as UnifiedMarket;
}

describe("activeMarkets", () => {
  it("returns only active binary markets", async () => {
    const btc = fakeMarket({ active: true });
    const inactive = fakeMarket({ id: "0x2", active: false });
    const spot = fakeMarket({ id: "0x3", type: "spot" });
    const ctx: DreamDexContext = {
      config: { network: "testnet", chainId: 50312, rpcUrl: "", wsRpcUrl: "", indexerUrl: "" },
      exchange: {
        loadMarkets: vi.fn().mockResolvedValue({ "0x1": btc, "0x2": inactive, "0x3": spot }),
        fetchOrderBook: vi.fn(),
        fetchPrice: vi.fn(),
        client: { getMarketOnchain: vi.fn(), getOpeningPrices: vi.fn() },
      },
    };

    const result = await activeMarkets(ctx);
    expect(result).toEqual([btc]);
  });

  it("scopes to venueId when configured", async () => {
    const inScope = fakeMarket({ id: "0x1", info: { marketType: "BINARY", venueId: "0xVENUE" } as unknown as UnifiedMarket["info"] });
    const outOfScope = fakeMarket({ id: "0x2", info: { marketType: "BINARY", venueId: "0xOTHER" } as unknown as UnifiedMarket["info"] });
    const ctx: DreamDexContext = {
      config: { network: "testnet", chainId: 50312, rpcUrl: "", wsRpcUrl: "", indexerUrl: "", venueId: "0xVENUE" },
      exchange: {
        loadMarkets: vi.fn().mockResolvedValue({ "0x1": inScope, "0x2": outOfScope }),
        fetchOrderBook: vi.fn(),
        fetchPrice: vi.fn(),
        client: { getMarketOnchain: vi.fn(), getOpeningPrices: vi.fn() },
      },
    };

    const result = await activeMarkets(ctx);
    expect(result).toEqual([inScope]);
  });
});

describe("discoverVenues", () => {
  it("returns the sorted, de-duplicated venue ids present in a market list", () => {
    const a = fakeMarket({ id: "0x1", info: { marketType: "BINARY", venueId: "0xB" } as unknown as UnifiedMarket["info"] });
    const b = fakeMarket({ id: "0x2", info: { marketType: "BINARY", venueId: "0xA" } as unknown as UnifiedMarket["info"] });
    const c = fakeMarket({ id: "0x3", info: { marketType: "BINARY", venueId: "0xA" } as unknown as UnifiedMarket["info"] });
    expect(discoverVenues([a, b, c])).toEqual(["0xA", "0xB"]);
  });

  it("skips markets with no venueId", () => {
    const noVenue = fakeMarket({ id: "0x1", info: { marketType: "BINARY" } as unknown as UnifiedMarket["info"] });
    expect(discoverVenues([noVenue])).toEqual([]);
  });
});

describe("activeMarkets venueId override", () => {
  it("prefers an explicit opts.venueId over ctx.config.venueId", async () => {
    const inScope = fakeMarket({ id: "0x1", info: { marketType: "BINARY", venueId: "0xREQUESTED" } as unknown as UnifiedMarket["info"] });
    const outOfScope = fakeMarket({ id: "0x2", info: { marketType: "BINARY", venueId: "0xCONFIGURED" } as unknown as UnifiedMarket["info"] });
    const ctx: DreamDexContext = {
      config: { network: "testnet", chainId: 50312, rpcUrl: "", wsRpcUrl: "", indexerUrl: "", venueId: "0xCONFIGURED" },
      exchange: {
        loadMarkets: vi.fn().mockResolvedValue({ "0x1": inScope, "0x2": outOfScope }),
        fetchOrderBook: vi.fn(),
        fetchPrice: vi.fn(),
        client: { getMarketOnchain: vi.fn(), getOpeningPrices: vi.fn() },
      },
    };

    const result = await activeMarkets(ctx, { venueId: "0xREQUESTED" });
    expect(result).toEqual([inScope]);
  });
});

describe("marketOnchain", () => {
  it("returns null when the read throws", async () => {
    const ctx: DreamDexContext = {
      config: { network: "testnet", chainId: 50312, rpcUrl: "", wsRpcUrl: "", indexerUrl: "" },
      exchange: {
        loadMarkets: vi.fn(),
        fetchOrderBook: vi.fn(),
        fetchPrice: vi.fn(),
        client: { getMarketOnchain: vi.fn().mockRejectedValue(new Error("not found")), getOpeningPrices: vi.fn() },
      },
    };
    const result = await marketOnchain(ctx, fakeMarket());
    expect(result).toBeNull();
  });
});

describe("outcomeSymbols", () => {
  it("reads YES/NO from the market's outcomes array", () => {
    const { yes, no } = outcomeSymbols(fakeMarket());
    expect(yes).toBe("BTC-95000-31DEC26/USDC#YES");
    expect(no).toBe("BTC-95000-31DEC26/USDC#NO");
  });
});
