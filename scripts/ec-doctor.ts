// scripts/ec-doctor.ts
//
// Manual venue/market discovery check. DREAMDEX_VENUE_ID moves over time
// (docs/event-contracts.md) — this script's real job is printing the venue id
// off a live market row so you can set it in .env.local, not just confirming
// connectivity.
import { config as loadEnv } from "dotenv";
import { loadDreamDexConfig, createDreamDexExchange } from "../lib/dreamdex/client";
import { activeMarkets, type DreamDexContext } from "../lib/dreamdex/markets";

// Unlike Next.js API routes, a standalone tsx script does not auto-load
// .env.local — load it explicitly so this script sees the same config a
// developer set up for `npm run dev`.
loadEnv({ path: ".env.local" });

async function main() {
  const config = loadDreamDexConfig();
  const exchange = createDreamDexExchange(config);
  const ctx: DreamDexContext = { exchange: exchange as never, config };

  const markets = await activeMarkets(ctx);
  if (markets.length === 0) {
    console.log(
      `[EC-DOCTOR] no active binary markets found${config.venueId ? ` for venueId=${config.venueId}` : ""}. ` +
        "If DREAMDEX_VENUE_ID is set, it may be stale — unset it and re-run to see every active venue.",
    );
    return;
  }

  console.log(`[EC-DOCTOR] ${markets.length} active binary market(s):`);
  for (const m of markets) {
    const venueId = (m.info as { venueId?: string }).venueId;
    console.log(`  ${m.symbol} — venueId=${venueId ?? "unknown"}`);
  }
  if (!config.venueId) {
    console.log(
      "[EC-DOCTOR] DREAMDEX_VENUE_ID is unset — copy one of the venueId values above into .env.local.",
    );
  }
}

main().catch((error) => {
  console.error("[EC-DOCTOR] failed:", error);
  process.exit(1);
});
