"use client";
import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useMarkets } from "@/hooks/useMarkets";
import { useEvaluation } from "@/hooks/useEvaluation";
import { useTrade } from "@/hooks/useTrade";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { FundingCard } from "@/components/wallet/FundingCard";
import { VenueSelector } from "@/components/markets/VenueSelector";
import { MarketSelector } from "@/components/markets/MarketSelector";
import { MarketCard } from "@/components/dashboard/MarketCard";
import { SignalCard } from "@/components/dashboard/SignalCard";
import { ReasoningFeed } from "@/components/dashboard/ReasoningFeed";
import { TradePanel } from "@/components/dashboard/TradePanel";
import { PositionCard } from "@/components/dashboard/PositionCard";

export default function DashboardPage() {
  const { isConnected, isWrongNetwork } = useWallet();
  const [venueId, setVenueId] = useState<string | undefined>(undefined);
  const { markets, venueIds, loading, error } = useMarkets(venueId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? markets[0]?.marketId ?? null;
  const market = markets.find((m) => m.marketId === activeId) ?? null;
  const { decision, loading: evalLoading, error: evalError, evaluate } = useEvaluation(activeId);
  const { state: tradeState, execute } = useTrade();

  if (loading) {
    return (
      <main className="p-8 font-mono text-sm text-text-dim uppercase">Loading live DreamDEX markets…</main>
    );
  }
  if (error) {
    return <main className="p-8 font-mono text-sm text-error">{error}</main>;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-3 p-4 lg:p-6">
      <div className="flex items-center justify-between border-b-2 border-border-hard pb-3">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-text-bright">SEER</h1>
        <ConnectWalletButton />
      </div>

      <VenueSelector venueIds={venueIds} selected={venueId} onSelect={setVenueId} />
      <MarketSelector markets={markets} selected={activeId} onSelect={setSelectedId} />

      {isConnected && <FundingCard />}

      {!market && (
        <p className="font-mono text-sm text-text-dim">No active BTC/ETH Event Contract right now.</p>
      )}

      {market && (
        <div className="grid gap-3 lg:grid-cols-2">
          <MarketCard market={market} />

          <div className="space-y-3">
            {evalLoading && !decision && (
              <p className="font-mono text-sm text-text-dim uppercase">Evaluating…</p>
            )}
            {evalError && (
              <div className="border border-error p-3 font-mono text-sm text-error">
                <p>{evalError}</p>
                <button onClick={evaluate} className="mt-1 font-bold underline">
                  Retry Evaluation
                </button>
              </div>
            )}
            {decision && <SignalCard decision={decision} />}
          </div>
        </div>
      )}

      {decision && market && (
        <div className="grid gap-3 lg:grid-cols-2">
          {isConnected && !isWrongNetwork && (
            <TradePanel
              decision={decision}
              tradeState={tradeState}
              onExecute={(side, size) => execute(market.marketId, side, size)}
            />
          )}
          {!isConnected && (
            <p className="border border-border-dim p-3 font-mono text-sm text-text-dim">
              Connect your wallet to trade this signal.
            </p>
          )}
          {isConnected && isWrongNetwork && (
            <p className="border border-border-dim p-3 font-mono text-sm text-text-dim">
              Switch to Somnia Shannon to trade this signal.
            </p>
          )}
          <ReasoningFeed tradeState={tradeState} hasDecision={Boolean(decision)} />
        </div>
      )}

      <PositionCard tradeState={tradeState} />
    </main>
  );
}
