import type { AnchorHTMLAttributes } from "react";

/**
 * Test-environment stand-in for `next/link`, wired up via `resolve.alias` in
 * vitest.config.ts.
 *
 * The real module cannot be loaded under the `vmThreads` pool: it pulls in
 * @swc/helpers, which ships ESM files inside a package marked CommonJS, and
 * the VM module runner throws "Unexpected token 'export'" at import time —
 * failing whole test files before any assertion runs. Neither
 * `server.deps.inline` nor `deps.optimizer.ssr.include` fixes it under that
 * pool (both were tried; `inline` works only under `threads`), and the pool
 * choice is itself deliberate, made to fix a real timer-test flake.
 *
 * Substituting an anchor is faithful rather than lossy: for an internal href
 * with no prefetch or client-navigation assertion anywhere in the suite,
 * `next/link` renders exactly this element. Tests still see the same tag,
 * href, class list and text they would in the browser.
 */
export default function Link({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
