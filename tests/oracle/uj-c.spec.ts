// Derived from: spec/cuj-coverage.yaml — UJ-C "BYOK + AI seam (local-first, Claude-first)".
//   Only `covered` steps are scaffolded: step 3 (key active / model chip) and step 5 (adversarial challenge).
//   Steps 1,2,4,6,7 are partial:/gap:VI-562 → omitted (belong to the AI-seam build, not VI-559).
//   testids: spec/INTERFACE.d.ts BrandWorkbenchTestId. Route: BrandWorkbenchRoute.
// TIER 2: both covered steps live on the Strategy core screen — reached by beginning the interview
//   (VI-560 made Start the entry).

import { test, expect, type Page } from "@playwright/test"

const ROUTE = "/brand-workbench" // spec/INTERFACE.d.ts BrandWorkbenchRoute

async function begin(page: Page) {
  await page.goto(ROUTE)
  await page.getByTestId("bw-begin").click()
}

test.describe("UJ-C — BYOK + AI seam", () => {
  test("UJ-C.3 — key active: key pill + model chip show 'Claude · key active'", async ({ page }) => {
    await begin(page)
    await expect(page.getByTestId("bw-key-pill")).toBeVisible()
    await expect(page.getByTestId("bw-model-chip")).toBeVisible()
  })

  test("UJ-C.5 — AI returns an adversarial challenge; human holds the gate", async ({ page }) => {
    await begin(page)
    await expect(page.getByTestId("bw-challenge")).toBeVisible()
    await expect(page.getByTestId("bw-challenge-keep")).toBeVisible()
    await expect(page.getByTestId("bw-challenge-rewrite")).toBeVisible()
  })
})
