// lib/dreamdex/event-contracts.ts
//
// getOpeningPrices is deliberately NOT imported from "@somnia-chain/markets-sdk"
// here — it exists in the package's markets.d.ts but is not re-exported from
// index.d.ts, so `import { getOpeningPrices } from "@somnia-chain/markets-sdk"`
// does not compile. It is reachable as ctx.exchange.client.getOpeningPrices
// (a SomniaMarketsClient method — see DreamDexExchange in lib/dreamdex/markets.ts).
import { boundaryPrice, type BinaryMarket, type UnifiedMarket } from "@somnia-chain/markets-sdk";
import { marketOnchain, outcomeSymbols, type DreamDexContext } from "./markets";

export type MarketStatus = "Listed" | "Trading" | "Locked" | "Settling" | "Resolved" | "Voided";

const STATUS_BY_CODE: Record<number, MarketStatus> = {
  0: "Listed",
  1: "Trading",
  2: "Locked",
  3: "Settling",
  4: "Resolved",
  5: "Voided",
};

export interface MarketView {
  marketId: `0x${string}`;
  symbol: string;
  asset: "BTC" | "ETH";
  referenceKind: "strike" | "opening";
  /** null only for an "opening" market whose oracle hasn't posted yet — a
   *  real and temporary state, not an error. */
  referencePrice: number | null;
  expiryMs: number;
  status: MarketStatus;
  yesBid: number | null;
  yesAsk: number | null;
  yesMid: number | null;
  spread: number | null;
}

interface NormalizeDeps {
  /** Injectable for tests; defaults to ctx.exchange.client.getOpeningPrices
   *  (bound at call time, since that method lives on the context's exchange,
   *  not on a top-level SDK export). */
  fetchOpeningPrices?: (ids: string[]) => Promise<Record<string, string | null>>;
}

/**
 * Turn discovered UnifiedMarkets into SEER's app-facing MarketView, resolving
 * each market's authoritative on-chain status and settlement reference price
 * (fixed strike, or the posted opening answer for an up/down market —
 * boundaryPrice()/getOpeningPrices() are the SDK's own answer to which case
 * applies, not a guess made here).
 */
export async function normalizeMarkets(
  ctx: DreamDexContext,
  markets: UnifiedMarket[],
  deps: NormalizeDeps = {},
): Promise<MarketView[]> {
  const fetchOpeningPrices = deps.fetchOpeningPrices ?? ((ids) => ctx.exchange.client.getOpeningPrices(ids));
  const binaryInfos = markets.map((m) => m.info as unknown as BinaryMarket);
  const referenceIds = binaryInfos.filter((info) => info.mode === "reference").map((info) => info.id);
  const openingPrices = referenceIds.length > 0 ? await fetchOpeningPrices(referenceIds) : {};

  const views: MarketView[] = [];
  for (const market of markets) {
    const info = market.info as unknown as BinaryMarket;
    const onchain = await marketOnchain(ctx, market);
    if (!onchain) continue; // cannot show a market whose live status is unreadable

    const boundary = boundaryPrice({ id: info.id, strike: info.strike, mode: info.mode }, openingPrices);
    const referenceKind: "strike" | "opening" = info.mode === "reference" ? "opening" : "strike";
    const referencePrice = boundary ? Number(boundary.raw) : null;

    const { yes } = outcomeSymbols(market);
    const book = await ctx.exchange.fetchOrderBook(yes, 3);
    const yesBid = book.bids[0]?.[0] ?? null;
    const yesAsk = book.asks[0]?.[0] ?? null;
    const yesMid = yesBid !== null && yesAsk !== null ? (yesBid + yesAsk) / 2 : null;
    const spread = yesBid !== null && yesAsk !== null ? yesAsk - yesBid : null;

    views.push({
      marketId: market.id as `0x${string}`,
      symbol: market.symbol,
      asset: (info.asset as "BTC" | "ETH") ?? "BTC",
      referenceKind,
      referencePrice,
      expiryMs: Number(onchain.expiry) * 1000,
      status: STATUS_BY_CODE[onchain.status] ?? "Listed",
      yesBid,
      yesAsk,
      yesMid,
      spread,
    });
  }
  return views;
}
