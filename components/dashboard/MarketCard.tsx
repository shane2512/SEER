import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { MarketView } from "@/lib/dreamdex/event-contracts";
import { EventHeader } from "@/components/markets/EventHeader";

export function MarketCard({ market }: { market: MarketView }) {
  return (
    <Card>
      <EventHeader market={market} />
      <div className="mt-2 flex items-center gap-2">
        <span className="text-2xl font-semibold">{market.asset}</span>
        <Badge tone="neutral">{market.status}</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-slate-500">
          {market.referenceKind === "strike" ? "Strike" : "Opening"}
        </dt>
        <dd>{market.referencePrice !== null ? `$${market.referencePrice.toLocaleString()}` : "pending"}</dd>
        <dt className="text-slate-500">YES bid / ask</dt>
        <dd>
          {market.yesBid !== null ? market.yesBid.toFixed(2) : "—"} /{" "}
          {market.yesAsk !== null ? market.yesAsk.toFixed(2) : "—"}
        </dd>
        <dt className="text-slate-500">Spread</dt>
        <dd>{market.spread !== null ? market.spread.toFixed(3) : "—"}</dd>
      </dl>
    </Card>
  );
}
