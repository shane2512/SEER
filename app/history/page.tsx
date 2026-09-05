"use client";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useBrowserExchange } from "@/hooks/useBrowserExchange";
import { HistoryMetrics } from "@/components/history/HistoryMetrics";
import { TradeFilters, type TradeFilterState } from "@/components/history/TradeFilters";
import { TradeTable } from "@/components/history/TradeTable";
import { PositionsPanel } from "@/components/history/PositionsPanel";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { PageHeading } from "@/components/chrome/PageHeading";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import type { Portfolio } from "@somnia-chain/markets-sdk";

// Same rhythm as the dashboard: 20px inside a card, 24px between cards.
const SHELL = "mx-auto max-w-[var(--shell-width)] px-5 py-10 lg:px-8";

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

  // Connected with the portfolio request still in flight — distinct from
  // "not connected", and worth its own skeleton rather than an empty screen.
  const isLoading = isConnected && !portfolio && !error;

  return (
    <>
      <SiteHeader current="/history" action={<ConnectWalletButton />} />
      <main className="relative z-10">
        <div className={SHELL}>
          <PageHeading
            title="Trade history"
            description="Every order this wallet has settled on DreamDEX Event Contracts, read straight from the chain."
          />

          {!isConnected && (
            <div className="clay-well rounded-2xl border-2 border-border-well bg-surface-well p-5 font-mono text-[14px] leading-6 text-text-dim">
              Connect a wallet to see its on-chain trade history.
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-2xl border-2 border-error bg-surface-well p-5 font-mono text-[14px] leading-6 text-error"
            >
              {error}
            </div>
          )}

          {isLoading && (
            <div className="space-y-6" aria-busy="true" aria-label="Loading trade history">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {isConnected && portfolio && (
            <div className="space-y-6">
              <HistoryMetrics portfolio={portfolio} />
              <PositionsPanel portfolio={portfolio} />
              <div className="clay-1 rounded-2xl border-2 border-border-layer bg-surface-layer p-5">
                <TradeFilters assets={assets} filters={filters} onChange={setFilters} />
                <div className="mt-5">
                  <TradeTable trades={filteredTrades} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
