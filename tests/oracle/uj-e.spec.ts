// Derived from: spec/cuj-coverage.yaml — UJ-E "Empty / First-Run (no prior brand)".
//   Only `covered` steps are scaffolded: 1, 2, 3. Step 4 is partial:VI-562 (AI cold-start) → omitted.
//   testids: spec/INTERFACE.d.ts BrandWorkbenchTestId. Route: BrandWorkbenchRoute.
// TIER 2: the Start screen is the entry view, built in VI-560 — these activate here.

import { test, expect } from "@playwright/test"

const ROUTE = "/brand-workbench" // spec/INTERFACE.d.ts BrandWorkbenchRoute

test.describe("UJ-E — Empty / First-Run (no prior brand)", () => {
  test("UJ-E.1 — Start → choose 'Start from scratch' (blank path)", async ({ page }) => {
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-start")).toBeVisible()
    await expect(page.getByTestId("bw-path-blank")).toBeVisible()
  })

  test("UJ-E.2 — enter brand name (empty/first-run state)", async ({ page }) => {
    await page.goto(ROUTE)
    await page.getByTestId("bw-path-blank").click()
    await expect(page.getByTestId("bw-name-input")).toBeVisible()
  })

  test("UJ-E.3 — choose public/private visibility", async ({ page }) => {
    await page.goto(ROUTE)
    await page.getByTestId("bw-path-blank").click()
    await expect(page.getByTestId("bw-visibility-toggle")).toBeVisible()
  })
})
