// @vitest-environment node
/**
 * VI-659 — Button `size="icon"`, proven in a real browser.
 *
 * The icon-only size is a square mark around one glyph: computed width equals
 * computed height, at the default metrics and when a theme retunes the glyph
 * and pad. The ghost face draws no edge; the outline face's edge is covered by
 * control-edge-switch.test.ts (it turns off with --control-edge-width: 0).
 *
 * Skips where Chromium is unavailable (playwright is an optional dep).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { REST_EDGE, bundle, close, launch, open, ready } from "./render-page"

const BOX = `(function () {
  var cs = getComputedStyle(document.querySelector("#root button"));
  return [parseFloat(cs.width), parseFloat(cs.height)];
})()`

async function box(fixture: string, opts: { scopeCss?: string; componentCss?: string } = {}): Promise<number[]> {
  const page = await open("button", fixture, opts)
  const b = (await page.evaluate(BOX)) as number[]
  await page.close()
  return b
}

beforeAll(async () => {
  await launch()
}, 60_000)

afterAll(close)

describe("VI-659 — Button size=\"icon\" (real browser)", () => {
  for (const fixture of ["icon", "icon-outline"]) {
    it(`${fixture}: computed width equals computed height`, async (ctx) => {
      if (!ready()) return ctx.skip()
      const [width, height] = await box(fixture)
      expect(width).toBeGreaterThan(0)
      expect(width).toBe(height)
      // Glyph (1rem) plus the pad (spacing-2) on each side.
      expect(width).toBe(32)
    }, 30_000)
  }

  it("stays square when a theme retunes the glyph and the pad", async (ctx) => {
    if (!ready()) return ctx.skip()
    // 24 + 2 × 6 = 36: neither value is the default (1rem, 8px), so ignoring either token fails.
    const [width, height] = await box("icon", { scopeCss: "--button-icon-size: 24px; --button-icon-pad: 6px;" })
    expect([width, height]).toEqual([36, 36])
  }, 30_000)

  it("mutation control — a padded, text-sized box is caught as not square", async (ctx) => {
    if (!ready()) return ctx.skip()
    // What the icon-only size replaces: a glyph in a padded md button.
    const [width, height] = await box("icon", { componentCss: (await bundle("button", "icon")).css + "\n#root button { width: auto; height: 2.5rem; padding: 0 1rem; }" })
    expect(width).not.toBe(height)
  }, 30_000)

  it("ghost draws no edge", async (ctx) => {
    if (!ready()) return ctx.skip()
    const page = await open("button", "icon")
    expect(await page.evaluate(REST_EDGE)).toBe(0)
    await page.close()
    // Mutation control: the outline face does draw one, so the probe can see it.
    const outline = await open("button", "icon-outline")
    expect(await outline.evaluate(REST_EDGE)).toBeGreaterThan(0)
    await outline.close()
  }, 30_000)
})
