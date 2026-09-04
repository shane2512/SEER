import type { HTMLAttributes } from "react";

// Terminal Brutalism panel — a grid cell with a 1px dim perimeter and an
// optional coordinate-style badge docked on the top border (design system
// doc's Cards & Market Modules rule). `label` should be real content
// (a market symbol, a page section name), never the mockup's arbitrary
// tile numbering.
export function Card({
  label,
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { label?: string }) {
  return (
    <div className={`relative border border-border-dim bg-surface-layer p-4 ${label ? "mt-3" : ""} ${className}`} {...props}>
      {label && (
        <span className="absolute -top-3 left-3 bg-surface-base px-2 font-mono text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}
