import path from "path"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "packages/docs"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    // VI-592: keep only the Tier-2 Playwright CUJ scaffolds (tests/oracle/*.spec.ts) out of the
    // jsdom unit-test run — they run via Playwright, not vitest. The Tier-1 oracle *.test.ts DO run
    // (here and in brand-workbench-oracle.yml). A blanket tests/oracle/** exclude would make the
    // oracle workflow's explicitly-named files unrunnable ("No test files found").
    exclude: ["**/node_modules/**", "**/e2e/**", "tests/oracle/**/*.spec.ts"],
    // VI-171: threads pool is ~12% faster than Vitest 4's default "forks".
    // `isolate: false` was evaluated but causes state leakage across ~107 of 222
    // files (Radix Menu portals, table state) — see VI-179 follow-up.
    pool: "threads",
    css: {
      modules: {
        classNameStrategy: "non-scoped",
      },
    },
    coverage: {
      provider: "v8",
      include: [
        "components/**/*.{ts,tsx}",
        "hooks/**/*.ts",
        "lib/**/*.ts",
      ],
      exclude: [
        "**/__tests__/**",
        "**/*.test.{ts,tsx}",
        "**/*.d.ts",
        "**/index.ts",
      ],
    },
  },
})
