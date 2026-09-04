import { NextResponse } from "next/server";
import { createDreamDexExchange, loadDreamDexConfig } from "@/lib/dreamdex/client";
import { activeMarkets, type DreamDexContext } from "@/lib/dreamdex/markets";
import { normalizeMarkets } from "@/lib/dreamdex/event-contracts";

export async function GET() {
  try {
    const config = loadDreamDexConfig();
    const exchange = createDreamDexExchange(config);
    const ctx: DreamDexContext = { exchange: exchange as never, config };

    const markets = await activeMarkets(ctx);
    const views = await normalizeMarkets(ctx, markets);

    console.log(`[MARKET] ${views.length} event contract(s) loaded`);
    return NextResponse.json({ markets: views });
  } catch (error) {
    console.error("[MARKET] failed to load markets", error);
    return NextResponse.json({ error: "Unable to load DreamDEX markets right now." }, { status: 502 });
  }
}
