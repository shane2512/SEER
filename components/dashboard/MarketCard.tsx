import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { MarketView } from "@/lib/dreamdex/event-contracts";
import { EventHeader } from "@/components/markets/EventHeader";

const STATUS_TONE = { Trading: "live", Listed: "settled", Locked: "settled", Settling: "settled", Resolved: "settled", Voided: "settled" } as const;

export function MarketCard({ market }: { market: MarketView }) {
  return (
    <Card label={`MARKET // ${market.symbol}`}>
      <EventHeader market={market} />
      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-2xl font-bold text-text-bright">{market.asset}</span>
        <Badge tone={STATUS_TONE[market.status]}>
          {market.status === "Trading" ? "■ Live" : `○ ${market.status}`}
        </Badge>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border-dim pt-3 font-mono text-sm">
        <dt className="text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">
          {market.referenceKind === "strike" ? "Strike" : "Opening"}
        </dt>
        <dd className="text-right text-text-bright" data-numeric>
          {market.referencePrice !== null ? `$${market.referencePrice.toLocaleString()}` : "pending"}
        </dd>
        <dt className="text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">YES bid / ask</dt>
        <dd className="text-right text-text-bright" data-numeric>
          {market.yesBid !== null ? market.yesBid.toFixed(2) : "—"} /{" "}
          {market.yesAsk !== null ? market.yesAsk.toFixed(2) : "—"}
        </dd>
        <dt className="text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">Spread</dt>
        <dd className="text-right text-text-bright" data-numeric>
          {market.spread !== null ? market.spread.toFixed(3) : "—"}
        </dd>
      </dl>
    </Card>
  );
}
