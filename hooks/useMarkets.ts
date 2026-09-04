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

  useEffect(() => refresh(), [refresh]);

  return { markets, loading, error, refresh };
}
