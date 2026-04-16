import { defineWorkspace } from "vitest/config"

export default defineWorkspace([
  {
    extends: "./vitest.config.ts",
    test: {
      name: "node",
      environment: "node",
      pool: "threads",
      setupFiles: [],
      include: [
        "scripts/**/*.test.ts",
        "packages/cli/**/*.test.ts",
        "packages/theme-engine/**/*.test.ts",
      ],
    },
  },
  {
    extends: "./vitest.config.ts",
    test: {
      name: "dom",
      environment: "happy-dom",
      pool: "threads",
      include: [
        "components/**/*.test.{ts,tsx}",
        "blocks/**/*.test.{ts,tsx}",
        "hooks/**/*.test.{ts,tsx}",
        "packages/docs/**/*.test.{ts,tsx}",
        "packages/tokens/**/*.test.{ts,tsx}",
      ],
    },
  },
])
