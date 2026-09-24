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
}

const LABEL = "[data-slot=field-label]"
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

  // button — one size at a time, then the unprefixed keys on every size
  ...Object.entries(BUTTON_FIXTURES).flatMap(([size, fixture]) => [
    ...TYPE.map((t) => ({ token: `--button-${size}-${t.key}`, fixture, target: "button", prop: t.prop, value: t.value })),
    { token: `--button-${size}-radius`, fixture, target: "button", prop: "border-top-left-radius", value: "13px" },
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
  // InlineEdit's pencil is the same mark (VI-658)
  { token: "--button-icon-size", fixture: "inline-edit/default", target: "[data-slot=inline-edit-pencil]", prop: "width", value: "20px" },
  { token: "--button-icon-size", fixture: "inline-edit/default", target: "[data-slot=inline-edit-pencil]", prop: "height", value: "20px" },
  { token: "--button-icon-ghost-color", fixture: "inline-edit/default", target: "[data-slot=inline-edit-pencil]", prop: "color", value: "rgb(255, 0, 170)" },

  // text — every size
  ...["xs", "sm", "md", "lg", "xl"].flatMap((size, i) =>
    TYPE.map((t) => ({ token: `--text-${size}-${t.key}`, fixture: "text/default", target: SIZE_TEXT(i + 1), prop: t.prop, value: t.value })),
  ),

  // switch
  { token: "--switch-track-width", fixture: "switch/default", target: "button", prop: "width", value: "40px" },
  { token: "--switch-track-height", fixture: "switch/default", target: "button", prop: "height", value: "24px" },
  // Knob inset alone sizes the knob from the shipped 1.15rem track: 18.4 - 2 × 3.
  { token: "--switch-knob-inset", fixture: "switch/default", target: "button > span", prop: "width", value: "3px", expectedPx: 12.4 },
  { token: "--switch-track-bg", fixture: "switch/default", target: "button", prop: "background-color", value: "rgb(1, 2, 3)" },
  { token: "--switch-edge-color", fixture: "switch/default", target: "button", prop: "outline-color", value: "rgb(1, 2, 3)" },
]

async function read(c: Case, opts: { scopeCss?: string; componentCss?: string } = {}): Promise<string> {
  const [component, fixture] = c.fixture.split("/")
  const page = await open(component, fixture, opts)
  if (c.density) await page.evaluate(`document.getElementById("theme-scope").setAttribute("data-density", ${JSON.stringify(c.density)})`)
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

describe("VI-656 — type, case and size hooks (real browser)", () => {
  for (const c of CASES) {
    const label = `${c.token} → ${c.fixture} ${c.prop}${c.density ? ` (${c.density})` : ""}`
    it(`${label}: binding the token moves the computed style`, async (ctx) => {
      if (!ready()) return ctx.skip()
      const unset = await read(c)
      const bound = await read(c, { scopeCss: `${c.token}: ${c.value};` })
      if (c.expectedPx !== undefined) expect(parseFloat(bound)).toBeCloseTo(c.expectedPx, 1)
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
