"use client";
import { useCallback, useEffect, useState } from "react";
import type { Decision } from "@/lib/seer/decision";

export function useEvaluation(marketId: string | null) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluate = useCallback(() => {
    if (!marketId) return;
    setLoading(true);
    setError(null);
    fetch("/api/evaluate", { method: "POST", body: JSON.stringify({ marketId }) })
      .then((res) => res.json())
      .then((body) => {
        if (body.error) throw new Error(body.error);
        setDecision(body.decision);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [marketId]);

  useEffect(() => {
    // Same fetch-on-(marketId-)change pattern as useMarkets above; resetting to
    // null before re-evaluating a new market is the correct, intentional
    // behavior (stale decision from the prior market must not linger).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDecision(null);
    evaluate();
  }, [evaluate]);

  return { decision, loading, error, evaluate };
}
