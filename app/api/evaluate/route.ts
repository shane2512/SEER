import { NextResponse } from "next/server";
import { createDreamDexExchange, loadDreamDexConfig } from "@/lib/dreamdex/client";
import { activeMarkets, type DreamDexContext } from "@/lib/dreamdex/markets";
import { normalizeMarkets } from "@/lib/dreamdex/event-contracts";
import { SpotHistory, estimateUp } from "@/lib/seer/evaluator";
import { toDecision } from "@/lib/seer/decision";
import { evaluateRequestSchema } from "@/lib/seer/validation";

// One process-lifetime history per server instance — enough for a single
// hackathon demo session; a multi-instance deploy would need a shared store.
const spotHistory = new SpotHistory(60_000, 120_000);

export async function POST(request: Request) {
  const parsed = evaluateRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid request" }, { status: 400 });
  }
  const { marketId } = parsed.data;

  try {
    const config = loadDreamDexConfig();
    const exchange = createDreamDexExchange(config);
    const ctx: DreamDexContext = { exchange: exchange as never, config };

    const markets = await activeMarkets(ctx);
    const unified = markets.find((m) => m.id === marketId);
    if (!unified) {
      return NextResponse.json({ error: `market ${marketId} is not currently active` }, { status: 404 });
    }
    const [view] = await normalizeMarkets(ctx, [unified]);
    if (!view || view.referencePrice === null) {
      return NextResponse.json({ error: "market has no readable reference price yet" }, { status: 409 });
    }

    const priceReading = await exchange.fetchPrice(view.asset);
    if (!priceReading) {
      return NextResponse.json({ error: "no live price feed reading for this asset" }, { status: 502 });
    }

    const now = Date.now();
    spotHistory.record(view.asset, { price: priceReading.price, at: now });
    const momentum = spotHistory.momentum(view.asset, now) ?? { spot: priceReading.price, r: 0 };

    const timeToExpiryMs = view.expiryMs - now;
    const anchorUp = view.yesMid ?? 0.5;

    // view.referencePrice is Task 4's UNSCALED boundaryPrice().raw — its real
    // decimal scale is not yet confirmed against live data (see Task 4's Note).
    // A wrong scale would make moneyness = (spot - strike) / strike swing to
    // +/-infinity and saturate estimateUp's clamp, producing a confident-looking
    // but meaningless BULLISH/BEARISH. Rather than trust an unverified strike
    // outright, sanity-check it against the live spot price we already have:
    // a real BTC/ETH strike struck "around the money" should sit within an
    // order of magnitude of spot (same principle ec-core's scaleStrike() uses
    // to infer scale). Outside that range, fall back to momentum mode — still
    // a real, honest signal (anchored on the market's own implied probability),
    // just without the unverified strike comparison.
    const strikeRatio = view.referenceKind === "strike" ? view.referencePrice / momentum.spot : null;
    const strikeLooksPlausible = strikeRatio !== null && strikeRatio > 0.1 && strikeRatio < 10;
    if (view.referenceKind === "strike" && !strikeLooksPlausible) {
      console.log(
        `[SIGNAL] ${view.marketId} strike ${view.referencePrice} implausible next to spot ${momentum.spot} ` +
          `(ratio ${strikeRatio?.toFixed(3)}) — falling back to momentum mode until Task 22 confirms the real scale`,
      );
    }
    const useStrikeModel = view.referenceKind === "strike" && strikeLooksPlausible;

    const estimate = estimateUp({
      spot: momentum.spot,
      r: momentum.r,
      strike: useStrikeModel ? view.referencePrice : null,
      timeToExpiryMs,
      windowMs: 60_000,
      expectedMove: 0.01,
      sensitivity: 2,
      model: useStrikeModel ? "strike" : "momentum",
      anchorUp,
    });

    const decision = toDecision({
      marketId: view.marketId,
      asset: view.asset,
      spot: momentum.spot,
      referencePrice: view.referencePrice,
      referenceKind: view.referenceKind,
      timeToExpiryMs,
      estimate,
      now,
    });

    console.log(`[SIGNAL] ${decision.direction} confidence=${decision.confidence.toFixed(2)}`);
    return NextResponse.json({ decision });
  } catch (error) {
    console.error("[SIGNAL] evaluation failed", error);
    return NextResponse.json({ error: "Unable to evaluate this market right now." }, { status: 502 });
  }
}
