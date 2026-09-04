import type { HTMLAttributes } from "react";

// Terminal Brutalism status pills — state is communicated by fill/outline
// contrast and bracketed text, never by hue (the system's zero-chromatic-
// color rule). "error" is the one reserved exception, for irrecoverable
// states only (design system doc's Palette Tokens section).
const TONES = {
  bullish: "bg-border-hard text-surface-base", // solid inverted fill — affirmative
  bearish: "border border-border-hard bg-transparent text-text-bright", // outlined, not filled
  neutral: "border border-border-dim text-text-dim",
  live: "border border-border-hard text-text-bright",
  settled: "border border-border-dim text-text-dim",
  error: "border border-error text-error",
} as const;

export function Badge({
  tone,
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone: keyof typeof TONES }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.1em] uppercase ${TONES[tone]} ${className}`}
      {...props}
    />
  );
}
