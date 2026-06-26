// VI-560 acceptance — journey navigation (Start → Export forward, then back).
//   Exercises the frozen progression through the UI: the spine is the journey nav (journey.html
//   clickable nodes) — forward walks the chain in R-NEXTSTEP order, a reached node navigates back
//   (R-PREVSTEP), and Canvas mode unlocks only at/after Export (D-8 / R-CANVAS-ENTRY).
//   testids: spec/INTERFACE.d.ts. Route: BrandWorkbenchRoute. Single base route + view state (E-6).

import { test, expect, type Page } from "@playwright/test"

const ROUTE = "/brand-workbench"

function node(page: Page, step: string) {
  return page.getByTestId(`bw-spine-node-${step}`).getByRole("button")
}

async function stage(page: Page): Promise<string | null> {
  return page.getByTestId("bw-root").getAttribute("data-stage")
}

test.describe("VI-560 — journey navigation", () => {
  test("forward: Start → Export walks the views in R-NEXTSTEP order", async ({ page }) => {
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-start")).toBeVisible()
    expect(await stage(page)).toBe("start")

    // Begin the interview: start → positioning (strategy view).
    await page.getByTestId("bw-begin").click()
    expect(await stage(page)).toBe("strategy")

    // Walk the chain one node at a time; the view follows STEP_TO_VIEW.
    const walk: Array<[string, string]> = [
      ["essence", "strategy"],
      ["personality", "strategy"],
      ["pillars", "strategy"],
      ["voice", "verbal"],
      ["tone", "verbal"],
      ["visual", "visual"],
      ["prove", "prove"],
      ["export", "export"],
    ]
    for (const [step, expected] of walk) {
      await node(page, step).click()
      expect(await stage(page)).toBe(expected)
    }

    // At Export the draft is complete → Canvas mode is reachable (D-8).
    await expect(page.getByTestId("bw-mode-canvas")).toBeEnabled()
  })

  test("back: a reached spine node returns to its view (R-PREVSTEP)", async ({ page }) => {
    await page.goto(ROUTE)
    await page.getByTestId("bw-begin").click() // positioning (strategy)
    await node(page, "voice").click() // → voice (verbal)
    expect(await stage(page)).toBe("verbal")

    // Positioning is a completed node — navigable back to the strategy view.
    await node(page, "positioning").click()
    expect(await stage(page)).toBe("strategy")
  })

  test("Canvas mode is gated until Export (D-8)", async ({ page }) => {
    await page.goto(ROUTE)
    await expect(page.getByTestId("bw-mode-canvas")).toBeDisabled()

    await page.getByTestId("bw-begin").click() // positioning — still early
    await expect(page.getByTestId("bw-mode-canvas")).toBeDisabled()

    await node(page, "export").click() // complete draft
    expect(await stage(page)).toBe("export")
    await expect(page.getByTestId("bw-mode-canvas")).toBeEnabled()

    // Entering Canvas switches the view (free-edit board).
    await page.getByTestId("bw-mode-canvas").click()
    expect(await stage(page)).toBe("canvas")
    await expect(page.getByTestId("bw-board")).toBeVisible()
  })
})
