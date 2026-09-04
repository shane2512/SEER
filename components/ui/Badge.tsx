import type { HTMLAttributes } from "react";

const TONES = {
  bullish: "bg-emerald-100 text-emerald-800",
  bearish: "bg-rose-100 text-rose-800",
  neutral: "bg-slate-100 text-slate-700",
} as const;

export function Badge({
  tone,
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone: keyof typeof TONES }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${TONES[tone]} ${className}`}
      {...props}
    />
  );
}
