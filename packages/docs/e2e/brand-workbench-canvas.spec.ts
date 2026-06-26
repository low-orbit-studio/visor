/**
 * Brand Workbench — Guided ⇄ Canvas state CUJ (VI-561).
 *
 * The Canvas free-edit board (reachable at/after Export, D-8) edits a single shared draft store —
 * no copy-on-switch (D3). Editing an upstream block marks its downstream derivation closure stale
 * (D4, scoped per pillar) and the staleness clears lazily, on the next view of the Guided section
 * that owns it. Functional (not visual-regression) — no screenshot baselines.
 *
 * testids stay within the frozen spec/INTERFACE.d.ts set (bw-board, bw-block, bw-mode-*,
 * bw-spine-node-*); EditableBlock is driven through its accessible labels.
 */
import { test, expect, type Page } from "@playwright/test"

const ROUTE = "/brand-workbench"

function node(page: Page, step: string) {
  return page.getByTestId(`bw-spine-node-${step}`).getByRole("button")
}

function block(page: Page, id: string) {
  return page.locator(`[data-testid="bw-block"][data-block="${id}"]`)
}

async function stage(page: Page): Promise<string | null> {
  return page.getByTestId("bw-root").getAttribute("data-stage")
}

/** Complete the draft (jump to Export so Canvas unlocks per D-8), then enter Canvas mode. */
async function enterCanvas(page: Page) {
  await page.goto(ROUTE)
  await page.getByTestId("bw-begin").click()
  await node(page, "export").click()
  await page.getByTestId("bw-mode-canvas").click()
  await expect(page.getByTestId("bw-board")).toBeVisible()
}

/** Inline-edit a Canvas block via EditableBlock (open → type → Enter to save). */
async function editBlock(page: Page, id: string, label: string, value: string) {
  const cell = block(page, id)
  await cell.getByRole("button", { name: `Edit ${label}` }).click()
  const input = cell.getByRole("textbox", { name: `Edit ${label}` })
  await input.fill(value)
  await input.press("Enter")
}

test.describe("Brand Workbench — Guided ⇄ Canvas (VI-561)", () => {
  test("Guided → Canvas → Guided round trip preserves the edited draft", async ({ page }) => {
    await enterCanvas(page)

    await editBlock(page, "positioning", "Positioning", "We are the only X.")
    await expect(block(page, "positioning")).toContainText("We are the only X.")

    // Leave to Guided (resumes at Export) and back to Canvas — the shared store never re-seeds.
    await page.getByTestId("bw-mode-guided").click()
    expect(await stage(page)).toBe("export")
    await page.getByTestId("bw-mode-canvas").click()
    expect(await stage(page)).toBe("canvas")
    await expect(block(page, "positioning")).toContainText("We are the only X.")
  })

  test("editing a Strategy block re-resolves downstream Verbal/Tone on the next Guided view (D4)", async ({
    page,
  }) => {
    await enterCanvas(page)

    // Editing Positioning (chain root) invalidates its downstream closure (incl. voice + tone).
    await editBlock(page, "positioning", "Positioning", "We are the only X.")
    await expect(block(page, "voice")).toHaveAttribute("data-status", "stale")
    await expect(block(page, "tone")).toHaveAttribute("data-status", "stale")

    // Lazy: switch to Guided and open the Verbal stage (owns voice + tone) → they re-resolve.
    await page.getByTestId("bw-mode-guided").click()
    await node(page, "voice").click()
    expect(await stage(page)).toBe("verbal")

    // Return to Canvas: voice + tone are set again.
    await node(page, "export").click()
    await page.getByTestId("bw-mode-canvas").click()
    await expect(block(page, "voice")).toHaveAttribute("data-status", "set")
    await expect(block(page, "tone")).toHaveAttribute("data-status", "set")
  })
})
