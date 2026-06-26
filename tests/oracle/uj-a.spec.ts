// Derived from: spec/cuj-coverage.yaml — UJ-A "Guided Full Onboarding (Start → Export)".
//   Only `covered` steps are scaffolded (steps 1–13). Step 14 (emit to disk) is gap:VI-563 → omitted.
//   testids: spec/INTERFACE.d.ts BrandWorkbenchTestId / SpineNodeTestId. Route: BrandWorkbenchRoute.
// TIER 2 (scaffold): the presentational layer is impl-first; tests un-skip as their surface is built.
//   VI-559 builds the static Strategy core screen → activates the strategy-scope steps (A.4–A.8, A.10).
//   The Start screen (A.1–A.3) and the downstream stage views (A.9 verbal, A.11 visual, A.12 prove,
//   A.13 export) are the journey routes → they stay test.fixme until VI-560.

import { test, expect } from "@playwright/test"

const ROUTE = "/brand-workbench" // spec/INTERFACE.d.ts BrandWorkbenchRoute

test.describe("UJ-A — Guided Full Onboarding (Start → Export)", () => {
  test.fixme("UJ-A.1 — land on Start; seed-vs-blank path cards present", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-start")).toBeVisible()
    await expect(page.getByTestId("bw-path-seed")).toBeVisible()
    await expect(page.getByTestId("bw-path-blank")).toBeVisible()
  })

  test.fixme("UJ-A.2 — blank path: enter name, choose visibility", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await page.getByTestId("bw-path-blank").click()
    await page.getByTestId("bw-name-input").fill("Visor")
    await expect(page.getByTestId("bw-visibility-toggle")).toBeVisible()
  })

  test.fixme("UJ-A.3 — Begin advances to Positioning (strategy view)", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await page.getByTestId("bw-path-blank").click()
    await page.getByTestId("bw-name-input").fill("Visor")
    await page.getByTestId("bw-begin").click()
    await expect(page.getByTestId("bw-root")).toHaveAttribute("data-stage", "strategy")
    await expect(page.getByTestId("bw-spine-node-positioning")).toBeVisible()
  })

  test("UJ-A.4 — Positioning: AI onliness proposal turn renders", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-elicit-thread")).toBeVisible()
    await expect(page.getByTestId("bw-turn-assistant").first()).toBeVisible()
  })

  test("UJ-A.5 — Positioning challenge gate: keep or rewrite", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-challenge")).toBeVisible()
    await expect(page.getByTestId("bw-challenge-keep")).toBeVisible()
    await expect(page.getByTestId("bw-challenge-rewrite")).toBeVisible()
  })

  test("UJ-A.6 — Essence: lock 2–3 words via the onliness mad-lib", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-tool")).toBeVisible()
    await expect(page.getByTestId("bw-tool-slot").first()).toBeVisible()
    await expect(page.getByTestId("bw-section-complete")).toBeVisible()
  })

  test("UJ-A.7 — Personality: archetype + trait/antonym confirmation", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-root")).toHaveAttribute("data-stage", "strategy")
    await expect(page.getByTestId("bw-spine-node-personality")).toBeVisible()
  })

  test("UJ-A.8 — Pillars: confirm pillars and governed tokens", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-spine-node-pillars")).toBeVisible()
  })

  test.fixme("UJ-A.9 — Voice: lock voice traits (verbal view)", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-root")).toHaveAttribute("data-stage", "verbal")
    await expect(page.getByTestId("bw-spine-node-voice")).toBeVisible()
  })

  test("UJ-A.10 — Tone: five live tone-by-context specimens on the canvas", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-spine-node-tone")).toBeVisible()
    await expect(page.getByTestId("bw-canvas-section").first()).toBeVisible()
  })

  test.fixme("UJ-A.11 — Visual: suggested color/type/marks review (visual view)", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-root")).toHaveAttribute("data-stage", "visual")
    await expect(page.getByTestId("bw-visual")).toBeVisible()
  })

  test.fixme("UJ-A.12 — Prove: coherence audit — score ring + checks", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-prove")).toBeVisible()
    await expect(page.getByTestId("bw-score-ring")).toBeVisible()
    await expect(page.getByTestId("bw-check").first()).toBeVisible()
  })

  test.fixme("UJ-A.13 — Export: review .visor.yaml + choose visibility", async ({ page }) => {
    // activated by VI-559 build
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-export")).toBeVisible()
    await expect(page.getByTestId("bw-export-yaml")).toBeVisible()
    await expect(page.getByTestId("bw-visibility-public")).toBeVisible()
    await expect(page.getByTestId("bw-visibility-private")).toBeVisible()
  })
})
