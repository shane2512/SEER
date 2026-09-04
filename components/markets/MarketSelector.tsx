"use client";
import type { MarketView } from "@/lib/dreamdex/event-contracts";
import { Badge } from "@/components/ui/Badge";
import { Countdown } from "./Countdown";

/**
 * The bento market-selector strip from the Stitch mockup, wired to real
 * MarketView data (no fabricated prices/probabilities). Fixes a real gap
 * this session found: the dashboard previously always showed markets[0]
 * with no way to pick another — every discovered market is now a real,
 * clickable tile.
 */
export function MarketSelector({
  markets,
  selected,
  onSelect,
}: {
  markets: MarketView[];
  selected: string | null;
  onSelect: (marketId: string) => void;
}) {
  if (markets.length === 0) return null;

  return (
    <div className="border border-border-dim">
      <div className="border-b border-border-dim bg-surface-layer px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">
        Market Selector // {markets.length} Active
      </div>
      <div className="flex divide-x divide-border-dim overflow-x-auto">
        {markets.map((market, i) => {
          const isSelected = market.marketId === selected;
          return (
            <button
              key={market.marketId}
              onClick={() => onSelect(market.marketId)}
              aria-pressed={isSelected}
              className={`min-w-[150px] flex-1 px-3 py-2 text-left font-mono transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-hard ${
                isSelected ? "bg-border-hard text-surface-base" : "bg-surface-base text-text-bright hover:bg-surface-active"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold tracking-[0.1em] uppercase">
                <span>MKT {String(i + 1).padStart(2, "0")}</span>
                <Badge tone={market.status === "Trading" ? "live" : "settled"} className={isSelected ? "border-surface-base text-surface-base" : undefined}>
                  {market.status === "Trading" ? "■" : "○"}
                </Badge>
              </div>
              <div className="mt-1 text-sm font-bold">{market.asset}</div>
              <div className="mt-0.5 text-xs" data-numeric>
                {market.referencePrice !== null ? `$${market.referencePrice.toLocaleString()}` : "—"}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <Countdown expiryMs={market.expiryMs} className={isSelected ? "text-surface-base" : undefined} />
                {market.yesMid !== null && <span data-numeric>YES {(market.yesMid * 100).toFixed(0)}%</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
