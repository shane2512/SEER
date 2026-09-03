// lib/dreamdex/markets.ts
//
// Venue-scoped market discovery and on-chain status, adapted from
// somnia-chain/dreamdex-bot-kit's packages/ec-core/src/markets.ts (MIT
// license) — trimmed to what SEER's read path needs.
import type { MarketOnchain, UnifiedMarket } from "@somnia-chain/markets-sdk";
import type { DreamDexConfig } from "./client";

/** The subset of SomniaMarkets this module needs — narrow on purpose so
 *  tests can inject a fake without touching the real SDK/network. */
export interface DreamDexExchange {
  loadMarkets(reload?: boolean): Promise<Record<string, UnifiedMarket>>;
  fetchOrderBook(ref: string, limit?: number): Promise<{ bids: [number, number][]; asks: [number, number][] }>;
  fetchPrice(asset: string): Promise<{ price: number; ema: number; timestamp: number } | null>;
  client: {
    getMarketOnchain(marketId: `0x${string}`): Promise<MarketOnchain>;
    /** Batch-fetch each reference-mode (up/down) market's posted opening
     *  answer. A `SomniaMarketsClient` method, not a top-level package
     *  export — verify this against `node_modules/@somnia-chain/markets-sdk/
     *  dist/somniaMarketsClient.d.ts` if a future SDK version moves it. */
    getOpeningPrices(marketIds: string[]): Promise<Record<string, string | null>>;
  };
}

export interface DreamDexContext {
  exchange: DreamDexExchange;
  config: DreamDexConfig;
}

function venueOf(m: UnifiedMarket): string | null {
  const info = m.info as { venueId?: string | null };
  return info?.venueId ?? null;
}

/**
 * The venue's active binary (Event Contract) markets, optionally narrowed to
 * one underlying asset. Scoped to `config.venueId` when set — DreamDEX venue
 * ids move over time, so an unset venueId means "every active binary market
 * on this deployment" rather than a guess.
 */
export async function activeMarkets(
  ctx: DreamDexContext,
  opts: { asset?: "BTC" | "ETH" } = {},
): Promise<UnifiedMarket[]> {
  const all = Object.values(await ctx.exchange.loadMarkets(true));
  let live = all.filter((m) => m.type === "binary" && m.active);

  if (ctx.config.venueId) {
    const venueId = ctx.config.venueId.toLowerCase();
    live = live.filter((m) => (venueOf(m) ?? "").toLowerCase() === venueId);
  }

  if (opts.asset) {
    live = live.filter((m) => (m.info as { asset?: string }).asset === opts.asset);
  }

  return live;
}

/**
 * A market's authoritative on-chain snapshot. Null on any read failure —
 * callers must treat null as "cannot trade this market right now", never
 * fall back to the indexer's (lagging) status. Sharp edge #1,
 * docs/event-contracts.md.
 */
export async function marketOnchain(ctx: DreamDexContext, market: UnifiedMarket): Promise<MarketOnchain | null> {
  try {
    return await ctx.exchange.client.getMarketOnchain(market.id as `0x${string}`);
  } catch {
    return null;
  }
}

/** The YES / NO tradable symbols for a binary market. */
export function outcomeSymbols(market: UnifiedMarket): { yes: string; no: string } {
  const outs = market.outcomes ?? [];
  return {
    yes: outs[0]?.symbol ?? `${market.symbol}#YES`,
    no: outs[1]?.symbol ?? `${market.symbol}#NO`,
  };
}
