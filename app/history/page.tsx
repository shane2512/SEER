"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useBrowserExchange } from "@/hooks/useBrowserExchange";
import { PortfolioTable } from "@/components/history/PortfolioTable";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import type { Portfolio } from "@somnia-chain/markets-sdk";

export default function HistoryPage() {
  const { address, isConnected } = useWallet();
  const exchange = useBrowserExchange();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address || !exchange) return;
    exchange.client
      .getPortfolio(address)
      .then(setPortfolio)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [isConnected, address, exchange]);

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trade History</h1>
        <ConnectWalletButton />
      </div>
      {!isConnected && <p className="text-sm text-slate-500">Connect your wallet to see your real on-chain trade history.</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {isConnected && portfolio && <PortfolioTable portfolio={portfolio} />}
    </main>
  );
}
