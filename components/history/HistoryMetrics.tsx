import { toHuman } from "@somnia-chain/markets-sdk";
import type { Portfolio } from "@somnia-chain/markets-sdk";
import { Card } from "@/components/ui/Card";

/**
 * Four honest, directly-computable metrics from the real portfolio read.
 * Deliberately does NOT show win-rate or realized PnL — PortfolioTrade
 * carries no resolution/outcome data, so either figure would have to be
 * invented rather than computed. Total volume is a straightforward sum
 * over real fillPrice*quantity, nothing estimated.
 */
export function HistoryMetrics({ portfolio }: { portfolio: Portfolio }) {
  const totalVolume = portfolio.trades.reduce((sum, t) => {
    const price = toHuman(t.fillPrice, t.market.quoteDecimals);
    const qty = toHuman(t.quantity, t.market.quoteDecimals);
    return sum + price * qty;
  }, 0);

  const metrics = [
    { label: "Total Trades", value: portfolio.trades.length.toLocaleString() },
    { label: "Total Volume", value: totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 }) },
    { label: "Open Positions", value: portfolio.positions.length.toLocaleString() },
    { label: "Open Orders", value: portfolio.openOrders.length.toLocaleString() },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.label}>
          <div className="font-mono text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">{m.label}</div>
          <div className="mt-1 font-mono text-2xl font-bold text-text-bright" data-numeric>
            {m.value}
          </div>
        </Card>
      ))}
    </div>
  );
}
