// @vitest-environment node
/**
 * VI-862 — FieldError's icon sits on the first line's top, and a theme sizes it.
 *
 * In a real browser: a message that wraps keeps the icon centred on its first
 * line (not the middle of the block), and `--field-error-icon-size` draws the
 * icon at that size even when the consumer passed the SVG a fixed size.
 *
 * Skips where Chromium is unavailable (playwright is an optional dep).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { bundle, close, launch, open, ready } from "../../__tests__/render-page"

const NARROW = "[data-slot=field-error] { width: 90px; }"

interface Geometry { lines: number; firstLineMid: number; iconMid: number; iconWidth: number }

async function measure(opts: { componentCss?: string; scopeCss?: string; iconSize?: string } = {}): Promise<Geometry> {
  const page = await open("field", "control", { extraCss: NARROW, ...opts })
  const g = (await page.evaluate(`(function () {
    var error = document.querySelector("#root [data-slot=field-error]");
    var svg = error.querySelector("[data-slot=field-error-icon] > svg");
    ${opts.iconSize ? `svg.setAttribute("width", ${JSON.stringify(opts.iconSize)}); svg.setAttribute("height", ${JSON.stringify(opts.iconSize)});` : ""}
    var text = Array.prototype.find.call(error.childNodes, function (n) { return n.nodeType === 3; });
    var range = document.createRange();
    range.selectNodeContents(text);
    var rects = range.getClientRects();
    var i = svg.getBoundingClientRect();
    return {
      lines: rects.length,
      firstLineMid: rects[0].top + rects[0].height / 2,
      iconMid: i.top + i.height / 2,
      iconWidth: i.width,
    };
  })()`)) as Geometry
  await page.close()
  return g
}

beforeAll(async () => {
  await launch()
}, 60_000)

afterAll(close)

describe("VI-862 — FieldError icon (real browser)", () => {
  it("centres the icon on the first line of a wrapped message", async (ctx) => {
    if (!ready()) return ctx.skip()
    const g = await measure()
    expect(g.lines, "the message must wrap for this test to mean anything").toBeGreaterThan(1)
    expect(Math.abs(g.iconMid - g.firstLineMid)).toBeLessThan(1)
  }, 30_000)

  it("mutation control — with the old centred row, the icon drifts to the block's middle", async (ctx) => {
    if (!ready()) return ctx.skip()
    const css = (await bundle("field", "control")).css
    const mutated = css.replace(/align-items:\s*flex-start/g, "align-items: center").replace(/height:\s*1lh/g, "height: auto")
    expect(mutated).not.toBe(css)
    const g = await measure({ componentCss: mutated })
    expect(g.lines).toBeGreaterThan(1)
    expect(Math.abs(g.iconMid - g.firstLineMid)).toBeGreaterThan(3)
  }, 30_000)

  it("draws the icon at the theme's size even when the SVG was passed a fixed size", async (ctx) => {
    if (!ready()) return ctx.skip()
    const g = await measure({ scopeCss: "--field-error-icon-size: 27px;", iconSize: "14" })
    expect(g.iconWidth).toBeCloseTo(27, 1)
  }, 30_000)
})
