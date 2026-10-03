// @vitest-environment node
/**
 * VI-666: the selected edge is a state edge. Like focus and invalid it draws at
 * --control-state-edge-width, so `edges: off` (--control-edge-width: 0) removes
 * resting edges and leaves it. A selected row carried by a faint fill alone
 * fails WCAG 1.4.11 (3:1) and 1.4.1. Proven in a real browser; skips where
 * Chromium is unavailable.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { bundle, close, launch, open, ready } from "../../__tests__/render-page"

const SELECTED = `(function () {
  var row = document.querySelector('[data-selected="true"]');
  var cs = getComputedStyle(row, "::after");
  return { width: parseFloat(cs.outlineWidth) || 0, style: cs.outlineStyle, color: cs.outlineColor, box: row.getBoundingClientRect().height };
})()`
const REST = `(function () {
  var row = document.querySelector('[data-slot="action-row"]:not([data-selected])');
  var cs = getComputedStyle(row, "::after");
  return { color: cs.outlineColor, y: row.getBoundingClientRect().y };
})()`

beforeAll(async () => {
  await launch()
}, 60_000)
afterAll(close)

type Edge = { width: number; style: string; color: string; box: number }

describe("ActionRow selected edge survives edges: off", () => {
  it("draws the selected edge with the resting-edge switch on and off", async (ctx) => {
    if (!ready()) return ctx.skip()
    for (const scopeCss of ["", "--control-edge-width: 0;", "--control-edge-width: 0px;"]) {
      const page = await open("action-row", "default", { scopeCss })
      const edge = (await page.evaluate(SELECTED)) as Edge
      await page.close()
      expect(edge.style, scopeCss).toBe("solid")
      expect(edge.width, `selected edge width at "${scopeCss}"`).toBe(1)
      expect(edge.color, "selected edge is visible").not.toMatch(/^rgba\(0, 0, 0, 0\)$|transparent/)
    }
  }, 30_000)

  it("draws no edge on a resting row, and adding the selected edge moves nothing", async (ctx) => {
    if (!ready()) return ctx.skip()
    const page = await open("action-row", "default", { scopeCss: "--control-edge-width: 0;" })
    const rest = (await page.evaluate(REST)) as { color: string }
    expect(rest.color).toMatch(/^rgba\(0, 0, 0, 0\)$|transparent/)
    const shifted = (await page.evaluate(`(function () {
      var row = document.querySelector('[data-selected="true"]');
      var before = row.getBoundingClientRect().height;
      row.removeAttribute("data-selected");
      return before - row.getBoundingClientRect().height;
    })()`)) as number
    await page.close()
    expect(shifted).toBe(0)
  }, 30_000)

  it("honours --control-state-edge-width", async (ctx) => {
    if (!ready()) return ctx.skip()
    const page = await open("action-row", "default", { scopeCss: "--control-edge-width: 0; --control-state-edge-width: 2px;" })
    expect(((await page.evaluate(SELECTED)) as Edge).width).toBe(2)
    await page.close()
  }, 30_000)

  it("mutation control: pointed back at --control-edge-width, the selected edge vanishes", async (ctx) => {
    if (!ready()) return ctx.skip()
    const b = await bundle("action-row", "default")
    const mutated = b.css.replaceAll("--control-state-edge-width", "--control-edge-width")
    expect(mutated).not.toBe(b.css)
    const page = await open("action-row", "default", { scopeCss: "--control-edge-width: 0;", componentCss: mutated })
    expect(((await page.evaluate(SELECTED)) as Edge).width).toBe(0)
    await page.close()
  }, 30_000)
})
