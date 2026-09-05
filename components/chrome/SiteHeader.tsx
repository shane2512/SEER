import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
] as const;

/**
 * The single header shared by the landing page, the dashboard and the trade
 * history. Before this existed each surface rendered its own bespoke bar —
 * different heights, different wordmark sizes, different border weights — so
 * moving between them felt like moving between three products rather than
 * three views of one.
 *
 * Sticky with a blurred obsidian backdrop rather than an opaque bar, so the
 * atmosphere layer and the content scrolling underneath stay faintly visible
 * through it. That keeps the page reading as one continuous surface, which is
 * the premise of the clay elevation model.
 *
 * `current` is passed in rather than read from `usePathname`. Every page
 * statically knows its own route, so the hook bought nothing but a
 * `next/navigation` import — which forced this into a client component and,
 * under the test suite's `vmThreads` pool, could not be loaded at all
 * (@swc/helpers ships ESM inside a CommonJS package, so the VM module runner
 * throws at import time). Taking the route as a prop keeps the header a
 * server component on the landing page and removes the dependency entirely.
 *
 * `action` is the right-hand slot: the landing page puts its primary call to
 * action there, the app surfaces put the wallet connection there.
 */
export function SiteHeader({
  current,
  action,
}: {
  /** Route of the page rendering this header, used to mark the active nav item. */
  current?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-border-well/80 bg-surface-base/72 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[var(--shell-width)] items-center gap-6 px-5 lg:px-8">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-[-0.04em] text-text-bright focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-hard"
        >
          SEER
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
          {NAV.map((item) => {
            const active = current === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 font-mono text-[13px] transition-colors duration-[--duration-fast] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hard ${
                  active ? "clay-well bg-surface-well text-text-bright" : "text-text-dim hover:text-text-bright"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">{action}</div>
      </div>
    </header>
  );
}
