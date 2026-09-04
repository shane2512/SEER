import { NextResponse } from "next/server";
import { loadDreamDexConfig, createDreamDexExchange } from "@/lib/dreamdex/client";
import { loadRiskLimits } from "@/lib/bot/context";
import { activeMarkets, type DreamDexContext } from "@/lib/dreamdex/markets";
import { normalizeMarkets } from "@/lib/dreamdex/event-contracts";
import { validateTrade } from "@/lib/bot/permissions";
import { tradeRequestSchema } from "@/lib/seer/validation";

/**
 * Guardrail-only check — no signer, no order submission. The browser calls
 * this first; on ok:true it signs and submits the returned `market` snapshot
 * itself via its own connected wallet (see hooks/useTrade.ts). Returning the
 * exact MarketView that was just validated (rather than the browser
 * re-fetching its own) guarantees the price used for the real order matches
 * what the guardrails actually checked.
 */
export async function POST(request: Request) {
  const parsed = tradeRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid request" }, { status: 400 });
  }
  const tradeRequest = parsed.data;

  try {
    const config = loadDreamDexConfig();
    const limits = loadRiskLimits();
    const exchange = createDreamDexExchange(config);
    const ctx: DreamDexContext = { exchange: exchange as never, config };

    const markets = await activeMarkets(ctx);
    const unified = markets.find((m) => m.id === tradeRequest.marketId);
    if (!unified) {
      return NextResponse.json({ error: `market ${tradeRequest.marketId} is not currently active` }, { status: 404 });
    }
    const [view] = await normalizeMarkets(ctx, [unified]);
    if (!view) {
      return NextResponse.json({ error: "market could not be normalized" }, { status: 502 });
    }

    const validation = validateTrade(view, tradeRequest, limits, Date.now());
    if (!validation.ok) {
      console.log(`[TRADE] validation failed: ${validation.reason}`);
      return NextResponse.json({ ok: false, reason: validation.reason }, { status: 422 });
    }

    console.log("[TRADE] validation passed");
    return NextResponse.json({ ok: true, market: view });
  } catch (error) {
    console.error("[TRADE] unexpected error during validation", error);
    return NextResponse.json({ error: "Unable to validate this trade right now." }, { status: 502 });
  }
}
