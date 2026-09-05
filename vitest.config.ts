import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // `next/link` cannot be imported under the `vmThreads` pool below: it
      // pulls in @swc/helpers, which ships ESM files inside a CommonJS
      // package, and the VM module runner throws "Unexpected token 'export'"
      // at import time — taking down entire test files before any assertion
      // runs. `server.deps.inline` fixes this under `threads` but is ignored
      // by vm pools, and `deps.optimizer.ssr.include` does not fix it either
      // (both were tried). Since the pool choice is deliberate (see below),
      // the link is aliased to an anchor stub instead. That is faithful, not
      // lossy: for internal hrefs with no prefetch or client-navigation
      // assertion in the suite, next/link renders exactly that element.
      "next/link": fileURLToPath(new URL("./__tests__/stubs/next-link.tsx", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Without this, vitest's default excludes (node_modules, dist, .git, ...)
    // don't know about .worktrees/ — a git worktree checked out under the repo
    // root carries its own full copy of every test file, so running from the
    // repo root silently doubles the whole suite (and any flake in it) rather
    // than erroring. Only surfaced once tests were run from outside the
    // worktree itself, where this had never been exercised before.
    exclude: [...configDefaults.exclude, "**/.worktrees/**"],
    // vitest's own diagnostic: recreating a jsdom environment per file (the
    // default) under the default pool showed up as ~70% of total run time
    // and produced a real, reproducible-under-load flake in the full-suite
    // run (a waitFor timeout in a timer-driven test) that never reproduced
    // in isolation. vmThreads keeps per-file isolation (no shared jsdom
    // state between files) while removing the per-file environment
    // recreation cost that was starving timer-based tests under load.
    pool: "vmThreads",
  },
});
