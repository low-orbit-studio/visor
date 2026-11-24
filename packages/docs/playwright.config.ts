import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // These run against the production build: playwright.prod.config.ts (VI-722)
  // and playwright.concentric.config.ts, in its own CI job (VI-838).
  testIgnore: ["color-mode.spec.ts", "concentric-scan.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html"], ["github"]] : "html",
  // VR baselines live under `e2e/__snapshots__/<spec-name>/...`. This keeps
  // per-theme PNGs neatly grouped per spec rather than scattered alongside
  // the test source files.
  snapshotPathTemplate: "{testDir}/__snapshots__/{testFileName}/{arg}{ext}",
  expect: {
    // 1.5% pixel-diff tolerance is wide enough to survive minor cross-platform
    // font-rasterization differences (macOS local dev vs Linux CI) without
    // masking real regressions. Tune per-test with `maxDiffPixelRatio` if a
    // given page legitimately needs a tighter or looser bound.
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.015,
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    baseURL: "http://localhost:4050",
    trace: "on-first-retry",
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      // VI-808: reads the computed -webkit-backdrop-filter, which Chromium does not have.
      name: "webkit",
      testMatch: "popover-glass.spec.ts",
      grep: /Popover glass: five looks at 1440/,
      use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: "npm run dev -w packages/docs",
    cwd: "../../",
    url: "http://localhost:4050",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
