// Derived from: spec/cuj-coverage.yaml — UJ-A "Guided Full Onboarding (Start → Export)".
//   Only `covered` steps are scaffolded (steps 1–13). Step 14 (emit to disk) is gap:VI-563 → omitted.
//   testids: spec/INTERFACE.d.ts BrandWorkbenchTestId / SpineNodeTestId. Route: BrandWorkbenchRoute.
// TIER 2: the presentational layer is impl-first. VI-559 built the static Strategy core screen;
//   VI-560 makes the seven journey stages navigable, so every step below is now active — the Start
//   screen is the entry and each downstream stage is reached by clicking its spine node (the spine
//   doubles as the journey nav, journey.html).

import { test, expect, type Page } from "@playwright/test"

const ROUTE = "/brand-workbench" // spec/INTERFACE.d.ts BrandWorkbenchRoute

/** Land on Start and begin the interview → strategy view (Positioning). */
async function begin(page: Page) {
  await page.goto(ROUTE)
  await page.getByTestId("bw-begin").click()
}

/** Begin, then navigate to a spine node via the spine (the journey nav). */
async function gotoStep(page: Page, step: string) {
  await begin(page)
  await page.getByTestId(`bw-spine-node-${step}`).getByRole("button").click()
}

test.describe("UJ-A — Guided Full Onboarding (Start → Export)", () => {
  test("UJ-A.1 — land on Start; seed-vs-blank path cards present", async ({ page }) => {
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-start")).toBeVisible()
    await expect(page.getByTestId("bw-path-seed")).toBeVisible()
    await expect(page.getByTestId("bw-path-blank")).toBeVisible()
  })

  test("UJ-A.2 — blank path: enter name, choose visibility", async ({ page }) => {
    await page.goto(ROUTE)
    await page.getByTestId("bw-path-blank").click()
    await page.getByTestId("bw-name-input").fill("Visor")
    await expect(page.getByTestId("bw-visibility-toggle")).toBeVisible()
  })

  test("UJ-A.3 — Begin advances to Positioning (strategy view)", async ({ page }) => {
    await page.goto(ROUTE)
    await page.getByTestId("bw-path-blank").click()
    await page.getByTestId("bw-name-input").fill("Visor")
    await page.getByTestId("bw-begin").click()
    await expect(page.getByTestId("bw-root")).toHaveAttribute("data-stage", "strategy")
    await expect(page.getByTestId("bw-spine-node-positioning")).toBeVisible()
  })

  test("UJ-A.4 — Positioning: AI onliness proposal turn renders", async ({ page }) => {
    await begin(page)
    await expect(page.getByTestId("bw-elicit-thread")).toBeVisible()
    await expect(page.getByTestId("bw-turn-assistant").first()).toBeVisible()
  })

  test("UJ-A.5 — Positioning challenge gate: keep or rewrite", async ({ page }) => {
    await begin(page)
    await expect(page.getByTestId("bw-challenge")).toBeVisible()
    await expect(page.getByTestId("bw-challenge-keep")).toBeVisible()
    await expect(page.getByTestId("bw-challenge-rewrite")).toBeVisible()
  })

  test("UJ-A.6 — Essence: lock 2–3 words via the onliness mad-lib", async ({ page }) => {
    await begin(page)
    await expect(page.getByTestId("bw-tool")).toBeVisible()
    await expect(page.getByTestId("bw-tool-slot").first()).toBeVisible()
    await expect(page.getByTestId("bw-section-complete")).toBeVisible()
  })

  test("UJ-A.7 — Personality: archetype + trait/antonym confirmation", async ({ page }) => {
    await begin(page)
    await expect(page.getByTestId("bw-root")).toHaveAttribute("data-stage", "strategy")
    await expect(page.getByTestId("bw-spine-node-personality")).toBeVisible()
  })

  test("UJ-A.8 — Pillars: confirm pillars and governed tokens", async ({ page }) => {
    await begin(page)
    await expect(page.getByTestId("bw-spine-node-pillars")).toBeVisible()
  })

  test("UJ-A.9 — Voice: lock voice traits (verbal view)", async ({ page }) => {
    await gotoStep(page, "voice")
    await expect(page.getByTestId("bw-root")).toHaveAttribute("data-stage", "verbal")
    await expect(page.getByTestId("bw-spine-node-voice")).toBeVisible()
  })

  test("UJ-A.10 — Tone: five live tone-by-context specimens on the canvas", async ({ page }) => {
    await gotoStep(page, "tone")
    await expect(page.getByTestId("bw-root")).toHaveAttribute("data-stage", "verbal")
    await expect(page.getByTestId("bw-spine-node-tone")).toBeVisible()
    await expect(page.getByTestId("bw-canvas-section").first()).toBeVisible()
  })

  test("UJ-A.11 — Visual: suggested color/type/marks review (visual view)", async ({ page }) => {
    await gotoStep(page, "visual")
    await expect(page.getByTestId("bw-root")).toHaveAttribute("data-stage", "visual")
    await expect(page.getByTestId("bw-visual")).toBeVisible()
  })

  test("UJ-A.12 — Prove: coherence audit — score ring + checks", async ({ page }) => {
    await gotoStep(page, "prove")
    await expect(page.getByTestId("bw-prove")).toBeVisible()
    await expect(page.getByTestId("bw-score-ring")).toBeVisible()
    await expect(page.getByTestId("bw-check").first()).toBeVisible()
  })

  test("UJ-A.13 — Export: review .visor.yaml + choose visibility", async ({ page }) => {
    await gotoStep(page, "export")
    await expect(page.getByTestId("bw-export")).toBeVisible()
    await expect(page.getByTestId("bw-export-yaml")).toBeVisible()
    await expect(page.getByTestId("bw-visibility-public")).toBeVisible()
    await expect(page.getByTestId("bw-visibility-private")).toBeVisible()
  })
})
