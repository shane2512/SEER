import type { TradeState } from "@/lib/blockchain/transactions";

const STEPS = [
  "MARKET DETECTED",
  "EVENT ACTIVE",
  "SIGNAL GENERATED",
  "RISK CHECK PASSED",
  "ORDER SUBMITTED",
  "TRANSACTION CONFIRMED",
] as const;

function stepsCompleted(hasDecision: boolean, tradeState: TradeState): number {
  let n = 2; // market detected + event active are true by the time this renders
  if (hasDecision) n = 3;
  if (tradeState.status === "validating" || tradeState.status === "submitting") n = 4;
  if (tradeState.status === "submitted") n = 5;
  if (tradeState.status === "confirmed") n = 6;
  return n;
}

export function ReasoningFeed({ tradeState, hasDecision }: { tradeState: TradeState; hasDecision: boolean }) {
  const completed = stepsCompleted(hasDecision, tradeState);
  return (
    <div>
      <ol className="space-y-1 text-sm">
        {STEPS.map((step, i) => (
          <li key={step} className={i < completed ? "font-medium text-slate-900" : "text-slate-400"}>
            {i < completed ? "✓ " : "  "}
            {step.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-slate-400">
        Trades execute from a dedicated, demo-funded server wallet. DreamDEX&apos;s on-chain
        owner/operator split isn&apos;t available for Event Contract markets yet, so this key signs
        directly — it never reaches the browser.
      </p>
    </div>
  );
}
