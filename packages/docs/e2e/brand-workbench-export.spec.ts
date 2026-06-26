/**
 * Brand Workbench — Export stage CUJ (VI-563).
 *
 * The Export view compiles the dogfood Visor Brand Record into its `.visor.yaml` `brand-strategy:`
 * block + agent manifest, renders the live brand book, surfaces the coherence gate, and offers the
 * per-artifact downloads. Functional (not visual-regression) — no screenshot baselines.
 *
 * testids stay within the frozen spec/INTERFACE.d.ts set (bw-export, bw-export-yaml,
 * bw-visibility-*, bw-export-submit); the new surfaces (manifest preview, brand book, downloads) are
 * selected by role/text. R-PROVE-NONBLOCKING: a coherence fail never blocks export.
 */
import { test, expect, type Page } from "@playwright/test"

const ROUTE = "/brand-workbench"

async function gotoExport(page: Page) {
  await page.goto(ROUTE)
  await page.getByTestId("bw-begin").click()
  await page.getByTestId("bw-spine-node-export").getByRole("button").click()
  await expect(page.getByTestId("bw-export")).toBeVisible()
}

test.describe("Brand Workbench — Export (VI-563)", () => {
  test("renders the .visor.yaml block, the agent manifest, and the live brand book", async ({
    page,
  }) => {
    await gotoExport(page)
    const view = page.getByTestId("bw-export")

    // The real serialized `.visor.yaml` brand-strategy block.
    const yaml = page.getByTestId("bw-export-yaml")
    await expect(yaml).toBeVisible()
    await expect(yaml).toContainText("brand-strategy:")
    await expect(yaml).toContainText("onliness")

    // The agent manifest — a JSON projection (quoted keys are manifest-specific) that EXCLUDES `core`.
    await expect(view.getByRole("heading", { name: "Agent manifest" })).toBeVisible()
    await expect(view).toContainText('"positioning"')
    await expect(view).not.toContainText('"core"')

    // The live brand book — the same record, read-only and formatted.
    await expect(view.getByRole("heading", { name: /live brand book/i })).toBeVisible()
    await expect(view).toContainText("Positioning")
    await expect(view).toContainText("Pillars")
    await expect(view).toContainText("coherent")

    // The coherence gate is present and non-blocking — submit stays enabled despite a fail.
    await expect(view.getByRole("heading", { name: "Coherence gate" })).toBeVisible()
    await expect(page.getByTestId("bw-export-submit")).toBeEnabled()
  })

  test("the per-artifact + submit buttons emit downloads", async ({ page }) => {
    await gotoExport(page)

    const yamlDownload = page.waitForEvent("download")
    await page.getByRole("button", { name: "Download .visor.yaml" }).click()
    expect((await yamlDownload).suggestedFilename()).toBe("brand-strategy.visor.yaml")

    const manifestDownload = page.waitForEvent("download")
    await page.getByRole("button", { name: "Download manifest.brand.json" }).click()
    expect((await manifestDownload).suggestedFilename()).toBe("manifest.brand.json")

    // The primary CTA exports the whole system (emits the .visor.yaml patch).
    const submitDownload = page.waitForEvent("download")
    await page.getByTestId("bw-export-submit").click()
    expect((await submitDownload).suggestedFilename()).toBe("brand-strategy.visor.yaml")
  })

  test("private visibility gates the agent manifest", async ({ page }) => {
    await gotoExport(page)
    await page.getByTestId("bw-visibility-private").click()

    const view = page.getByTestId("bw-export")
    // Manifest preview is replaced by the private note; its download is disabled.
    await expect(view).toContainText("No public agent manifest is emitted")
    await expect(page.getByRole("button", { name: "Download manifest.brand.json" })).toBeDisabled()
    // The emitted `.visor.yaml` now declares the record private.
    await expect(page.getByTestId("bw-export-yaml")).toContainText("visibility: private")
  })
})
