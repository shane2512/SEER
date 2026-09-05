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
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { PageHeading } from "@/components/chrome/PageHeading";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

// Every panel on this screen sits on the same rhythm: 20px of padding inside a
// card, 24px of gap between cards. Internal spacing staying below external is
// what stops a dense grid reading as cramped in one place and empty in
// another — the previous 16px padding against a 12px gap had it backwards.
const SHELL = "mx-auto max-w-[var(--shell-width)] px-5 py-10 lg:px-8";

/** Shown while live DreamDEX markets are being discovered. */
function DashboardSkeleton() {
  return (
    <div className={SHELL} aria-busy="true" aria-label="Loading live DreamDEX markets">
      <PageHeading
        title="Dashboard"
        description="Discovering active DreamDEX Event Contracts on Somnia Shannon…"
      />
      <Skeleton className="h-11 w-full rounded-full" />
      <Skeleton className="mt-4 h-11 w-full rounded-full" />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

/**
 * A neutral panel for the states where the screen has nothing to show yet —
 * no wallet, wrong network, no open markets. Written as directions rather
 * than apologies: each one says what to do next, not that something is
 * missing.
 */
function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="clay-well rounded-2xl border-2 border-border-well bg-surface-well p-5 font-mono text-[14px] leading-6 text-text-dim">
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { isConnected, isWrongNetwork } = useWallet();
  const [venueId, setVenueId] = useState<string | undefined>(undefined);
  const { markets, venueIds, loading, error } = useMarkets(venueId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? markets[0]?.marketId ?? null;
  const market = markets.find((m) => m.marketId === activeId) ?? null;
  const { decision, loading: evalLoading, error: evalError, evaluate } = useEvaluation(activeId);
  const { state: tradeState, execute } = useTrade();

  const header = <SiteHeader current="/dashboard" action={<ConnectWalletButton />} />;

  if (loading) {
    return (
      <>
        {header}
        <main className="relative z-10">
          <DashboardSkeleton />
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        {header}
        <main className="relative z-10">
          <div className={SHELL}>
            <PageHeading title="Dashboard" description="Live DreamDEX Event Contracts on Somnia Shannon." />
            <div
              role="alert"
              className="rounded-2xl border-2 border-error bg-surface-well p-5 font-mono text-[14px] leading-6 text-error"
            >
              {error}
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {header}
      <main className="relative z-10">
        <div className={SHELL}>
          <PageHeading
            title="Dashboard"
            description="Live DreamDEX Event Contracts on Somnia Shannon. Pick a market, read the model's call and its reasoning, then sign the order with your own wallet."
          />

          <div className="space-y-4">
            <VenueSelector venueIds={venueIds} selected={venueId} onSelect={setVenueId} />
            <MarketSelector markets={markets} selected={activeId} onSelect={setSelectedId} />
          </div>

          {isConnected && (
            <div className="mt-6">
              <FundingCard />
            </div>
          )}

          {!market && (
            <div className="mt-6">
              <Notice>
                No BTC or ETH Event Contract is open on this venue right now. Try another venue, or check back
                when the next round opens.
              </Notice>
            </div>
          )}

          {market && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <MarketCard market={market} />

              <div className="space-y-6">
                {evalLoading && !decision && <SkeletonCard />}
                {evalError && (
                  <div
                    role="alert"
                    className="rounded-2xl border-2 border-error bg-surface-well p-5 font-mono text-[14px] leading-6 text-error"
                  >
                    <p>{evalError}</p>
                    <button
                      onClick={evaluate}
                      className="mt-3 font-bold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
                    >
                      Run the evaluation again
                    </button>
                  </div>
                )}
                {decision && <SignalCard decision={decision} />}
              </div>
            </div>
          )}

          {decision && market && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {isConnected && !isWrongNetwork && (
                <TradePanel
                  decision={decision}
                  tradeState={tradeState}
                  onExecute={(side, size) => execute(market.marketId, side, size)}
                />
              )}
              {!isConnected && <Notice>Connect a wallet to trade this signal.</Notice>}
              {isConnected && isWrongNetwork && (
                <Notice>Switch to Somnia Shannon to trade this signal.</Notice>
              )}
              <ReasoningFeed tradeState={tradeState} hasDecision={Boolean(decision)} />
            </div>
          )}

          <div className="mt-6">
            <PositionCard tradeState={tradeState} />
          </div>
        </div>
      </main>
    </>
  );
}
