import { toHuman } from "@somnia-chain/markets-sdk";
import type { Portfolio } from "@somnia-chain/markets-sdk";
import { Card } from "@/components/ui/Card";
import { explorerTxUrl } from "@/lib/blockchain/explorer";

const DEFAULT_CHAIN_ID = 50312;

function parseChainId(raw: string | undefined): number {
  const value = Number((raw ?? "").trim());
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_CHAIN_ID;
}

export function PortfolioTable({ portfolio }: { portfolio: Portfolio }) {
  const chainId = parseChainId(process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID);

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold">Open positions</h3>
        {portfolio.positions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No open positions.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {portfolio.positions.map((p) => (
              <li key={`${p.market.id}-${p.outcomeIndex}`}>
                <span className="font-medium">{p.market.question}</span> —{" "}
                {p.outcomeIndex === 0 ? "YES" : "NO"}: {toHuman(p.balance, p.market.quoteDecimals)}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold">Open orders</h3>
        {portfolio.openOrders.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No open orders.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {portfolio.openOrders.map((o) => (
              <li key={o.id}>
                {o.market.asset} {o.side} — {toHuman(o.quantityRemaining, o.market.quoteDecimals)} remaining @{" "}
                {toHuman(o.price, o.market.quoteDecimals)}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold">Recent trades</h3>
        {portfolio.trades.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No trades yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {portfolio.trades.map((t) => {
              const url = explorerTxUrl(chainId, t.txHash);
              return (
                <li key={t.id}>
                  {t.market.asset} {t.side ?? ""} {toHuman(t.quantity, t.market.quoteDecimals)} @{" "}
                  {toHuman(t.fillPrice, t.market.quoteDecimals)} —{" "}
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="font-mono underline">
                      {t.txHash}
                    </a>
                  ) : (
                    <span className="font-mono">{t.txHash}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
