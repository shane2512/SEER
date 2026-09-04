import { toHuman } from "@somnia-chain/markets-sdk";
import type { Portfolio } from "@somnia-chain/markets-sdk";
import { Card } from "@/components/ui/Card";

export function PositionsPanel({ portfolio }: { portfolio: Portfolio }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card label="OPEN POSITIONS">
        {portfolio.positions.length === 0 ? (
          <p className="font-mono text-sm text-text-dim">No open positions.</p>
        ) : (
          <ul className="space-y-2 font-mono text-sm">
            {portfolio.positions.map((p) => (
              <li key={`${p.market.id}-${p.outcomeIndex}`} className="border-b border-border-dim pb-2 last:border-0 last:pb-0">
                <span className="text-text-bright">{p.market.question}</span>
                <div className="mt-0.5 flex items-center justify-between text-xs text-text-dim">
                  <span>{p.outcomeIndex === 0 ? "YES" : "NO"}</span>
                  <span data-numeric>{toHuman(p.balance, p.market.quoteDecimals)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card label="OPEN ORDERS">
        {portfolio.openOrders.length === 0 ? (
          <p className="font-mono text-sm text-text-dim">No open orders.</p>
        ) : (
          <ul className="space-y-2 font-mono text-sm">
            {portfolio.openOrders.map((o) => (
              <li key={o.id} className="border-b border-border-dim pb-2 last:border-0 last:pb-0">
                <span className="text-text-bright">
                  {o.market.asset} {o.side}
                </span>
                <div className="mt-0.5 flex items-center justify-between text-xs text-text-dim">
                  <span data-numeric>{toHuman(o.quantityRemaining, o.market.quoteDecimals)} remaining</span>
                  <span data-numeric>@ {toHuman(o.price, o.market.quoteDecimals)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
