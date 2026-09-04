import type { HTMLAttributes } from "react";

// Brutal-Clay badges/chips — full pill capsules. Inactive states are
// debossed (sunken into the surface); active/live states pop outward with
// Level 2 elevation. State is still never color-coded (bullish/bearish
// share the same tactile language) — only fill/elevation differs.
const TONES = {
  bullish: "clay-2 border-border-hard bg-border-hard text-surface-base",
  bearish: "clay-well border-border-well bg-surface-well text-text-bright",
  neutral: "clay-well border-border-well bg-surface-well text-text-dim",
  live: "clay-2 border-border-active bg-surface-active text-text-bright",
  settled: "clay-well border-border-well bg-surface-well text-text-dim",
  error: "border border-error bg-surface-well text-error",
} as const;

export function Badge({
  tone,
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone: keyof typeof TONES }) {
  return (
    <span
      className={`inline-block rounded-full border-2 px-3 py-1 font-display text-[11px] font-bold tracking-[0.08em] uppercase ${TONES[tone]} ${className}`}
      {...props}
    />
  );
}
