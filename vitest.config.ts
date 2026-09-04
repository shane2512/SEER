import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
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
