// VI-594 — UJ-F Seeded Onboarding CUJ. Closes cuj-coverage UJ-F steps 3 (AI ingests the seed and
// proposes a first-draft positioning) and 4 (seed ingestion fails → error + retry).
//
// Frozen golden-path testids (spec/INTERFACE.d.ts): bw-start, bw-path-seed, bw-begin, bw-key-pill,
// bw-root. The `bw-seed-*` / `bw-seeded-draft` testids are VI-594's OWN ingestion surface — namespaced
// so they never collide with the frozen set (same precedent as VI-562's bw-seam-* / bw-byok-*). The
// seed path is gated on a key (D5 / R-KEYLESS); the AI proposal is mocked at the network layer.

import { test, expect, type Page } from "@playwright/test"

const ROUTE = "/brand-workbench"

const PROPOSED = {
  onliness: "The only design system you compile from typed intent — for humans and agents.",
  category: "brand + design-system substrate",
  differentiation: "one portable file, against a live engine",
}

/** Store a BYOK key via the top-bar pill → flips the workbench to key-active (unlocks the seed path). */
async function setKey(page: Page) {
  await page.getByTestId("bw-key-pill").click()
  await page.getByTestId("bw-byok-key-input").fill("sk-ant-test-key")
  await page.getByTestId("bw-byok-save").click()
  await page.keyboard.press("Escape")
  await expect(page.getByTestId("bw-key-pill")).toHaveAttribute("data-key-status", "key-active")
}

/** Intercept the Anthropic Messages API with one canned DraftBrandRecord proposal (no real network). */
async function mockProposal(page: Page) {
  await page.route("**/api.anthropic.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: [{ type: "text", text: JSON.stringify({ positioning: PROPOSED }) }],
        stop_reason: "end_turn",
      }),
    }),
  )
}

test.describe("UJ-F — Seeded Onboarding (VI-594)", () => {
  test("keyless: the seed path is disabled with a BYOK pointer (D5)", async ({ page }) => {
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-path-seed")).toHaveAttribute("data-disabled", "true")
    await expect(page.getByTestId("bw-seed-disabled")).toBeVisible()
    await expect(page.getByTestId("bw-seed-input")).toBeDisabled()
  })

  test("paste path: seed → AI proposes → land on Positioning seeded (step 3)", async ({ page }) => {
    await mockProposal(page)
    await page.goto(ROUTE)
    await setKey(page)

    // Paste raw notes (non-URL prose → the paste modality, no network for extraction).
    await page
      .getByTestId("bw-seed-input")
      .fill("Visor is a design system you copy and own. It ships your tokens as one portable file.")
    await page.getByTestId("bw-begin").click()

    // Landed on Positioning (strategy view) with the first-draft proposal surfaced.
    await expect(page.getByTestId("bw-root")).toHaveAttribute("data-stage", "strategy")
    await expect(page.getByTestId("bw-start")).toHaveCount(0)
    const banner = page.getByTestId("bw-seeded-draft")
    await expect(banner).toBeVisible()
    await expect(banner).toContainText("compile from typed intent")
  })

  test("error path: a failed URL ingest renders the error card with retry + fallback (step 4)", async ({
    page,
  }) => {
    // A reachable-but-broken seed URL → fetch-failed → the designed error surface.
    await page.route("**/seed-fixture.example/**", (route) => route.fulfill({ status: 404, body: "nope" }))
    await page.goto(ROUTE)
    await setKey(page)

    await page.getByTestId("bw-seed-input").fill("https://seed-fixture.example/deck")
    await page.getByTestId("bw-begin").click()

    const errorCard = page.getByTestId("bw-seed-error")
    await expect(errorCard).toBeVisible()
    await expect(page.getByTestId("bw-seed-error-retry")).toBeVisible()
    await expect(page.getByTestId("bw-seed-error-fallback")).toBeVisible()
    // The error surface keeps the operator on Start (no advance on failure).
    await expect(page.getByTestId("bw-start")).toBeVisible()

    // Fallback → blank onboarding (UJ-A): selects the blank path, clears the error.
    await page.getByTestId("bw-seed-error-fallback").click()
    await expect(page.getByTestId("bw-seed-error")).toHaveCount(0)
    await expect(page.getByTestId("bw-path-blank")).toHaveAttribute("data-selected", "true")
  })
})
