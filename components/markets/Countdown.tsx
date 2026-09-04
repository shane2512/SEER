"use client";
import { useEffect, useState } from "react";

/** `className` overrides the default text color — needed inside an
 *  inverted (light-background) tile, e.g. MarketSelector's selected state,
 *  where the default text-text-bright would be invisible against white. */
export function Countdown({ expiryMs, className }: { expiryMs: number; className?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const remainingMs = expiryMs - now;
  if (remainingMs <= 0) {
    return <span className={`font-mono text-sm font-bold uppercase ${className ?? "text-error"}`} data-numeric>EXPIRED</span>;
  }
  const totalSec = Math.floor(remainingMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return (
    <span className={`font-mono text-sm font-bold ${className ?? "text-text-bright"}`} data-numeric>
      {m}:{s.toString().padStart(2, "0")}
    </span>
  );
}
