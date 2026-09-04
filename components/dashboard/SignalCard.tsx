import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Decision } from "@/lib/seer/decision";

const TONE = { BULLISH: "bullish", BEARISH: "bearish", NEUTRAL: "neutral" } as const;

export function SignalCard({ decision }: { decision: Decision }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <Badge tone={TONE[decision.direction]}>{decision.direction}</Badge>
        <span className="text-sm text-slate-500">{Math.round(decision.confidence * 100)}% confidence</span>
      </div>
      <p className="mt-3 text-sm text-slate-700">{decision.rationale}</p>
    </Card>
  );
}
