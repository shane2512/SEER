import { NextResponse } from "next/server";
import { requireOperatorConfig, loadRiskLimits } from "@/lib/bot/context";
import { createDreamDexExchange } from "@/lib/dreamdex/client";
import { activeMarkets, type DreamDexContext } from "@/lib/dreamdex/markets";
import { normalizeMarkets } from "@/lib/dreamdex/event-contracts";
import { validateTrade } from "@/lib/bot/permissions";
import { submitTrade, type TradeExecutor } from "@/lib/bot/execution";
import { tradeRequestSchema } from "@/lib/seer/validation";
import type { TradeState } from "@/lib/blockchain/transactions";

export async function POST(request: Request) {
  const parsed = tradeRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid request" }, { status: 400 });
  }
  const tradeRequest = parsed.data;

  try {
    const config = requireOperatorConfig();
    const limits = loadRiskLimits();
    const exchange = createDreamDexExchange(config, { withSigner: true });
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
      return NextResponse.json({ error: validation.reason }, { status: 422 });
    }
    console.log("[TRADE] validation passed");

    const result = await submitTrade(exchange as unknown as TradeExecutor, view, tradeRequest);
    if (!result.ok) {
      const state: TradeState = { status: "failed", error: result.error };
      console.error(`[TRADE] failed: ${result.error}`);
      return NextResponse.json({ state }, { status: 502 });
    }

    console.log(`[TRADE] order submitted tx=${result.txHash}`);
    const state: TradeState = { status: "confirmed", txHash: result.txHash, filled: result.filled, price: result.price };
    return NextResponse.json({ state });
  } catch (error) {
    console.error("[TRADE] unexpected error", error);
    return NextResponse.json({ error: "Unable to execute this trade right now." }, { status: 502 });
  }
}
