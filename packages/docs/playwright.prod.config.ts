import { defineConfig, devices } from "@playwright/test";

// Production-build gate (VI-722): color-mode resolution and built-site routing.
// Needs `npm run docs:build` first; serves it with `next start`, which is what
// Vercel serves (redirects, prerender and production CSS included).
const PORT = 4051;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "color-mode.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
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
