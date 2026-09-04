import { Card } from "@/components/ui/Card";
import type { TradeState } from "@/lib/blockchain/transactions";

export function PositionCard({ tradeState }: { tradeState: TradeState }) {
  if (tradeState.status !== "confirmed" && tradeState.status !== "submitted") {
    return null;
  }
  return (
    <Card>
      <h3 className="font-semibold">Position</h3>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-slate-500">Transaction</dt>
        <dd className="truncate font-mono">{tradeState.txHash}</dd>
        {tradeState.status === "confirmed" && (
          <>
            <dt className="text-slate-500">Filled</dt>
            <dd>{tradeState.filled}</dd>
            <dt className="text-slate-500">Price</dt>
            <dd>{tradeState.price.toFixed(2)}</dd>
          </>
        )}
      </dl>
    </Card>
  );
}
