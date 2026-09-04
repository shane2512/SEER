import type { MarketView } from "@/lib/dreamdex/event-contracts";
import { Countdown } from "./Countdown";

export function EventHeader({ market }: { market: MarketView }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold">{market.asset} Event Contract</h2>
      <Countdown expiryMs={market.expiryMs} />
    </div>
  );
}
