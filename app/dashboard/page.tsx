"use client";
import { useState } from "react";
import { useMarkets } from "@/hooks/useMarkets";
import { useEvaluation } from "@/hooks/useEvaluation";
import { useTrade } from "@/hooks/useTrade";
import { MarketCard } from "@/components/dashboard/MarketCard";
import { SignalCard } from "@/components/dashboard/SignalCard";
import { ReasoningFeed } from "@/components/dashboard/ReasoningFeed";
import { TradePanel } from "@/components/dashboard/TradePanel";
import { PositionCard } from "@/components/dashboard/PositionCard";

export default function DashboardPage() {
  const { markets, loading, error } = useMarkets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? markets[0]?.marketId ?? null;
  const market = markets.find((m) => m.marketId === activeId) ?? null;
  const { decision, loading: evalLoading, error: evalError, evaluate } = useEvaluation(activeId);
  const { state: tradeState, execute } = useTrade();

  if (loading) return <main className="p-8 text-slate-500">Loading live DreamDEX markets…</main>;
  if (error) return <main className="p-8 text-rose-600">{error}</main>;
  if (!market) return <main className="p-8 text-slate-500">No active BTC/ETH Event Contract right now.</main>;

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-8">
      <h1 className="text-2xl font-bold">SEER</h1>
      <MarketCard market={market} />
      {/* Evaluation has its own loading/error states, distinct from the
          markets list above — a failed /api/evaluate call must never leave
          the judge staring at a stuck reasoning feed with no explanation
          (CLAUDE.md §7: never silently swallow errors). */}
      {evalLoading && !decision && <p className="text-sm text-slate-500">Evaluating…</p>}
      {evalError && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <p>{evalError}</p>
          <button onClick={evaluate} className="mt-1 font-medium underline">
            Retry evaluation
          </button>
        </div>
      )}
      {decision && <SignalCard decision={decision} />}
      {decision && (
        <TradePanel
          decision={decision}
          tradeState={tradeState}
          onExecute={(side, size) => execute(market.marketId, side, size)}
        />
      )}
      <ReasoningFeed tradeState={tradeState} hasDecision={Boolean(decision)} />
      <PositionCard tradeState={tradeState} />
    </main>
  );
}
