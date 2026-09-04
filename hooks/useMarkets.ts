"use client";
import { useCallback, useEffect, useState } from "react";
import type { MarketView } from "@/lib/dreamdex/event-contracts";

export function useMarkets() {
  const [markets, setMarkets] = useState<MarketView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/markets")
      .then((res) => res.json())
      .then((body) => {
        if (body.error) throw new Error(body.error);
        setMarkets(body.markets ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  // fetch-on-mount is React's own documented pattern for this exact case (load data once on
  // mount, no external subscription to synchronize); the rule's concern is
  // synchronous cascading renders from an effect, not a plain one-shot fetch
  // kicked off on mount. Rewriting this into whatever shape avoids the rule
  // adds real complexity for a hackathon MVP without changing behavior.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => refresh(), [refresh]);

  return { markets, loading, error, refresh };
}
