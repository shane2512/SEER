"use client";
import { useState } from "react";
import { toHuman } from "@somnia-chain/markets-sdk";
import type { PortfolioTrade } from "@somnia-chain/markets-sdk";
import { explorerTxUrl } from "@/lib/blockchain/explorer";

const PAGE_SIZE = 8;
const DEFAULT_CHAIN_ID = 50312;

function parseChainId(raw: string | undefined): number {
  const value = Number((raw ?? "").trim());
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_CHAIN_ID;
}

function toCsv(trades: PortfolioTrade[]): string {
  const header = "timestamp,market,side,quantity,fill_price,tx_hash";
  const rows = trades.map((t) => {
    const ts = new Date(Number(t.timestamp) * 1000).toISOString();
    const qty = toHuman(t.quantity, t.market.quoteDecimals);
    const price = toHuman(t.fillPrice, t.market.quoteDecimals);
    return `${ts},${t.market.asset},${t.side ?? ""},${qty},${price},${t.txHash}`;
  });
  return [header, ...rows].join("\n");
}

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "seer-trade-history.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function TradeTable({ trades }: { trades: PortfolioTrade[] }) {
  const [page, setPage] = useState(0);
  const chainId = parseChainId(process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID);
  const pageCount = Math.max(1, Math.ceil(trades.length / PAGE_SIZE));
  const pageTrades = trades.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (trades.length === 0) {
    return <p className="border border-border-dim p-3 font-mono text-sm text-text-dim">No trades yet.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b-2 border-border-hard pb-2">
        <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">
          Showing {pageTrades.length} of {trades.length} records
        </span>
        <button
          onClick={() => downloadCsv(toCsv(trades))}
          className="font-mono text-[11px] font-bold tracking-[0.1em] text-text-bright uppercase underline hover:text-text-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hard"
        >
          Export CSV
        </button>
      </div>
      <table className="mt-2 w-full border-collapse font-mono text-sm">
        <thead>
          <tr className="border-b-2 border-border-hard text-left">
            <th className="py-1 pr-2 text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">Timestamp</th>
            <th className="py-1 pr-2 text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">Market</th>
            <th className="py-1 pr-2 text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">Side</th>
            <th className="py-1 pr-2 text-right text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">Qty</th>
            <th className="py-1 pr-2 text-right text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">Fill Price</th>
            <th className="py-1 text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">Explorer</th>
          </tr>
        </thead>
        <tbody>
          {pageTrades.map((t) => {
            const url = explorerTxUrl(chainId, t.txHash);
            return (
              <tr key={t.id} className="border-b border-border-dim hover:bg-surface-active">
                <td className="py-1.5 pr-2 text-text-dim" data-numeric>
                  {new Date(Number(t.timestamp) * 1000).toISOString().replace("T", " ").slice(0, 16)}
                </td>
                <td className="py-1.5 pr-2 text-text-bright">{t.market.asset}</td>
                <td className="py-1.5 pr-2 text-text-bright">{t.side ?? "—"}</td>
                <td className="py-1.5 pr-2 text-right text-text-bright" data-numeric>
                  {toHuman(t.quantity, t.market.quoteDecimals).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td className="py-1.5 pr-2 text-right text-text-bright" data-numeric>
                  {toHuman(t.fillPrice, t.market.quoteDecimals).toFixed(3)}
                </td>
                <td className="py-1.5">
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="underline hover:text-text-dim">
                      {t.txHash.slice(0, 6)}…{t.txHash.slice(-4)}
                    </a>
                  ) : (
                    <span>{t.txHash.slice(0, 6)}…{t.txHash.slice(-4)}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pageCount > 1 && (
        <div className="mt-2 flex items-center justify-center gap-3 font-mono text-xs font-bold tracking-[0.1em] uppercase">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-text-bright underline disabled:text-text-inert disabled:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hard"
          >
            Prev
          </button>
          <span className="text-text-dim" data-numeric>
            {page + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            className="text-text-bright underline disabled:text-text-inert disabled:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hard"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
