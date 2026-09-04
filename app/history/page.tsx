"use client";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useBrowserExchange } from "@/hooks/useBrowserExchange";
import { HistoryMetrics } from "@/components/history/HistoryMetrics";
import { TradeFilters, type TradeFilterState } from "@/components/history/TradeFilters";
import { TradeTable } from "@/components/history/TradeTable";
import { PositionsPanel } from "@/components/history/PositionsPanel";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import type { Portfolio } from "@somnia-chain/markets-sdk";

export default function HistoryPage() {
  const { address, isConnected } = useWallet();
  const exchange = useBrowserExchange();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TradeFilterState>({ asset: null, outcome: null });

  useEffect(() => {
    if (!isConnected || !address || !exchange) return;
    exchange.client
      .getPortfolio(address)
      .then(setPortfolio)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [isConnected, address, exchange]);

  const assets = useMemo(
    () => (portfolio ? Array.from(new Set(portfolio.trades.map((t) => t.market.asset))).sort() : []),
    [portfolio],
  );
  const filteredTrades = useMemo(() => {
    if (!portfolio) return [];
    return portfolio.trades.filter((t) => {
      if (filters.asset && t.market.asset !== filters.asset) return false;
      if (filters.outcome && !t.side?.endsWith(`_${filters.outcome}`)) return false;
      return true;
    });
  }, [portfolio, filters]);

  return (
    <main className="mx-auto max-w-5xl space-y-3 p-4 lg:p-6">
      <div className="flex items-center justify-between border-b-2 border-border-hard pb-3">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-text-bright">Trade History</h1>
        <ConnectWalletButton />
      </div>

      {!isConnected && (
        <p className="border border-border-dim p-3 font-mono text-sm text-text-dim">
          Connect your wallet to see your real on-chain trade history.
        </p>
      )}
      {error && <p className="border border-error p-3 font-mono text-sm text-error">{error}</p>}

      {isConnected && portfolio && (
        <>
          <HistoryMetrics portfolio={portfolio} />
          <PositionsPanel portfolio={portfolio} />
          <div className="border border-border-dim p-3">
            <TradeFilters assets={assets} filters={filters} onChange={setFilters} />
            <div className="mt-3">
              <TradeTable trades={filteredTrades} />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
