import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

// Local only, never in CI (no WebKit in CI, VI-808): reads the popover's computed
// -webkit-backdrop-filter in each look, which Chromium does not have.
// npx playwright install webkit && npx playwright test -c playwright.webkit.config.ts
export default defineConfig({
  ...base,
  testMatch: "popover-glass.spec.ts",
  grep: /Popover glass: five looks at 1440/,
  projects: [{ name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 } } }],
});
