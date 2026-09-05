import Link from "next/link";

/**
 * Shared page foot. Deliberately a single row of plain facts rather than the
 * conventional four-column link farm — SEER has three routes and no marketing
 * surface area, so a column grid would be padding pretending to be structure.
 */
export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t border-border-well">
      <div className="mx-auto flex max-w-[var(--shell-width)] flex-col gap-3 px-5 py-8 font-mono text-[13px] text-text-dim sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>Somnia Shannon testnet only. Nothing here is investment advice.</p>
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="transition-colors hover:text-text-bright">
            Dashboard
          </Link>
          <Link href="/history" className="transition-colors hover:text-text-bright">
            History
          </Link>
        </div>
      </div>
    </footer>
  );
}
