// @vitest-environment node
/**
 * VI-662 — the value never sits under an affix, proven in a real browser.
 *
 * jsdom has no layout, so this bundles the real Input and NumberInput the way
 * `visor render` does, loads them in Chromium, and reads geometry and computed
 * styles. Skips where Chromium or esbuild is missing (optional deps).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { bundle, close, launch, open, ready } from "./render-page"

beforeAll(async () => {
  await launch()
}, 60_000)
afterAll(close)

const LONG = "a".repeat(200)

/** Geometry of the well, the affixes and the input's content box. */
const PROBE = `JSON.stringify((function () {
  var q = function (s) { return document.querySelector(s); };
  var input = q("input");
  var well = q('[data-slot="input-wrapper"]') || q('[data-slot="number-input"]') || input;
  var pre = q('[data-slot$="-prefix"]'), suf = q('[data-slot$="-suffix"]');
  var cs = getComputedStyle(input), r = function (e) { return e && e.getBoundingClientRect().toJSON(); };
  var content = {
    left: input.getBoundingClientRect().left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft),
    right: input.getBoundingClientRect().right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight),
  };
  return { well: r(well), input: r(input), pre: r(pre), suf: r(suf), content: content,
    wellOutline: getComputedStyle(well).outlineStyle + " " + getComputedStyle(well).outlineWidth,
    inputOutline: cs.outlineStyle, inputBorder: cs.borderTopColor, inputBg: cs.backgroundColor,
    padLeft: parseFloat(cs.paddingLeft), padRight: parseFloat(cs.paddingRight) };
})())`

type Geo = {
  well: DOMRect; input: DOMRect; pre: DOMRect | null; suf: DOMRect | null; content: { left: number; right: number }
  wellOutline: string; inputOutline: string; inputBorder: string; inputBg: string; padLeft: number; padRight: number
}
async function geo(component: string, fixture: string, opts: Parameters<typeof open>[2] = {}, setup = ""): Promise<Geo> {
  const page = await open(component, fixture, opts)
  if (setup) await page.evaluate(setup)
  const g = JSON.parse((await page.evaluate(PROBE)) as string)
  await page.close()
  return g
}
const longValue = (v: string) =>
  `(function(){var i=document.querySelector("input");var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;set.call(i,${JSON.stringify(v)});i.dispatchEvent(new Event("input",{bubbles:true}));})()`

const CASES = [
  { id: "input/suffix", component: "input", fixture: "suffix" },
  { id: "input/prefix", component: "input", fixture: "prefix" },
  { id: "input/both", component: "input", fixture: "both" },
  { id: "number-input/prefix", component: "number-input", fixture: "prefix" },
  { id: "number-input/suffix", component: "number-input", fixture: "suffix" },
]

describe("VI-662 — affix layout (real browser)", () => {
  for (const { id, component, fixture } of CASES) {
    it(`${id}: affix sits inside the well and the value never sits under it, at any length`, { timeout: 60_000 }, async (ctx) => {
      if (!ready()) return ctx.skip()
      for (const value of ["", "1", LONG]) {
        const g = await geo(component, fixture, {}, value ? longValue(value) : "")
        for (const a of [g.pre, g.suf]) {
          if (!a) continue
          expect(a.left).toBeGreaterThanOrEqual(g.well.left)
          expect(a.right).toBeLessThanOrEqual(g.well.right + 0.01)
          expect(a.top).toBeGreaterThanOrEqual(g.well.top)
          expect(a.bottom).toBeLessThanOrEqual(g.well.bottom + 0.01)
        }
        if (g.pre) expect(g.content.left).toBeGreaterThanOrEqual(g.pre.right - 0.01)
        if (g.suf) expect(g.content.right).toBeLessThanOrEqual(g.suf.left + 0.01)
      }
    })
  }

  it("input: the input's content box moves with the affix width", { timeout: 60_000 }, async (ctx) => {
    if (!ready()) return ctx.skip()
    const wide = await geo("input", "prefix", {}, `document.querySelector('[data-slot="input-prefix"]').textContent = "EUR EUR EUR"`)
    const narrow = await geo("input", "prefix")
    expect(wide.content.left).toBeGreaterThan(narrow.content.left + 20)
    expect(wide.content.left).toBeGreaterThanOrEqual(wide.pre!.right - 0.01)
  })

  it("input: the gap is --input-affix-gap and the ink is --input-affix-color", { timeout: 60_000 }, async (ctx) => {
    if (!ready()) return ctx.skip()
    const g = await geo("input", "prefix", { scopeCss: "--input-affix-gap: 20px;" })
    expect(g.content.left - g.pre!.right).toBeCloseTo(20, 0)
    const page = await open("input", "prefix", { scopeCss: "--input-affix-color: rgb(1, 2, 3);" })
    const color = await page.evaluate(`getComputedStyle(document.querySelector('[data-slot="input-prefix"]')).color`)
    await page.close()
    expect(color).toBe("rgb(1, 2, 3)")
  })

  it("input: the well is exactly as tall as a plain input", { timeout: 60_000 }, async (ctx) => {
    if (!ready()) return ctx.skip()
    const plain = await geo("input", "default")
    for (const fixture of ["suffix", "prefix", "both"]) {
      expect((await geo("input", fixture)).well.height, fixture).toBeCloseTo(plain.well.height, 2)
    }
  })

  it("input: one edge on the well, none on the bare input, and --control-edge-width: 0 removes it", { timeout: 60_000 }, async (ctx) => {
    if (!ready()) return ctx.skip()
    const on = await geo("input", "suffix")
    expect(on.wellOutline).toBe("solid 1px")
    expect(on.inputOutline).toBe("none")
    expect(on.inputBg).toBe("rgba(0, 0, 0, 0)")
    const off = await geo("input", "suffix", { scopeCss: "--control-edge-width: 0;" })
    expect(off.wellOutline).toMatch(/ 0px$/)
  })

  it("focus ring: nothing moves between rest and focus, and the ring clears the text by more than the focus offset", { timeout: 60_000 }, async (ctx) => {
    if (!ready()) return ctx.skip()
    for (const [component, fixture] of [["input", "both"], ["input", "suffix"], ["number-input", "suffix"]]) {
      const rest = await geo(component, fixture)
      const focused = await geo(component, fixture, {}, `document.querySelector("input").focus()`)
      for (const k of ["well", "input", "pre", "suf"] as const) expect(focused[k], `${component}/${fixture} ${k}`).toEqual(rest[k])
      // the ring is drawn inside the well edge at 1px; text sits at least the focus offset (2px) inside it
      const ring = 1, offset = 2
      if (rest.pre) expect(rest.pre.left - rest.well.left - ring).toBeGreaterThan(offset)
      if (rest.suf) expect(rest.well.right - ring - rest.suf.right).toBeGreaterThan(offset)
      expect(rest.content.left - rest.well.left - ring).toBeGreaterThan(offset)
    }
  })

  it("input: focus and invalid still draw with the edges off", { timeout: 60_000 }, async (ctx) => {
    if (!ready()) return ctx.skip()
    const page = await open("input", "suffix", { scopeCss: "--control-edge-width: 0;" })
    await page.evaluate(`document.querySelector("input").focus()`)
    const focused = (await page.evaluate(`getComputedStyle(document.querySelector('[data-slot="input-wrapper"]')).outlineWidth`)) as string
    await page.close()
    expect(focused).toBe("1px")
  })

  // Mutation control: take the affix out of the layout (an absolutely
  // positioned affix with no padding adjustment is the classic bug) and the
  // value slides under it, so the overlap assertion above must fail.
  it("mutation control — removing the affix from the flow lets the value run under it", { timeout: 60_000 }, async (ctx) => {
    if (!ready()) return ctx.skip()
    const b = await bundle("input", "prefix")
    const mutated = b.css + `\n[data-slot="input-prefix"] { position: absolute !important; }\n[data-slot="input-wrapper"] { position: relative; }`
    const g = await geo("input", "prefix", { componentCss: mutated })
    expect(g.content.left).toBeLessThan(g.pre!.right - 0.01)
  })

  it("mutation control — removing the padding adjustment lets the value touch the affix", { timeout: 60_000 }, async (ctx) => {
    if (!ready()) return ctx.skip()
    const b = await bundle("input", "prefix")
    const mutated = b.css + `\n#root input { padding-left: 0 !important; }\n[data-slot="input-prefix"] { margin-right: -40px; }`
    const g = await geo("input", "prefix", { componentCss: mutated })
    expect(g.content.left).toBeLessThan(g.pre!.right - 0.01)
  })
})
