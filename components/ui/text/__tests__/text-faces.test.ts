// @vitest-environment node
/**
 * VI-715 — Text's mono face and success and amber inks, proven in a real browser.
 *
 *  - `family="mono"` resolves to the theme's `--font-mono`.
 *  - `color="success"` and `color="amber"` resolve to their tokens; amber falls
 *    back to `--text-warning` when a theme binds no `--text-amber`.
 *  - An unset family still reads `--font-body`. That unset props emit exactly
 *    the 1.29.0 classes is text.test.tsx's job.
 *
 * Skips where Chromium is unavailable (playwright is an optional dep).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { close, launch, open, ready } from "../../__tests__/render-page"

const face = (name: string) => `#root [data-face=${name}]`

async function read(selector: string, prop: string, opts: Parameters<typeof open>[2] = {}): Promise<string> {
  const page = await open("text", "faces", opts)
  const value = (await page.evaluate(
    `getComputedStyle(document.querySelector(${JSON.stringify(selector)})).getPropertyValue(${JSON.stringify(prop)})`,
  )) as string
  await page.close()
  return value
}

beforeAll(async () => {
  await launch()
}, 60_000)

afterAll(close)

describe("VI-715 — Text faces (real browser)", () => {
  it("family='mono' reads --font-mono", async (ctx) => {
    if (!ready()) return ctx.skip()
    const bound = await read(face("mono"), "font-family", { scopeCss: `--font-mono: "Space Mono", monospace;` })
    expect(bound).toBe(`"Space Mono", monospace`)
    expect(await read(face("plain"), "font-family", { scopeCss: `--font-mono: "Space Mono", monospace;` })).not.toBe(bound)
  }, 30_000)

  it("color='success' reads --text-success", async (ctx) => {
    if (!ready()) return ctx.skip()
    expect(await read(face("success"), "color", { scopeCss: "--text-success: #22c55e;" })).toBe("rgb(34, 197, 94)")
  }, 30_000)

  it("color='amber' reads --text-amber", async (ctx) => {
    if (!ready()) return ctx.skip()
    expect(await read(face("amber"), "color", { scopeCss: "--text-amber: #f59e0b;" })).toBe("rgb(245, 158, 11)")
  }, 30_000)

  it("color='amber' falls back to --text-warning", async (ctx) => {
    if (!ready()) return ctx.skip()
    const scopeCss = "--text-warning: #fbbf24;"
    expect(await read(face("amber"), "color", { scopeCss })).toBe("rgb(251, 191, 36)")
    expect(await read(face("warning"), "color", { scopeCss })).toBe("rgb(251, 191, 36)")
  }, 30_000)

  it("an unset family still reads --font-body", async (ctx) => {
    if (!ready()) return ctx.skip()
    expect(await read(face("plain"), "font-family", { scopeCss: `--font-body: "Ratio", sans-serif;` })).toBe("Ratio, sans-serif")
  }, 30_000)
})
