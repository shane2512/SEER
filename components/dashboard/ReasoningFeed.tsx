import { Card } from "@/components/ui/Card";
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
    <Card label={`VERIFICATION // ${completed}/${STEPS.length} PASSED`}>
      <ol className="space-y-1.5 font-mono text-sm">
        {STEPS.map((step, i) => {
          const done = i < completed;
          return (
            <li key={step} className={`flex items-center gap-2 ${done ? "text-text-bright" : "text-text-inert"}`}>
              <span className="font-bold">{done ? "[✓]" : "[ ]"}</span>
              <span className={done ? "font-bold" : ""}>
                STEP {i + 1}: {step}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 border-t border-border-dim pt-3 font-mono text-xs text-text-dim">
        Trades are signed by your own connected wallet — SEER never holds or sees your private key. The wallet
        extension prompts you to approve each order before it submits.
      </p>
    </Card>
  );
}
