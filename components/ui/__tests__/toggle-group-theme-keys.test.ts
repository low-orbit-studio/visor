// @vitest-environment node
/**
 * VI-709 — the `toggle-group` theme keys, proven in a real browser.
 *
 *  - **Unset equals what shipped.** `unset` is what 1.37.0 computes on the
 *    neutral light theme; an unbound theme must still compute it.
 *  - **Set equals the key.** Binding the token on the theme scope moves the
 *    computed style to the bound value.
 *
 * Then the reason the keys exist: Blacklight's picked compact group, bound
 * through the engine on the blacklight-app theme with no tokens on the group.
 *
 * Skips where Chromium is unavailable (playwright is an optional dep).
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { parse, stringify } from "yaml"
import { generateThemeData } from "../../../packages/theme-engine/src/pipeline"
import { docsAdapter } from "../../../packages/theme-engine/src/adapters/docs"
import { close, launch, open, ready } from "./render-page"

const GROUP = "#root [data-slot=toggle-group]"
const INDICATOR = `${GROUP} > [aria-hidden="true"]`
const ON = "#root [data-slot=toggle-group-item][data-state=on]"
const OFF = "#root [data-slot=toggle-group-item][data-state=off]"

interface Case {
  token: string
  fixture: "default" | "outline" | "compact"
  target: string
  prop: string
  value: string
  expected: string
  /** What 1.37.0 computes on neutral light. */
  unset: string
}

const CASES: Case[] = [
  { token: "--toggle-group-track-bg", fixture: "outline", target: GROUP, prop: "backgroundColor", value: "#112233", expected: "rgb(17, 34, 51)", unset: "rgba(0, 0, 0, 0)" },
  { token: "--toggle-group-selected-bg", fixture: "outline", target: INDICATOR, prop: "backgroundColor", value: "#33ccaa", expected: "rgb(51, 204, 170)", unset: "UNSET_PRIMARY" },
  { token: "--toggle-group-selected-bg", fixture: "default", target: ON, prop: "backgroundColor", value: "#33ccaa", expected: "rgb(51, 204, 170)", unset: "UNSET_PRIMARY" },
  { token: "--toggle-group-selected-text", fixture: "outline", target: ON, prop: "color", value: "#aa33cc", expected: "rgb(170, 51, 204)", unset: "UNSET_PRIMARY_TEXT" },
  { token: "--toggle-group-selected-text", fixture: "default", target: ON, prop: "color", value: "#aa33cc", expected: "rgb(170, 51, 204)", unset: "UNSET_PRIMARY_TEXT" },
  { token: "--toggle-group-unselected-text", fixture: "outline", target: OFF, prop: "color", value: "#ff8800", expected: "rgb(255, 136, 0)", unset: "UNSET_TEXT" },
  { token: "--toggle-group-xs-font-size", fixture: "compact", target: ON, prop: "fontSize", value: "10px", expected: "10px", unset: "12px" },
  { token: "--toggle-group-xs-padding-x", fixture: "compact", target: ON, prop: "paddingLeft", value: "11px", expected: "11px", unset: "8px" },
  { token: "--toggle-group-xs-track-radius", fixture: "compact", target: GROUP, prop: "borderTopLeftRadius", value: "8px", expected: "8px", unset: "6px" },
  { token: "--toggle-group-xs-item-radius", fixture: "compact", target: ON, prop: "borderTopLeftRadius", value: "6px", expected: "6px", unset: "4px" },
  { token: "--toggle-group-xs-item-radius", fixture: "compact", target: INDICATOR, prop: "borderTopLeftRadius", value: "6px", expected: "6px", unset: "4px" },
]

const style = (selector: string, prop: string) =>
  `getComputedStyle(document.querySelector(${JSON.stringify(selector)}))[${JSON.stringify(prop)}]`

async function read(fixture: string, selector: string, prop: string, opts: Parameters<typeof open>[2] = {}): Promise<string> {
  const page = await open("toggle-group", fixture, opts)
  const value = (await page.evaluate(style(selector, prop))) as string
  await page.close()
  return value
}

// The semantic values each fallback resolves to on neutral light, read from the page itself so
// the "unset" cases pin the fallback chain, not a hex that a palette tweak would move.
async function semantic(name: string): Promise<string> {
  const page = await open("toggle-group", "default", { extraCss: `#probe { color: var(${name}); }` })
  const value = (await page.evaluate(
    `(function () { var p = document.createElement("i"); p.id = "probe"; document.getElementById("theme-scope").appendChild(p); return getComputedStyle(p).color; })()`,
  )) as string
  await page.close()
  return value
}

const resolved: Record<string, string> = {}

beforeAll(async () => {
  if (!(await launch())) return
  resolved.UNSET_PRIMARY = await semantic("--interactive-primary-bg")
  resolved.UNSET_PRIMARY_TEXT = await semantic("--interactive-primary-text")
  resolved.UNSET_TEXT = await semantic("--text-primary")
}, 60_000)

afterAll(close)

describe("VI-709 — toggle-group theme keys (real browser)", () => {
  for (const c of CASES) {
    const label = `${c.token} → toggle-group/${c.fixture} ${c.target.includes("aria-hidden") ? "indicator" : c.target.split(" ").pop()} ${c.prop}`

    it(`${label}: unset, it computes what 1.37.0 ships`, async (ctx) => {
      if (!ready()) return ctx.skip()
      expect(await read(c.fixture, c.target, c.prop)).toBe(resolved[c.unset] ?? c.unset)
    }, 30_000)

    it(`${label}: set, it computes the key`, async (ctx) => {
      if (!ready()) return ctx.skip()
      expect(await read(c.fixture, c.target, c.prop, { scopeCss: `${c.token}: ${c.value};` })).toBe(c.expected)
    }, 30_000)
  }

  it("a consumer class still sets the track, whichever sheet loads last", async (ctx) => {
    if (!ready()) return ctx.skip()
    // Loaded after the component CSS, at the specificity of one class (the group's own class list).
    const css = `[data-slot=toggle-group] { background-color: rgb(1, 2, 3); }`
    expect(await read("outline", GROUP, "backgroundColor", { scopeCss: "--toggle-group-track-bg: #112233;", extraCss: css })).toBe("rgb(1, 2, 3)")
  }, 30_000)

  it("SegmentedControl keeps its own track and pill when toggle-group colours are bound", async (ctx) => {
    if (!ready()) return ctx.skip()
    const bound = { scopeCss: "--toggle-group-track-bg: #112233; --toggle-group-selected-bg: #33ccaa;" }
    const root = "#root [data-slot=segmented-control]"
    const page = await open("segmented-control", "default", bound)
    const [track, pill] = (await page.evaluate(`[${style(root, "backgroundColor")}, ${style(`${root} > [aria-hidden="true"]`, "backgroundColor")}]`)) as string[]
    await page.close()
    expect(track).not.toBe("rgb(17, 34, 51)")
    expect(pill).not.toBe("rgb(51, 204, 170)")
  }, 30_000)
})

// ── Blacklight's pick (BL-1274), through the engine ─────────────────────────

/** blacklight-app's own YAML, with `components.toggle-group` merged in. */
function blacklightCss(keys: Record<string, unknown>): string {
  const doc = parse(readFileSync(join(process.cwd(), "custom-themes/blacklight-app.visor.yaml"), "utf-8"))
  doc.components = { ...doc.components, "toggle-group": keys }
  return docsAdapter(generateThemeData(stringify(doc)), { includeFontImports: false })
}

const BL_1274 = {
  "track-bg": "rgba(0, 0, 0, 0.65)",
  "selected-bg": "rgba(44, 224, 230, 0.09)",
  "selected-text": "#2ce0e6",
  "unselected-text": "rgba(255, 255, 255, 0.46)",
  "xs-font-size": "10px",
  "xs-padding-x": "11px",
  "xs-track-radius": "8px",
  "xs-item-radius": "6px",
}

describe("VI-709 — blacklight-app compact group, keys emitted by the engine", () => {
  it("draws BL-1274's pick with no tokens on the group", async (ctx) => {
    if (!ready()) return ctx.skip()
    const page = await open("toggle-group", "compact", {
      theme: { css: blacklightCss(BL_1274), className: "blacklight-app-theme", mode: "dark" },
    })
    const read = async (selector: string, props: string[]) =>
      (await page.evaluate(`[${props.map((p) => style(selector, p)).join(",")}]`)) as string[]
    const [trackBg, trackRadius, height] = await read(GROUP, ["backgroundColor", "borderTopLeftRadius", "height"])
    const [pillBg, pillRadius] = await read(INDICATOR, ["backgroundColor", "borderTopLeftRadius"])
    const [onInk, onSize, onSide, onRadius] = await read(ON, ["color", "fontSize", "paddingLeft", "borderTopLeftRadius"])
    const [offInk] = await read(OFF, ["color"])
    await page.close()

    expect(trackBg).toBe("rgba(0, 0, 0, 0.65)")
    expect(trackRadius).toBe("8px")
    expect(pillBg).toBe("rgba(44, 224, 230, 0.09)")
    expect(pillRadius).toBe("6px")
    expect(onInk).toBe("rgb(44, 224, 230)")
    expect(offInk).toBe("rgba(255, 255, 255, 0.46)")
    expect([onSize, onSide, onRadius]).toEqual(["10px", "11px", "6px"])
    // 24px option + 2px inset each side + the 1px (transparent) edge each side.
    expect(height).toBe("30px")
  }, 30_000)
})
