// Derived from: spec/cuj-coverage.yaml — UJ-D "Error Recovery & Validation Rejects".
//   Only `covered` steps are scaffolded: 1, 2, 3, 5, 6. Step 4 is partial:VI-562 (live AI rewrite) → omitted.
//   Encodes R-PROVE-NONBLOCKING: warn AND fail are advisory; export proceeds.
//   testids: spec/INTERFACE.d.ts BrandWorkbenchTestId. Route: BrandWorkbenchRoute.
// TIER 2 (scaffold): test.fixme until VI-559 builds the presentational layer.

import { test, expect } from "@playwright/test"

const ROUTE = "/brand-workbench" // spec/INTERFACE.d.ts BrandWorkbenchRoute

test.describe("UJ-D — Error Recovery & Validation Rejects", () => {
  test.fixme("UJ-D.1 — Positioning too generic → AI challenge 'push harder'", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-challenge")).toBeVisible()
  })

  test.fixme("UJ-D.2 — resolve the challenge: keep or rewrite", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-challenge-keep")).toBeVisible()
    await expect(page.getByTestId("bw-challenge-rewrite")).toBeVisible()
  })

  test.fixme("UJ-D.3 — Prove: voice-drift warning carries a 'Rewrite to voice' fix", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-prove")).toBeVisible()
    await expect(page.getByTestId("bw-check").first()).toBeVisible()
    await expect(page.getByTestId("bw-check-fix").first()).toBeVisible()
  })

  test.fixme("UJ-D.5 — Prove: accessibility fail carries 'Suggest a fix' (non-blocking)", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-check").first()).toBeVisible()
    await expect(page.getByTestId("bw-check-fix").first()).toBeVisible()
  })

  test.fixme("UJ-D.6 — proceed to Export despite warnings/fails (nothing blocks you)", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-export")).toBeVisible()
    await expect(page.getByTestId("bw-export-submit")).toBeEnabled()
  })
})
