import type { HTMLAttributes } from "react";

// Brutal-Clay panel — a Level 1 inflated slab: rounded-2xl, 2px border,
// layered inset+exterior shadow (see .clay-1 in globals.css). `label`
// renders as a brutalist system marker (e.g. "// MARKET") above an inset
// groove separating it from the body, per the DESIGN.md's Cards & Modules
// spec — real content, never the mockup's arbitrary tile numbering.
export function Card({
  label,
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { label?: string }) {
  return (
    <div
      className={`clay-1 rounded-2xl border-2 border-border-layer bg-surface-layer p-4 ${className}`}
      {...props}
    >
      {label && (
        <div className="mb-3 border-b border-border-well pb-2 font-display text-[11px] font-bold tracking-[0.08em] text-text-dim uppercase">
          {"// "}
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
