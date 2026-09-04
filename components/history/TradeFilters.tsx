"use client";

// PortfolioTrade.side is the real BinarySide union ("BUY_YES" | "SELL_YES" |
// "BUY_NO" | "SELL_NO"), not a plain "YES"/"NO" — verified against the
// installed SDK's store.d.ts after a first pass got this wrong at
// compile time. The filter groups by outcome (YES vs NO) since that's what
// a visitor scanning history actually wants; the raw side is still shown
// per-row in TradeTable, so no information is lost.
export type TradeFilterState = { asset: string | null; outcome: "YES" | "NO" | null };

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T | null; text: string }[];
  value: T | null;
  onChange: (value: T | null) => void;
}) {
  return (
    <div>
      <div className="font-display text-[11px] font-bold tracking-[0.08em] text-text-dim uppercase">{label}</div>
      <div className="clay-well mt-1 flex gap-1 rounded-full border-2 border-border-well bg-surface-well p-1">
        {options.map((opt) => (
          <button
            key={opt.text}
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3 py-1 font-mono text-xs font-bold tracking-[0.05em] uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hard ${
              value === opt.value ? "clay-2 border-2 border-border-hard bg-border-hard text-surface-base" : "text-text-dim hover:text-text-bright"
            }`}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Real filters only — market (distinct assets actually present in the
 *  wallet's trades) and side (YES/NO, a real PortfolioTrade field). No
 *  won/lost status filter: PortfolioTrade carries no resolution data, so a
 *  status split would have to guess rather than read. */
export function TradeFilters({
  assets,
  filters,
  onChange,
}: {
  assets: string[];
  filters: TradeFilterState;
  onChange: (filters: TradeFilterState) => void;
}) {
  return (
    <div className="flex flex-wrap gap-4">
      <Segmented
        label="Market"
        value={filters.asset}
        onChange={(asset) => onChange({ ...filters, asset })}
        options={[{ value: null, text: "All" }, ...assets.map((a) => ({ value: a, text: a }))]}
      />
      <Segmented
        label="Outcome"
        value={filters.outcome}
        onChange={(outcome) => onChange({ ...filters, outcome })}
        options={[
          { value: null, text: "All" },
          { value: "YES" as const, text: "YES" },
          { value: "NO" as const, text: "NO" },
        ]}
      />
    </div>
  );
}
