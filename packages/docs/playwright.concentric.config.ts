import { defineConfig, devices } from "@playwright/test";

// Concentric-corner gate (VI-838): scans every component page on the production
// build, in its own CI job. Needs `npm run docs:build` first; `next start` has
// no per-route compile, so the scan is fast and cannot take the dev server down.
const PORT = 4052;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "concentric-scan.spec.ts",
  forbidOnly: !!process.env.CI,
  retries: 0,
  // The spec opens its own pages in parallel.
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }], ["github"]] : "list",
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run start -w packages/docs -- -p ${PORT}`,
    cwd: "../../",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
