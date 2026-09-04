import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // A git worktree checked out under the repo root carries its own full
    // copy of this project (including its own node_modules once installed) —
    // without this, `next lint`/eslint scans it as if it were source, same
    // class of bug as vitest's default excludes not knowing about it either.
    ".worktrees/**",
  ]),
]);

export default eslintConfig;
