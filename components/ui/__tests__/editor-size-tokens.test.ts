// @vitest-environment node
/**
 * VI-663 — the sizes Blacklight's editor designs draw visibly differently,
 * proven in a real browser.
 *
 * Every new key in the Button, Input, Textarea, Select, TagInput, SaveStatus
 * and control families is checked twice on the computed style of the element
 * it drives (the Button weight and SaveStatus keys are set and mutated in
 * type-tokens.test.ts and save-status.test.ts, beside their families' other
 * hooks; here they are checked unset only):
 *
 *  - **Unset equals what shipped.** `unset` is the value 1.29.0 computes,
 *    measured on the component CSS before this change. An unbound theme must
 *    still compute it.
 *  - **Set equals the key.** Binding the one token on the theme scope moves
 *    the computed style to the bound value.
 *
 * Each case carries a mutation control: with the token renamed in the
 * component's CSS, binding it changes nothing, so the probe is proven to read
 * the hook and not something else.
 *
 * Skips where Chromium is unavailable (playwright is an optional dep).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { bundle, close, launch, open, ready, REST_EDGE } from "./render-page"

interface Case {
  token: string
  /** `component/fixture` from the `visor render` FIXTURES table. */
  fixture: string
  /** Selector under #root. */
  target: string
  prop: string
  value: string
  /** Bound computed value, when it differs from `value` as written. */
  expected?: string
  /** Substring the bound computed value must contain (box-shadow lists). */
  contains?: string
  /** The computed value 1.29.0 ships. Omitted for opt-in looks that did not exist. */
  unset?: string
  /** Set and mutation are proven in the family's own suite; check unset only. */
  unsetOnly?: boolean
}

const BUTTON_FIXTURES: Record<string, { fixture: string; weight: string }> = {
  sm: { fixture: "button/sm", weight: "500" },
  md: { fixture: "button/default", weight: "500" },
  lg: { fixture: "button/lg", weight: "500" },
  dlg: { fixture: "button/dlg", weight: "600" },
}

const TAG_FIELD = "[data-slot=tag-input]"
const TAG = "[data-slot=tag]"
const SLOT = "[data-slot=tag-input-slot]"

const CASES: Case[] = [
  // 1. Button weight: the set-and-mutation cases live with the other Button
  //    hooks in type-tokens.test.ts; here, only that unset is what shipped.
  ...Object.entries(BUTTON_FIXTURES).flatMap(([size, { fixture, weight }]) => [
    { token: "--button-font-weight", fixture, target: "button", prop: "font-weight", value: "300", unset: weight, unsetOnly: true },
    { token: `--button-${size}-font-weight`, fixture, target: "button", prop: "font-weight", value: "300", unset: weight, unsetOnly: true },
  ]),

  // 2. TagInput — the held tag
  { token: "--tag-input-tag-height", fixture: "tag-input/default", target: TAG, prop: "height", value: "29px", unset: "22px" },
  { token: "--tag-input-tag-padding-x", fixture: "tag-input/default", target: TAG, prop: "padding-left", value: "10px", unset: "8px" },
  { token: "--tag-input-tag-padding-x", fixture: "tag-input/default", target: TAG, prop: "padding-right", value: "10px", unset: "8px" },
  { token: "--tag-input-tag-font-size", fixture: "tag-input/default", target: TAG, prop: "font-size", value: "13px", unset: "12px" },
  { token: "--tag-input-tag-font-weight", fixture: "tag-input/default", target: TAG, prop: "font-weight", value: "300", unset: "400" },
  { token: "--tag-input-tag-radius", fixture: "tag-input/default", target: TAG, prop: "border-top-left-radius", value: "9px", unset: "9999px" },
  //    the field around the tags
  { token: "--tag-input-min-height", fixture: "tag-input/default", target: TAG_FIELD, prop: "min-height", value: "40px", unset: "36px" },
  { token: "--tag-input-padding", fixture: "tag-input/default", target: TAG_FIELD, prop: "padding-top", value: "5px", unset: "4px" },
  { token: "--tag-input-padding", fixture: "tag-input/default", target: TAG_FIELD, prop: "padding-left", value: "5px", unset: "8px" },
  { token: "--tag-input-radius", fixture: "tag-input/default", target: TAG_FIELD, prop: "border-top-left-radius", value: "9px", unset: "6px" },
  //    the typing slot (opt-in, entryAs="slot")
  { token: "--tag-input-slot-height", fixture: "tag-input/slot", target: SLOT, prop: "height", value: "29px" },
  { token: "--tag-input-slot-padding-x", fixture: "tag-input/slot", target: SLOT, prop: "padding-left", value: "10px" },
  { token: "--tag-input-slot-radius", fixture: "tag-input/slot", target: SLOT, prop: "border-top-left-radius", value: "9px" },
  { token: "--tag-input-slot-min-width", fixture: "tag-input/slot", target: SLOT, prop: "min-width", value: "88px" },
  { token: "--control-drop-edge-width", fixture: "tag-input/slot", target: SLOT, prop: "outline-width", value: "2px" },
  { token: "--control-drop-edge-style", fixture: "tag-input/slot", target: SLOT, prop: "outline-style", value: "dotted" },

  // 3. Textarea shape (the default md size)
  { token: "--textarea-padding", fixture: "textarea/default", target: "textarea", prop: "padding-top", value: "10px 12px", expected: "10px", unset: "14px" },
  { token: "--textarea-padding", fixture: "textarea/default", target: "textarea", prop: "padding-left", value: "10px 12px", expected: "12px", unset: "16px" },
  { token: "--textarea-radius", fixture: "textarea/default", target: "textarea", prop: "border-top-left-radius", value: "9px", unset: "4px" },

  // 4. Select trigger shape (the default md size)
  { token: "--select-height", fixture: "select/default", target: "button", prop: "height", value: "40px", unset: "50.9844px" },
  { token: "--select-padding", fixture: "select/default", target: "button", prop: "padding-top", value: "10px 12px", expected: "10px", unset: "14px" },
  { token: "--select-padding", fixture: "select/default", target: "button", prop: "padding-left", value: "10px 12px", expected: "12px", unset: "16px" },
  { token: "--select-radius", fixture: "select/default", target: "button", prop: "border-top-left-radius", value: "9px", unset: "4px" },

  // 5. SaveStatus: the set-and-mutation cases live in save-status.test.ts.
  { token: "--save-status-font-size", fixture: "save-status/default", target: "[data-slot=save-status]", prop: "font-size", value: "9px", unset: "12px", unsetOnly: true },
  { token: "--save-status-unsaved-dot-size", fixture: "save-status/unsaved-dot", target: "[data-slot=save-status-dot]", prop: "width", value: "6px", unset: "8px", unsetOnly: true },

  // 6. The refused-value look
  { token: "--control-invalid-ring-width", fixture: "input/invalid", target: "input", prop: "box-shadow", value: "1px", contains: "0px 0px 0px 1px inset" },
  { token: "--control-invalid-halo-width", fixture: "input/invalid", target: "input", prop: "box-shadow", value: "3px", contains: "0px 0px 0px 3px" },
  { token: "--control-invalid-ring-width", fixture: "textarea/invalid", target: "textarea", prop: "outline-width", value: "3px", unset: "1px" },
  { token: "--control-invalid-halo-width", fixture: "textarea/invalid", target: "textarea", prop: "box-shadow", value: "3px", contains: "0px 0px 0px 3px" },
  { token: "--control-invalid-ring-width", fixture: "select/invalid", target: "button", prop: "outline-width", value: "3px", unset: "1px" },
  { token: "--control-invalid-halo-width", fixture: "select/invalid", target: "button", prop: "box-shadow", value: "3px", contains: "0px 0px 0px 3px" },

  // Input md — the variables that existed but were not contract keys
  { token: "--input-md-height", fixture: "input/default", target: "input", prop: "height", value: "40px", unset: "50.9844px" },
  { token: "--input-md-padding", fixture: "input/default", target: "input", prop: "padding-left", value: "10px 12px", expected: "12px", unset: "16px" },
  { token: "--input-md-padding", fixture: "input/default", target: "input", prop: "padding-top", value: "10px 12px", expected: "10px" },
  { token: "--input-md-radius", fixture: "input/default", target: "input", prop: "border-top-left-radius", value: "9px", unset: "4px" },
]

async function read(c: Pick<Case, "fixture" | "target" | "prop">, opts: { scopeCss?: string; componentCss?: string } = {}): Promise<string> {
  const [component, fixture] = c.fixture.split("/")
  const page = await open(component, fixture, opts)
  const value = (await page.evaluate(
    `getComputedStyle(document.querySelector(${JSON.stringify(`#root ${c.target}`)})).getPropertyValue(${JSON.stringify(c.prop)})`,
  )) as string
  await page.close()
  return value
}

beforeAll(async () => {
  await launch()
}, 60_000)

afterAll(close)

describe("VI-663 — editor size hooks (real browser)", () => {
  for (const c of CASES) {
    const label = `${c.token} → ${c.fixture} ${c.prop}`

    if (c.unset !== undefined) {
      it(`${label}: unset, it computes what 1.29.0 ships (${c.unset})`, async (ctx) => {
        if (!ready()) return ctx.skip()
        expect(await read(c)).toBe(c.unset)
      }, 30_000)
    }

    if (c.unsetOnly) continue

    it(`${label}: set, it computes the key`, async (ctx) => {
      if (!ready()) return ctx.skip()
      const unset = await read(c)
      const bound = await read(c, { scopeCss: `${c.token}: ${c.value};` })
      if (c.contains) expect(bound).toContain(c.contains)
      else expect(bound).toBe(c.expected ?? c.value)
      expect(bound).not.toBe(unset)
    }, 30_000)

    it(`${label}: mutation control — renamed in the CSS, the binding changes nothing`, async (ctx) => {
      if (!ready()) return ctx.skip()
      const [component, fixture] = c.fixture.split("/")
      const css = (await bundle(component, fixture)).css
      const mutated = css.replace(new RegExp(`${c.token}(?![a-z0-9-])`, "g"), `${c.token}-mutated`)
      expect(mutated, `${c.fixture} CSS must read ${c.token}`).not.toBe(css)
      const unset = await read(c)
      const bound = await read(c, { scopeCss: `${c.token}: ${c.value};`, componentCss: mutated })
      expect(bound).toBe(unset)
    }, 30_000)
  }

  describe("the invalid look, unset, draws what 1.29.0 draws", () => {
    // The halo layer added to Input is 0px wide while unset, so it paints
    // nothing; the box-shadow list still names it. Read the full shadow list
    // and the ring both, so a fallback drift is caught.
    it("input/invalid keeps the 1.5px inset ring and no visible halo", async (ctx) => {
      if (!ready()) return ctx.skip()
      const shadow = await read({ fixture: "input/invalid", target: "input", prop: "box-shadow" })
      expect(shadow).toContain("0px 0px 0px 1.5px inset")
      expect(shadow.split(/,(?![^(]*\))/).filter((layer) => !layer.includes("inset"))).toEqual([expect.stringMatching(/ 0px 0px 0px 0px$/)])
    }, 30_000)

    for (const [fixture, target] of [["textarea/invalid", "textarea"], ["select/invalid", "button"]] as const) {
      it(`${fixture} keeps its 1px ring and 2px halo`, async (ctx) => {
        if (!ready()) return ctx.skip()
        expect(await read({ fixture, target, prop: "outline-width" })).toBe("1px")
        expect(await read({ fixture, target, prop: "box-shadow" })).toContain("0px 0px 0px 2px")
      }, 30_000)
    }
  })

  describe("edges (VI-655)", () => {
    it("the typing slot's dashed edge turns off with the one edge switch", async (ctx) => {
      if (!ready()) return ctx.skip()
      const page = await open("tag-input", "slot", { scopeCss: "--control-edge-width: 0;" })
      const widest = (await page.evaluate(REST_EDGE)) as number
      await page.close()
      expect(widest).toBe(0)
    }, 30_000)

    it("invalid stays visible with edges off", async (ctx) => {
      if (!ready()) return ctx.skip()
      for (const [fixture, target, prop] of [
        ["input/invalid", "input", "box-shadow"],
        ["textarea/invalid", "textarea", "outline-width"],
        ["select/invalid", "button", "outline-width"],
      ] as const) {
        const value = await read({ fixture, target, prop }, { scopeCss: "--control-edge-width: 0;" })
        if (prop === "box-shadow") expect(value).toContain("0px 0px 0px 1.5px inset")
        else expect(value).toBe("1px")
      }
    }, 30_000)
  })

  describe("SaveStatus status dot", () => {
    it("never reflows the row as the state changes", async (ctx) => {
      if (!ready()) return ctx.skip()
      const widths: number[] = []
      for (const fixture of ["dot", "dot-unsaved"]) {
        const page = await open("save-status", fixture, { scopeCss: "--save-status-dot-size: 5px; --save-status-unsaved-dot-size: 6px;" })
        widths.push((await page.evaluate(`document.querySelector("#root [data-slot=save-status]").getBoundingClientRect().width`)) as number)
        await page.close()
      }
      expect(widths[0]).toBe(widths[1])
    }, 30_000)
  })
})
