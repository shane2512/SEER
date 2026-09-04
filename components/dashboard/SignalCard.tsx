import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Decision } from "@/lib/seer/decision";

const TONE = { BULLISH: "bullish", BEARISH: "bearish", NEUTRAL: "neutral" } as const;

export function SignalCard({ decision }: { decision: Decision }) {
  return (
    <Card label="SIGNAL // REASONING ENGINE">
      <div className="flex items-center justify-between">
        <Badge tone={TONE[decision.direction]}>{decision.direction}</Badge>
        <span className="font-mono text-sm font-bold text-text-bright" data-numeric>
          {Math.round(decision.confidence * 100)}% CONFIDENCE
        </span>
      </div>
      <div className="mt-3 font-mono text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">
        Model // Deterministic Strike/Momentum Estimator
      </div>
      <p className="mt-2 border-l-2 border-border-dim pl-3 font-mono text-sm text-text-bright">&ldquo;{decision.rationale}&rdquo;</p>
    </Card>
  );
}
