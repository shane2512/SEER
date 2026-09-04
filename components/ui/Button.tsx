import type { ButtonHTMLAttributes } from "react";

// Terminal Brutalism primary button (docs/superpowers/specs/2026-09-04-terminal-brutalism-design-system.md):
// solid white fill / black text at rest, inverts on hover, and the hard
// offset shadow "resolves" (translate + shadow removal) on press — the
// system's only permitted button motion, not a generic transition.
export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`shadow-hard border-2 border-border-hard bg-border-hard px-4 py-2 font-mono text-sm font-bold tracking-wide text-surface-base uppercase transition-transform hover:bg-surface-base hover:text-text-bright active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:border-border-dim disabled:bg-transparent disabled:text-text-inert disabled:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hard ${className}`}
      {...props}
    />
  );
}
