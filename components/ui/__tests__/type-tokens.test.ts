// @vitest-environment node
/**
 * VI-656 — the Field label, Button, Text and Switch theme hooks, proven in a
 * real browser.
 *
 * For every hook in the `field`, `button`, `text` and `switch` families, this
 * suite sets that one token on the theme scope and asserts the computed style
 * of the element it drives moves to the bound value. Each case carries a
 * mutation control: with the token renamed in the component's CSS, binding it
 * changes nothing, so the probe is proven to read the hook and not something
 * else. That the hooks leave an unbound theme unchanged is the contract test's
 * job (component-token-contract.test.ts) plus `visor render` before and after.
 *
 * Skips where Chromium is unavailable (playwright is an optional dep).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { COMPONENT_TOKEN_FAMILY_BY_NAME, componentTokenName } from "../../../packages/theme-engine/src/component-tokens"
import { bundle, close, launch, open, ready } from "./render-page"

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
  /** Bound computed value in px, compared to 1 decimal (layout rounds to 1/64 px). */
  expectedPx?: number
  density?: "editorial"
  /** Hover the target before reading (the hover-only hooks). */
  hover?: boolean
  /** Hold the mouse down on the target before reading (the :active hooks). */
  press?: boolean
  /** Keep transitions on, so `transition-*` reads the bound value. */
  motion?: boolean
  /** Read a pseudo-element of the target (`::after`, the edged faces' ring). */
  pseudo?: string
  /** Focus this selector under #root before reading (the focus-ring hooks). */
  focus?: string
  /** The bound value need only contain this (a box-shadow with an unbound part). */
  contains?: string
}

const LABEL = "[data-slot=field-label]"
const OPTIONAL = "[data-slot=field-label-optional]"
const HINT = "[data-slot=field-description]"
const ERROR = "[data-slot=field-error]"
const BOX = "[data-slot=field-control]"
const SIZE_TEXT = (i: number) => `[data-slot=text] > [data-slot=text]:nth-child(${i})`

const TYPE = [
  { key: "font-size", prop: "font-size", value: "21px" },
  { key: "text-transform", prop: "text-transform", value: "uppercase" },
  { key: "letter-spacing", prop: "letter-spacing", value: "3px" },
]

const BUTTON_FIXTURES: Record<string, string> = { sm: "button/sm", md: "button/default", lg: "button/lg", dlg: "button/dlg" }

const CASES: Case[] = [
  // field
  { token: "--field-label-font-size", fixture: "field/default", target: LABEL, prop: "font-size", value: "21px" },
  { token: "--field-label-font-size", fixture: "field/editorial", target: LABEL, prop: "font-size", value: "21px" },
  { token: "--field-label-text-transform", fixture: "field/default", target: LABEL, prop: "text-transform", value: "uppercase" },
  { token: "--field-label-letter-spacing", fixture: "field/default", target: LABEL, prop: "letter-spacing", value: "3px" },
  { token: "--field-label-color", fixture: "field/default", target: LABEL, prop: "color", value: "rgb(255, 0, 170)" },
  { token: "--field-label-color", fixture: "field/editorial", target: LABEL, prop: "color", value: "rgb(255, 0, 170)" },
  // VI-805: the label's weight and optional mark, the hint, the error line and the control box.
  { token: "--field-gap", fixture: "field/default", target: "[data-slot=field]", prop: "row-gap", value: "23px" },
  { token: "--field-text-inset", fixture: "field/default", target: LABEL, prop: "padding-left", value: "7px" },
  { token: "--field-label-font-weight", fixture: "field/default", target: LABEL, prop: "font-weight", value: "800" },
  { token: "--field-label-line-height", fixture: "field/default", target: LABEL, prop: "line-height", value: "41px" },
  { token: "--field-label-optional-color", fixture: "field/control", target: OPTIONAL, prop: "color", value: "rgb(1, 2, 3)" },
  { token: "--field-label-optional-font-weight", fixture: "field/control", target: OPTIONAL, prop: "font-weight", value: "900" },
  { token: "--field-description-font-size", fixture: "field/default", target: HINT, prop: "font-size", value: "19px" },
  { token: "--field-description-font-size", fixture: "field/editorial", target: HINT, prop: "font-size", value: "19px" },
  { token: "--field-description-color", fixture: "field/default", target: HINT, prop: "color", value: "rgb(1, 2, 3)" },
  { token: "--field-description-color", fixture: "field/editorial", target: HINT, prop: "color", value: "rgb(1, 2, 3)" },
  { token: "--field-description-line-height", fixture: "field/default", target: HINT, prop: "line-height", value: "31px" },
  { token: "--field-error-color", fixture: "field/control", target: ERROR, prop: "color", value: "rgb(1, 2, 3)" },
  { token: "--field-error-font-weight", fixture: "field/control", target: ERROR, prop: "font-weight", value: "800" },
  { token: "--field-error-line-height", fixture: "field/control", target: ERROR, prop: "line-height", value: "29px" },
  { token: "--field-error-icon-gap", fixture: "field/control", target: ERROR, prop: "column-gap", value: "17px" },
  { token: "--field-error-icon-size", fixture: "field/control", target: "[data-slot=field-error-icon] > svg", prop: "width", value: "27px" },
  { token: "--field-error-icon-size", fixture: "field/control", target: "[data-slot=field-error-icon] > svg", prop: "height", value: "27px" },
  { token: "--field-error-fill", fixture: "field/invalid", target: BOX, prop: "background-color", value: "rgb(1, 2, 3)" },
  { token: "--field-error-line", fixture: "field/invalid", target: BOX, prop: "box-shadow", value: "rgb(1, 2, 3)", contains: "rgb(1, 2, 3) 0px 0px 0px" },
  { token: "--field-error-line-width", fixture: "field/invalid", target: BOX, prop: "box-shadow", value: "5px", contains: " 0px 0px 0px 5px inset" },
  { token: "--field-control-height", fixture: "field/control", target: BOX, prop: "height", value: "71px" },
  { token: "--field-control-radius", fixture: "field/control", target: BOX, prop: "border-top-left-radius", value: "19px" },
  { token: "--field-control-fill", fixture: "field/control", target: BOX, prop: "background-color", value: "rgb(1, 2, 3)" },
  { token: "--field-control-fill-hover", fixture: "field/control", target: BOX, prop: "background-color", value: "rgb(1, 2, 3)", hover: true },
  { token: "--field-control-focus-ring-color", fixture: "field/control", target: BOX, prop: "box-shadow", value: "rgb(1, 2, 3)", focus: "input", contains: "rgb(1, 2, 3) 0px 0px 0px" },
  { token: "--field-control-focus-ring-width", fixture: "field/control", target: BOX, prop: "box-shadow", value: "6px", focus: "input", contains: " 0px 0px 0px 6px inset" },
  { token: "--field-control-padding-x", fixture: "field/control", target: `${BOX} input`, prop: "padding-left", value: "33px" },
  { token: "--field-control-font-size", fixture: "field/control", target: `${BOX} input`, prop: "font-size", value: "23px" },
  { token: "--field-control-font-weight", fixture: "field/control", target: `${BOX} input`, prop: "font-weight", value: "700" },
  { token: "--field-control-letter-spacing", fixture: "field/control", target: `${BOX} input`, prop: "letter-spacing", value: "3px" },
  { token: "--field-control-placeholder-color", fixture: "field/select", target: "[data-slot=select-trigger]", prop: "color", value: "rgb(1, 2, 3)" },
  { token: "--field-control-tall-min-height", fixture: "field/tall", target: "textarea", prop: "min-height", value: "211px" },
  { token: "--field-control-tall-max-height", fixture: "field/tall", target: "textarea", prop: "max-height", value: "301px" },
  { token: "--field-control-tall-padding-y", fixture: "field/tall", target: "textarea", prop: "padding-top", value: "27px" },

  // button — one size at a time, then the unprefixed keys on every size
  ...Object.entries(BUTTON_FIXTURES).flatMap(([size, fixture]) => [
    ...TYPE.map((t) => ({ token: `--button-${size}-${t.key}`, fixture, target: "button", prop: t.prop, value: t.value })),
    { token: `--button-${size}-radius`, fixture, target: "button", prop: "border-top-left-radius", value: "13px" },
    // VI-663: weight (the editor's dlg pill draws at 300)
    { token: `--button-${size}-font-weight`, fixture, target: "button", prop: "font-weight", value: "300" },
    { token: "--button-font-weight", fixture, target: "button", prop: "font-weight", value: "300" },
    { token: "--button-text-transform", fixture, target: "button", prop: "text-transform", value: "uppercase" },
    { token: "--button-letter-spacing", fixture, target: "button", prop: "letter-spacing", value: "3px" },
    { token: "--button-radius", fixture, target: "button", prop: "border-top-left-radius", value: "13px" },
  ]),
  { token: "--button-sm-font-size", fixture: "button/sm", target: "button", prop: "font-size", value: "21px", density: "editorial" as const },

  // button — icon-only (VI-659): the box is the glyph plus the pad on each side
  { token: "--button-icon-size", fixture: "button/icon", target: "button", prop: "width", value: "20px", expected: "36px" },
  { token: "--button-icon-size", fixture: "button/icon", target: "button > svg", prop: "width", value: "20px" },
  { token: "--button-icon-pad", fixture: "button/icon", target: "button", prop: "height", value: "4px", expected: "24px" },
  { token: "--button-icon-radius", fixture: "button/icon", target: "button", prop: "border-top-left-radius", value: "13px" },
  { token: "--button-radius", fixture: "button/icon", target: "button", prop: "border-top-left-radius", value: "13px" },
  { token: "--button-icon-ghost-color", fixture: "button/icon", target: "button", prop: "color", value: "rgb(255, 0, 170)" },
  // fill and ink per variant, ghost ink and padding (VI-699)
  { token: "--button-default-bg", fixture: "button/default", target: "button", prop: "background-color", value: "rgb(1, 2, 3)" },
  { token: "--button-default-bg-hover", fixture: "button/default", target: "button", prop: "background-color", value: "rgb(1, 2, 3)", hover: true },
  { token: "--button-default-text", fixture: "button/default", target: "button", prop: "color", value: "rgb(4, 5, 6)" },
  { token: "--button-dlg-destructive-bg", fixture: "button/dlg-destructive", target: "button", prop: "background-color", value: "rgb(1, 2, 3)" },
  { token: "--button-dlg-destructive-bg-hover", fixture: "button/dlg-destructive", target: "button", prop: "background-color", value: "rgb(1, 2, 3)", hover: true },
  { token: "--button-dlg-destructive-text", fixture: "button/dlg-destructive", target: "button", prop: "color", value: "rgb(4, 5, 6)" },
  { token: "--button-hero-bg", fixture: "button/hero", target: "button", prop: "background-color", value: "rgb(1, 2, 3)" },
  { token: "--button-hero-bg-hover", fixture: "button/hero", target: "button", prop: "background-color", value: "rgb(1, 2, 3)", hover: true },
  { token: "--button-hero-text", fixture: "button/hero", target: "button", prop: "color", value: "rgb(4, 5, 6)" },
  { token: "--button-ghost-text", fixture: "button/dlg-ghost", target: "button", prop: "color", value: "rgb(4, 5, 6)" },
  { token: "--button-ghost-text-hover", fixture: "button/dlg-ghost", target: "button", prop: "color", value: "rgb(4, 5, 6)", hover: true },
  { token: "--button-md-height", fixture: "button/default", target: "button", prop: "height", value: "50px" },
  { token: "--button-md-padding", fixture: "button/default", target: "button", prop: "padding-left", value: "20px" },
  { token: "--button-dlg-padding", fixture: "button/dlg", target: "button", prop: "padding-left", value: "11px" },
  // pill hooks (VI-807): lg box, lifted default face, outline face, grow, press and timing
  { token: "--button-lg-height", fixture: "button/lg", target: "button", prop: "height", value: "60px" },
  { token: "--button-lg-padding", fixture: "button/lg", target: "button", prop: "padding-left", value: "20px" },
  { token: "--button-default-shadow", fixture: "button/default", target: "button", prop: "box-shadow", value: "rgb(1, 2, 3) 0px 4px 8px 0px" },
  { token: "--button-default-shadow-hover", fixture: "button/default", target: "button", prop: "box-shadow", value: "rgb(4, 5, 6) 0px 2px 3px 0px", hover: true },
  { token: "--button-outline-text", fixture: "button/outline", target: "button", prop: "color", value: "rgb(4, 5, 6)" },
  { token: "--button-outline-bg-hover", fixture: "button/outline", target: "button", prop: "background-color", value: "rgb(1, 2, 3)", hover: true },
  // outline-only face (VI-824): resting fill, padding and weight over the size's, and the ring
  { token: "--button-outline-bg", fixture: "button/outline", target: "button", prop: "background-color", value: "rgb(1, 2, 3)" },
  { token: "--button-outline-padding", fixture: "button/lg-outline", target: "button", prop: "padding-left", value: "0 26px", expected: "26px" },
  { token: "--button-outline-font-weight", fixture: "button/lg-outline", target: "button", prop: "font-weight", value: "520" },
  { token: "--button-outline-ring-color", fixture: "button/outline", target: "button", prop: "outline-color", value: "rgb(1, 2, 3)", pseudo: "::after" },
  { token: "--button-outline-backdrop-filter", fixture: "button/outline", target: "button", prop: "backdrop-filter", value: "blur(24px)" },
  { token: "--button-hover-scale", fixture: "button/default", target: "button", prop: "scale", value: "1.5", hover: true },
  { token: "--button-press-scale", fixture: "button/default", target: "button", prop: "scale", value: "0.5", press: true },
  { token: "--button-press-transform", fixture: "button/default", target: "button", prop: "transform", value: "translateY(5px)", expected: "matrix(1, 0, 0, 1, 0, 5)", press: true },
  { token: "--button-press-duration", fixture: "button/default", target: "button", prop: "transition-duration", value: "0.2s", press: true, motion: true },
  // one value per transitioned property: background-color, color, opacity, transform, scale, box-shadow
  { token: "--button-motion-duration", fixture: "button/default", target: "button", prop: "transition-duration", value: "0.4s", expected: Array(6).fill("0.4s").join(", "), motion: true },
  { token: "--button-motion-easing", fixture: "button/default", target: "button", prop: "transition-timing-function", value: "linear", expected: Array(6).fill("linear").join(", "), motion: true },
  // icon gap (VI-733); the compact destructive face is in button-vi733.test.ts
  { token: "--button-icon-gap", fixture: "button/icon-label", target: "button", prop: "column-gap", value: "6px" },
  // InlineEdit's pencil is the same mark (VI-658)
  { token: "--button-icon-size", fixture: "inline-edit/default", target: "[data-slot=inline-edit-pencil]", prop: "width", value: "20px" },
  { token: "--button-icon-size", fixture: "inline-edit/default", target: "[data-slot=inline-edit-pencil]", prop: "height", value: "20px" },
  { token: "--button-icon-ghost-color", fixture: "inline-edit/default", target: "[data-slot=inline-edit-pencil]", prop: "color", value: "rgb(255, 0, 170)" },

  // text — every size
  ...["xs", "sm", "md", "lg", "xl"].flatMap((size, i) =>
    TYPE.map((t) => ({ token: `--text-${size}-${t.key}`, fixture: "text/default", target: SIZE_TEXT(i + 1), prop: t.prop, value: t.value })),
  ),

  // text — the eyebrow (VI-801)
  { token: "--text-eyebrow-font-size", fixture: "text/eyebrow", target: "[data-slot=text]", prop: "font-size", value: "21px" },
  { token: "--text-eyebrow-text-transform", fixture: "text/eyebrow", target: "[data-slot=text]", prop: "text-transform", value: "lowercase" },
  { token: "--text-eyebrow-letter-spacing", fixture: "text/eyebrow", target: "[data-slot=text]", prop: "letter-spacing", value: "3px" },
  { token: "--text-eyebrow-font-weight", fixture: "text/eyebrow", target: "[data-slot=text]", prop: "font-weight", value: "680" },
  { token: "--text-eyebrow-color", fixture: "text/eyebrow", target: "[data-slot=text]", prop: "color", value: "rgb(255, 0, 170)" },
  { token: "--text-eyebrow-gap", fixture: "text/eyebrow", target: "[data-slot=text]", prop: "column-gap", value: "17px" },

  // switch
  { token: "--switch-track-width", fixture: "switch/default", target: "button", prop: "width", value: "40px" },
  { token: "--switch-track-height", fixture: "switch/default", target: "button", prop: "height", value: "24px" },
  // Knob inset alone sizes the knob from the shipped 1.15rem track: 18.4 - 2 × 3.
  { token: "--switch-knob-inset", fixture: "switch/default", target: "button > span", prop: "width", value: "3px", expectedPx: 12.4 },
  { token: "--switch-track-bg", fixture: "switch/default", target: "button", prop: "background-color", value: "rgb(1, 2, 3)" },
  { token: "--switch-edge-color", fixture: "switch/default", target: "button", prop: "outline-color", value: "rgb(1, 2, 3)" },
  // VI-693: knob and hover colours. Unset-equals-1.34.0 and the blacklight-app
  // contrast proof live in switch-color-tokens.test.ts.
  { token: "--switch-knob-bg", fixture: "switch/default", target: "button > span", prop: "background-color", value: "rgb(1, 2, 3)" },
  { token: "--switch-knob-bg-checked", fixture: "switch/checked", target: "button > span", prop: "background-color", value: "rgb(1, 2, 3)" },
  { token: "--switch-track-hover-bg", fixture: "switch/default", target: "button", prop: "background-color", value: "rgb(1, 2, 3)", hover: true },
  { token: "--switch-track-hover-bg-checked", fixture: "switch/checked", target: "button", prop: "background-color", value: "rgb(1, 2, 3)", hover: true },
]

async function read(c: Case, opts: { scopeCss?: string; componentCss?: string } = {}): Promise<string> {
  const [component, fixture] = c.fixture.split("/")
  const page = await open(component, fixture, { ...opts, motion: c.motion ? "no-preference" : undefined })
  if (c.density) await page.evaluate(`document.getElementById("theme-scope").setAttribute("data-density", ${JSON.stringify(c.density)})`)
  if (c.hover || c.press) await page.hover(`#root ${c.target}`)
  if (c.press) await page.mouse.down()
  if (c.focus) await page.evaluate(`document.querySelector(${JSON.stringify(`#root ${c.focus}`)}).focus()`)
  const value = (await page.evaluate(
    `getComputedStyle(document.querySelector(${JSON.stringify(`#root ${c.target}`)}), ${JSON.stringify(c.pseudo ?? null)}).getPropertyValue(${JSON.stringify(c.prop)})`,
  )) as string
  await page.close()
  return value
}

beforeAll(async () => {
  await launch()
}, 60_000)

afterAll(close)

describe("VI-656 — type, case and size hooks (real browser)", () => {
  for (const c of CASES) {
    const label = `${c.token} → ${c.fixture} ${c.prop}${c.density ? ` (${c.density})` : ""}`
    it(`${label}: binding the token moves the computed style`, async (ctx) => {
      if (!ready()) return ctx.skip()
      const unset = await read(c)
      const bound = await read(c, { scopeCss: `${c.token}: ${c.value};` })
      if (c.contains !== undefined) expect(bound).toContain(c.contains)
      else if (c.expectedPx !== undefined) expect(parseFloat(bound)).toBeCloseTo(c.expectedPx, 1)
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

  describe("Text color=\"warning\"", () => {
    const WARNING = { fixture: "text/colors", target: SIZE_TEXT(4), prop: "color" }

    it("resolves to the theme's --text-warning", async (ctx) => {
      if (!ready()) return ctx.skip()
      const page = await open("text", "colors")
      const [color, warning, primary] = (await page.evaluate(`(function () {
        var probe = document.createElement("span");
        probe.style.color = "var(--text-warning)";
        document.getElementById("root").appendChild(probe);
        return [
          getComputedStyle(document.querySelector(${JSON.stringify(`#root ${WARNING.target}`)})).color,
          getComputedStyle(probe).color,
          getComputedStyle(document.querySelector(${JSON.stringify(`#root ${SIZE_TEXT(1)}`)})).color,
        ];
      })()`)) as [string, string, string]
      await page.close()
      expect(color).toBe(warning)
      expect(color).not.toBe(primary)
    }, 30_000)

    it("follows a rebound --text-warning", async (ctx) => {
      if (!ready()) return ctx.skip()
      const c: Case = { token: "--text-warning", ...WARNING, value: "rgb(1, 2, 3)" }
      expect(await read(c, { scopeCss: "--text-warning: rgb(1, 2, 3);" })).toBe("rgb(1, 2, 3)")

      // Mutation control: with the warning class pointed at a literal, the
      // rebind no longer reaches it.
      const css = (await bundle("text", "colors")).css
      const mutated = css.replace("var(--text-warning, #b45309)", "#b45309")
      expect(mutated).not.toBe(css)
      expect(await read(c, { scopeCss: "--text-warning: rgb(1, 2, 3);", componentCss: mutated })).not.toBe("rgb(1, 2, 3)")
    }, 30_000)
  })

  describe("switch knob inset", () => {
    // The design: a 30×17 track with the knob 3px from the track's outer edge
    // on every side, unchecked and checked.
    const SCOPE = "--switch-track-width: 30px; --switch-track-height: 17px; --switch-knob-inset: 3px;"
    const GAPS = `(function () {
      var t = document.querySelector("#root button").getBoundingClientRect();
      var k = document.querySelector("#root button > span").getBoundingClientRect();
      return [k.left - t.left, t.right - k.right, k.top - t.top, t.bottom - k.bottom, k.width, k.height];
    })()`

    for (const [fixture, side] of [["default", 0], ["checked", 1]] as const) {
      it(`${fixture}: the knob sits 3px inside the track's outer edge`, async (ctx) => {
        if (!ready()) return ctx.skip()
        const page = await open("switch", fixture, { scopeCss: SCOPE })
        const [left, right, top, bottom, width, height] = (await page.evaluate(GAPS)) as number[]
        await page.close()
        expect([width, height]).toEqual([11, 11])
        expect(top).toBeCloseTo(3, 2)
        expect(bottom).toBeCloseTo(3, 2)
        expect(side === 0 ? left : right).toBeCloseTo(3, 2)
      }, 30_000)
    }

    it("track width alone keeps the checked knob where it sat against the right edge", async (ctx) => {
      if (!ready()) return ctx.skip()
      const rightGap = async (scopeCss: string) => {
        const page = await open("switch", "checked", { scopeCss })
        const gaps = (await page.evaluate(GAPS)) as number[]
        await page.close()
        return gaps[1]
      }
      // Without knob-inset the knob keeps its shipped placement, whatever the
      // track's inline padding makes it; a wider track moves it with the edge.
      expect(await rightGap("--switch-track-width: 48px;")).toBeCloseTo(await rightGap(""), 2)
    }, 30_000)
  })
})

// With a hook unset, the component must leave the property exactly as it would
// be without the declaration: every consumer rule, layered or not, earlier or
// later, still decides it. That is why the case, tracking and knob-padding
// declarations live in @layer visor-base.
describe("VI-656 — consumer rules still win while a hook is unset (real browser)", () => {
  const TARGETS = [
    { fixture: "text/default", target: SIZE_TEXT(2), prop: "text-transform", value: "uppercase" },
    { fixture: "text/default", target: SIZE_TEXT(2), prop: "letter-spacing", value: "3px" },
    { fixture: "field/default", target: LABEL, prop: "text-transform", value: "uppercase" },
    { fixture: "button/default", target: "button", prop: "letter-spacing", value: "3px" },
    { fixture: "button/dlg", target: "button", prop: "text-transform", value: "uppercase" },
  ]
  const readProp = async (fixture: string, target: string, prop: string, opts: { componentCss?: string; extraCss?: string }) => {
    const [component, name] = fixture.split("/")
    const page = await open(component, name, opts)
    const value = (await page.evaluate(
      `getComputedStyle(document.querySelector(${JSON.stringify(`#root ${target}`)})).getPropertyValue(${JSON.stringify(prop)})`,
    )) as string
    await page.close()
    return value
  }
  // The pre-fix shapes: an unlayered declaration that shadows consumer rules.
  const unlayered = (target: string, prop: string, fallback: string) =>
    `#root ${target} { ${prop}: var(--vi656-unset, ${fallback}); }`

  for (const t of TARGETS) {
    const [component, fixture] = t.fixture.split("/")
    const rule = `#root ${t.target} { ${t.prop}: ${t.value}; }`

    it(`${t.fixture} ${t.prop}: an unlayered consumer rule loaded BEFORE the component wins`, async (ctx) => {
      if (!ready()) return ctx.skip()
      const css = (await bundle(component, fixture)).css
      expect(await readProp(t.fixture, t.target, t.prop, { componentCss: `${rule}\n${css}` })).toBe(t.value)
      // Mutation control: an unlayered revert-layer declaration drops it.
      expect(
        await readProp(t.fixture, t.target, t.prop, { componentCss: `${rule}\n${css}`, extraCss: unlayered(t.target, t.prop, "revert-layer") }),
      ).not.toBe(t.value)
    }, 30_000)

    it(`${t.fixture} ${t.prop}: a layered utility wins`, async (ctx) => {
      if (!ready()) return ctx.skip()
      const utility = `@layer utilities { ${rule} }`
      expect(await readProp(t.fixture, t.target, t.prop, { extraCss: utility })).toBe(t.value)
      // Mutation control: an unlayered `inherit` declaration beats the layer.
      expect(await readProp(t.fixture, t.target, t.prop, { extraCss: `${utility}\n${unlayered(t.target, t.prop, "inherit")}` })).not.toBe(t.value)
    }, 30_000)
  }

  it("switch: an unlayered `button { padding: 0 }` reset still zeroes the track while knob-inset is unset", async (ctx) => {
    if (!ready()) return ctx.skip()
    const css = (await bundle("switch", "default")).css
    const preflight = "button { padding: 0; }"
    expect(await readProp("switch/default", "button", "padding-left", { componentCss: `${preflight}\n${css}` })).toBe("0px")
    // Mutation control: an unlayered revert-layer declaration brings the
    // browser's button padding back.
    expect(
      await readProp("switch/default", "button", "padding-left", {
        componentCss: `${preflight}\n${css}`,
        extraCss: unlayered("button", "padding-inline", "revert-layer"),
      }),
    ).not.toBe("0px")
  }, 30_000)
})

describe("VI-824 — the kit's outline squircle button", () => {
  // honcho-backstage binds the kit's lg pill for every variant; the outline
  // keys must win over it on the outline face alone.
  const KIT = [
    "--button-lg-padding: 0 24px 0 30px;",
    "--button-font-weight: 620;",
    "--button-outline-padding: 0 26px;",
    "--button-outline-font-weight: 520;",
    "--button-outline-ring-color: rgba(11, 11, 12, 0.24);",
  ].join(" ")
  const PROBE = `(function () {
    var b = document.querySelector("#root button");
    var s = getComputedStyle(b);
    return [s.paddingLeft, s.paddingRight, s.fontWeight, getComputedStyle(b, "::after").outlineColor];
  })()`

  async function probe(fixture: string, scopeCss?: string): Promise<string[]> {
    const page = await open("button", fixture, { scopeCss })
    const out = (await page.evaluate(PROBE)) as string[]
    await page.close()
    return out
  }

  it("binds 0 26px / 520 / ink-24 on the outline face", async (ctx) => {
    if (!ready()) return ctx.skip()
    expect(await probe("lg-outline", KIT)).toEqual(["26px", "26px", "520", "rgba(11, 11, 12, 0.24)"])
  }, 30_000)

  it("leaves the default face on the family's lg padding and weight", async (ctx) => {
    if (!ready()) return ctx.skip()
    const [left, right, weight] = await probe("lg", KIT)
    expect([left, right, weight]).toEqual(["30px", "24px", "620"])
  }, 30_000)

  it("unbound, the outline keeps its size's padding, weight and ring", async (ctx) => {
    if (!ready()) return ctx.skip()
    const [left, right, weight, ring] = await probe("lg-outline")
    const [, , , edge] = await probe("lg-outline", "--button-outline-ring-color: var(--control-edge-color, var(--border-strong, #e5e7eb));")
    expect([left, right, weight]).toEqual(["24px", "24px", "500"])
    expect(ring).toBe(edge)
  }, 30_000)
})

describe("VI-656 coverage", () => {
  it("exercises every token in the field, button, text and switch families", () => {
    const exercised = new Set(CASES.map((c) => c.token))
    const missing: string[] = []
    for (const name of ["field", "button", "text", "switch"]) {
      const family = COMPONENT_TOKEN_FAMILY_BY_NAME.get(name)!
      for (const t of family.tokens) {
        const token = `--${componentTokenName(family, t.key)}`
        if (!exercised.has(token)) missing.push(token)
      }
    }
    expect(missing).toEqual([])
  })
})
