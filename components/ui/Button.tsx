import type { ButtonHTMLAttributes } from "react";

// Brutal-Clay primary button (docs/superpowers/specs/2026-09-04-brutal-clay-design-system.md):
// a solid white "inflated" capsule with inset top sheen + bottom clay drop,
// pressing down 2px on :active to simulate real tactile compression.
export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`clay-primary rounded-full border-2 border-border-hard bg-border-hard px-4 py-2 font-display text-sm font-bold tracking-wide text-surface-base uppercase disabled:cursor-not-allowed disabled:border-border-active disabled:bg-surface-active disabled:text-text-inert disabled:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hard ${className}`}
      {...props}
    />
  );
}
