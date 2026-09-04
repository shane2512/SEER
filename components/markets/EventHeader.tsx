import type { MarketView } from "@/lib/dreamdex/event-contracts";
import { Countdown } from "./Countdown";

export function EventHeader({ market }: { market: MarketView }) {
  return (
    <div className="flex items-center justify-between border-b border-border-dim pb-2">
      <h2 className="font-mono text-[18px] font-bold tracking-tight text-text-bright uppercase">
        {market.asset} Event Contract
      </h2>
      <div className="text-right">
        <div className="font-mono text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">Time Remaining</div>
        <Countdown expiryMs={market.expiryMs} />
      </div>
    </div>
  );
}
