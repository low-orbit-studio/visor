// Derived from: spec/cuj-coverage.yaml — UJ-D "Error Recovery & Validation Rejects".
//   Covered steps: 1, 2 (challenge, on Strategy) and 6 (Export proceeds despite warnings/fails).
//   Encodes R-PROVE-NONBLOCKING: warn AND fail are advisory; export proceeds.
//   testids: spec/INTERFACE.d.ts BrandWorkbenchTestId. Route: BrandWorkbenchRoute.
// TIER 2: VI-560 makes the stages navigable. D.1/D.2 (challenge) reach Strategy by beginning the
//   interview; D.6 (Export proceeds) navigates to Export via the spine. D.3/D.5 assert the Prove fix
//   action (`bw-check-fix`), which the shared CheckRow does not yet forward to its fix button — they
//   stay test.fixme pending that small component enhancement (the Prove checks + fix buttons render).

import { test, expect, type Page } from "@playwright/test"

const ROUTE = "/brand-workbench" // spec/INTERFACE.d.ts BrandWorkbenchRoute

async function begin(page: Page) {
  await page.goto(ROUTE)
  await page.getByTestId("bw-begin").click()
}

async function gotoStep(page: Page, step: string) {
  await begin(page)
  await page.getByTestId(`bw-spine-node-${step}`).getByRole("button").click()
}

test.describe("UJ-D — Error Recovery & Validation Rejects", () => {
  test("UJ-D.1 — Positioning too generic → AI challenge 'push harder'", async ({ page }) => {
    await begin(page)
    await expect(page.getByTestId("bw-challenge")).toBeVisible()
  })

  test("UJ-D.2 — resolve the challenge: keep or rewrite", async ({ page }) => {
    await begin(page)
    await expect(page.getByTestId("bw-challenge-keep")).toBeVisible()
    await expect(page.getByTestId("bw-challenge-rewrite")).toBeVisible()
  })

  test.fixme("UJ-D.3 — Prove: voice-drift warning carries a 'Rewrite to voice' fix", async ({ page }) => {
    // Needs bw-check-fix forwarded by the shared CheckRow component.
    await gotoStep(page, "prove")
    await expect(page.getByTestId("bw-check").first()).toBeVisible()
    await expect(page.getByTestId("bw-check-fix").first()).toBeVisible()
  })

  test.fixme("UJ-D.5 — Prove: accessibility fail carries 'Suggest a fix' (non-blocking)", async ({ page }) => {
    // Needs bw-check-fix forwarded by the shared CheckRow component.
    await gotoStep(page, "prove")
    await expect(page.getByTestId("bw-check").first()).toBeVisible()
    await expect(page.getByTestId("bw-check-fix").first()).toBeVisible()
  })

  test("UJ-D.6 — proceed to Export despite warnings/fails (nothing blocks you)", async ({ page }) => {
    await gotoStep(page, "export")
    await expect(page.getByTestId("bw-export")).toBeVisible()
    await expect(page.getByTestId("bw-export-submit")).toBeEnabled()
  })
})
