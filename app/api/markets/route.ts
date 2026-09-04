import { NextResponse } from "next/server";
import { createDreamDexExchange, loadDreamDexConfig } from "@/lib/dreamdex/client";
import { activeMarkets, discoverVenues, type DreamDexContext } from "@/lib/dreamdex/markets";
import { normalizeMarkets } from "@/lib/dreamdex/event-contracts";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const venueId = url.searchParams.get("venueId") ?? undefined;

  try {
    const config = loadDreamDexConfig();
    const exchange = createDreamDexExchange(config);
    const ctx: DreamDexContext = { exchange: exchange as never, config };

    // One unfiltered fetch computes the full venue list; a second, scoped
    // fetch only runs when the caller actually asked to narrow to one venue
    // — the common case (no venue selected) stays a single round-trip.
    const all = await activeMarkets(ctx);
    const venueIds = discoverVenues(all);
    const scoped = venueId ? await activeMarkets(ctx, { venueId }) : all;
    const views = await normalizeMarkets(ctx, scoped);

    console.log(`[MARKET] ${views.length} event contract(s) loaded`);
    return NextResponse.json({ markets: views, venueIds });
  } catch (error) {
    console.error("[MARKET] failed to load markets", error);
    return NextResponse.json({ error: "Unable to load DreamDEX markets right now." }, { status: 502 });
  }
}
