// Derived from: spec/cuj-coverage.yaml — UJ-E "Empty / First-Run (no prior brand)".
//   Only `covered` steps are scaffolded: 1, 2, 3. Step 4 is partial:VI-562 (AI cold-start) → omitted.
//   testids: spec/INTERFACE.d.ts BrandWorkbenchTestId. Route: BrandWorkbenchRoute.
// TIER 2 (scaffold): test.fixme until VI-559 builds the presentational layer.

import { test, expect } from "@playwright/test"

const ROUTE = "/brand-workbench" // spec/INTERFACE.d.ts BrandWorkbenchRoute

test.describe("UJ-E — Empty / First-Run (no prior brand)", () => {
  test.fixme("UJ-E.1 — Start → choose 'Start from scratch' (blank path)", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-start")).toBeVisible()
    await expect(page.getByTestId("bw-path-blank")).toBeVisible()
  })

  test.fixme("UJ-E.2 — enter brand name (empty/first-run state)", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await page.getByTestId("bw-path-blank").click()
    await expect(page.getByTestId("bw-name-input")).toBeVisible()
  })

  test.fixme("UJ-E.3 — choose public/private visibility", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await page.getByTestId("bw-path-blank").click()
    await expect(page.getByTestId("bw-visibility-toggle")).toBeVisible()
  })
})
