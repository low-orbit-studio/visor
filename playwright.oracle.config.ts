import { defineConfig, devices } from "@playwright/test"

/**
 * Brand Workbench Tier-2 acceptance oracle (VI-592 spec-freeze → VI-559 build).
 *
 * Runs the activated CUJ Playwright specs in `tests/oracle/*.spec.ts` (separate from the docs e2e
 * suite, which has its own config + VR snapshots). The Tier-1 oracle (`tests/oracle/*.test.ts`) runs
 * under Vitest; this config is restricted to the `uj-*.spec.ts` files so it never picks those up.
 *
 * Activated by VI-559: the Strategy core-screen steps. The Start screen + downstream stage views stay
 * `test.fixme` until VI-560 — Playwright reports them as skipped, not failures.
 *
 * Run: `npm run test:oracle:e2e` (boots the docs dev server on :4050 if one isn't already up).
 */
export default defineConfig({
  testDir: "./tests/oracle",
  testMatch: /uj-.*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4050",
    trace: "on-first-retry",
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -w packages/docs",
    url: "http://localhost:4050",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
