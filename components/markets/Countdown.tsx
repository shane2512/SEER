"use client";
import { useEffect, useState } from "react";

export function Countdown({ expiryMs }: { expiryMs: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const remainingMs = expiryMs - now;
  if (remainingMs <= 0) {
    return <span className="font-mono text-sm text-rose-600">EXPIRED</span>;
  }
  const totalSec = Math.floor(remainingMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return (
    <span className="font-mono text-sm text-slate-700">
      {m}m {s.toString().padStart(2, "0")}s
    </span>
  );
}
