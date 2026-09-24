// @vitest-environment node
/**
 * VI-657 — SaveStatus in a real browser: a fixed-width slot that never
 * reflows its row, no edge in any state, and the save-status tokens.
 *
 * Skips where Chromium is unavailable (playwright is an optional dep).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { COMPONENT_TOKEN_FAMILY_BY_NAME, componentTokenName } from "../../../packages/theme-engine/src/component-tokens"
import { REST_EDGE, bundle, close, launch, open, pixelDelta, ready } from "./render-page"

const ROOT = "#root [data-slot=save-status]"
const STATES = ["default", "saving", "unsaved", "refused", "refused-retry"]

/** SaveStatus in a row with a sibling after it, the way an editor header uses it. */
const ROW = `#root { display: flex; align-items: center; gap: 8px; }
#root::after { content: "Next"; display: inline-block; }`

const geometry = `(function () {
  var el = document.querySelector(${JSON.stringify(ROOT)});
  var r = el.getBoundingClientRect();
  var after = getComputedStyle(document.getElementById("root"), "::after");
  var root = document.getElementById("root").getBoundingClientRect();
  return { width: r.width, height: r.height, left: r.left, rowWidth: root.width, afterContent: after.content };
})()`

const read = (prop: string) => `getComputedStyle(document.querySelector(${JSON.stringify(ROOT)})).getPropertyValue(${JSON.stringify(prop)})`

beforeAll(async () => {
  await launch()
}, 60_000)

afterAll(close)

describe("VI-657 — SaveStatus (real browser)", () => {
  describe("no reflow", () => {
    it("every state takes the same slot: width, height and position are identical", async (ctx) => {
      if (!ready()) return ctx.skip()
      const seen: Array<{ state: string; width: number; height: number; left: number }> = []
      for (const state of STATES) {
        const page = await open("save-status", state, { extraCss: ROW })
        const g = (await page.evaluate(geometry)) as { width: number; height: number; left: number }
        seen.push({ state, width: g.width, height: g.height, left: g.left })
        await page.close()
      }
      for (const s of seen) {
        expect({ ...s, state: undefined }, s.state).toEqual({ ...seen[0], state: undefined })
      }
      expect(seen[0].width).toBe(120) // 7.5rem
    }, 60_000)

    it("mutation control — a slot sized by its label DOES reflow", async (ctx) => {
      if (!ready()) return ctx.skip()
      const widths: number[] = []
      for (const state of ["default", "refused"]) {
        const page = await open("save-status", state, { extraCss: `${ROW} ${ROOT} { width: auto !important; }` })
        widths.push(((await page.evaluate(geometry)) as { width: number }).width)
        await page.close()
      }
      expect(widths[0]).not.toBe(widths[1])
    }, 60_000)

    // A label longer than the slot (a translation) must not paint past it.
    // Screenshot the strip just right of a 40px slot, then again with the
    // readout hidden: nothing outside the slot may differ.
    const outside = async (css: string) => {
      const page = await open("save-status", "refused", { scopeCss: "--save-status-width: 40px;", extraCss: css })
      const r = (await page.evaluate(`(function () {
        var r = document.querySelector(${JSON.stringify(ROOT)}).getBoundingClientRect();
        return { x: Math.ceil(r.right), y: Math.floor(r.top), h: Math.ceil(r.height) };
      })()`)) as { x: number; y: number; h: number }
      const clip = { x: r.x, y: r.y, width: 80, height: r.h }
      const shown = await page.screenshot({ clip })
      await page.addStyleTag({ content: `${ROOT} { visibility: hidden; }` })
      const hidden = await page.screenshot({ clip })
      await page.close()
      return pixelDelta(shown, hidden)
    }

    it("a label longer than the slot truncates inside it", async (ctx) => {
      if (!ready()) return ctx.skip()
      expect((await outside("")).n).toBe(0)
    }, 30_000)

    it("mutation control — a label left to overflow DOES paint past the slot", async (ctx) => {
      if (!ready()) return ctx.skip()
      expect((await outside(`${ROOT} > span { overflow: visible !important; }`)).n).toBeGreaterThan(0)
    }, 30_000)

    it("--save-status-width sets the slot, and it still holds across states", async (ctx) => {
      if (!ready()) return ctx.skip()
      const widths: number[] = []
      for (const state of STATES) {
        const page = await open("save-status", state, { scopeCss: "--save-status-width: 78px;" })
        widths.push(((await page.evaluate(geometry)) as { width: number }).width)
        await page.close()
      }
      expect(new Set(widths)).toEqual(new Set([78]))
    }, 60_000)
  })

  describe("no edge", () => {
    for (const state of STATES) {
      it(`${state}: no border, no outline, no box`, async (ctx) => {
        if (!ready()) return ctx.skip()
        const page = await open("save-status", state)
        expect(await page.evaluate(REST_EDGE)).toBe(0)
        const box = await page.evaluate(`(function () {
          var cs = getComputedStyle(document.querySelector(${JSON.stringify(ROOT)}));
          return [cs.backgroundColor, cs.boxShadow];
        })()`)
        await page.close()
        expect(box).toEqual(["rgba(0, 0, 0, 0)", "none"])
      }, 30_000)
    }

    it("mutation control — a readout drawn with a border IS caught", async (ctx) => {
      if (!ready()) return ctx.skip()
      const page = await open("save-status", "default", { extraCss: `${ROOT} { border: 1px solid rgb(255, 0, 0); }` })
      expect(await page.evaluate(REST_EDGE)).toBeGreaterThan(0)
      await page.close()
    }, 30_000)
  })

  describe("tokens", () => {
    const CASES: Array<{ token: string; prop: string; value: string; expected?: string }> = [
      { token: "--save-status-width", prop: "width", value: "78px" },
      { token: "--save-status-font-family", prop: "font-family", value: "monospace" },
      { token: "--save-status-text-transform", prop: "text-transform", value: "uppercase" },
      { token: "--save-status-letter-spacing", prop: "letter-spacing", value: "3px" },
    ]
    for (const c of CASES) {
      it(`${c.token}: binding it moves ${c.prop}`, async (ctx) => {
        if (!ready()) return ctx.skip()
        const unset = await open("save-status", "default")
        const before = await unset.evaluate(read(c.prop))
        await unset.close()
        const bound = await open("save-status", "default", { scopeCss: `${c.token}: ${c.value};` })
        const after = await bound.evaluate(read(c.prop))
        await bound.close()
        expect(after).toBe(c.expected ?? c.value)
        expect(after).not.toBe(before)
      }, 30_000)

      it(`${c.token}: mutation control — renamed in the CSS, the binding changes nothing`, async (ctx) => {
        if (!ready()) return ctx.skip()
        const css = (await bundle("save-status", "default")).css
        const mutated = css.replace(new RegExp(`${c.token}(?![a-z0-9-])`, "g"), `${c.token}-mutated`)
        expect(mutated).not.toBe(css)
        const unset = await open("save-status", "default")
        const before = await unset.evaluate(read(c.prop))
        await unset.close()
        const bound = await open("save-status", "default", { scopeCss: `${c.token}: ${c.value};`, componentCss: mutated })
        expect(await bound.evaluate(read(c.prop))).toBe(before)
        await bound.close()
      }, 30_000)
    }

    it("covers every token in the save-status family", () => {
      const family = COMPONENT_TOKEN_FAMILY_BY_NAME.get("save-status")!
      const tested = new Set(CASES.map((c) => c.token))
      expect(family.tokens.map((t) => `--${componentTokenName(family, t.key)}`).filter((t) => !tested.has(t))).toEqual([])
    })
  })

  describe("unset = absent: the readout inherits, and consumer rules win", () => {
    for (const [prop, value] of [["text-transform", "uppercase"], ["letter-spacing", "3px"], ["font-family", "monospace"]] as const) {
      it(`${prop}: inherited from the row while the token is unset`, async (ctx) => {
        if (!ready()) return ctx.skip()
        const page = await open("save-status", "default", { extraCss: `#root { ${prop}: ${value}; }` })
        expect(await page.evaluate(read(prop))).toBe(value)
        await page.close()
      }, 30_000)

      it(`${prop}: a layered consumer rule (a utility) wins while the token is unset`, async (ctx) => {
        if (!ready()) return ctx.skip()
        const page = await open("save-status", "default", { extraCss: `@layer utilities { ${ROOT} { ${prop}: ${value}; } }` })
        expect(await page.evaluate(read(prop))).toBe(value)
        await page.close()
      }, 30_000)

      it(`${prop}: mutation control — an unlayered inherit fallback would beat the utility`, async (ctx) => {
        if (!ready()) return ctx.skip()
        const page = await open("save-status", "default", {
          extraCss: `@layer utilities { ${ROOT} { ${prop}: ${value}; } } ${ROOT} { ${prop}: inherit; }`,
        })
        expect(await page.evaluate(read(prop))).not.toBe(value)
        await page.close()
      }, 30_000)
    }
  })
})
