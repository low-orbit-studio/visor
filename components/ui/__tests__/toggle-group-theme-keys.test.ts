// @vitest-environment node
/**
 * VI-709 — the `toggle-group` theme keys, proven in a real browser.
 *
 *  - **Unset equals what shipped.** `unset` is what 1.37.0 computes on the
 *    neutral light theme; an unbound theme must still compute it. (VI-837
 *    moved the xs item radius to the concentric 3px on purpose.)
 *  - **Set equals the key.** Binding the token on the theme scope moves the
 *    computed style to the bound value.
 *
 * Then the reason the keys exist: Blacklight's picked compact group, bound
 * through the engine on the blacklight-app theme with no tokens on the group.
 *
 * Skips where Chromium is unavailable (playwright is an optional dep).
 */

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { parse, stringify } from "yaml"
import { generateThemeData } from "../../../packages/theme-engine/src/pipeline"
import { docsAdapter } from "../../../packages/theme-engine/src/adapters/docs"
import { findMainRepoRoot, scanParentForPrivateThemes } from "../../../packages/cli/src/utils/theme-helpers"
import { close, launch, open, ready } from "./render-page"

const GROUP = "#root [data-slot=toggle-group]"
const INDICATOR = `${GROUP} > [aria-hidden="true"]`
const ON = "#root [data-slot=toggle-group-item][data-state=on]"
const OFF = "#root [data-slot=toggle-group-item][data-state=off]"
// VI-806: the option-mark fixture's picked row, its round mark and its description line.
const ROW_ON = "#root [data-slot=toggle-group-item][data-state=on]"
const MARK_ON = `${ROW_ON} [data-slot=toggle-group-mark]`
const DESCRIPTION = `${ROW_ON} [data-slot=toggle-group-description]`

interface Case {
  token: string
  fixture: "default" | "outline" | "compact" | "option-mark"
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
  { token: "--toggle-group-xs-item-radius", fixture: "compact", target: ON, prop: "borderTopLeftRadius", value: "6px", expected: "6px", unset: "3px" }, // VI-837: concentric, 6px - 2px - 1px
  { token: "--toggle-group-xs-item-radius", fixture: "compact", target: INDICATOR, prop: "borderTopLeftRadius", value: "6px", expected: "6px", unset: "3px" }, // VI-837: concentric, 6px - 2px - 1px
  // VI-806: the description line and the round single-choice mark.
  { token: "--toggle-group-option-description-text", fixture: "option-mark", target: DESCRIPTION, prop: "color", value: "#ff8800", expected: "rgb(255, 136, 0)", unset: "UNSET_SECONDARY" },
  { token: "--toggle-group-option-description-font-size", fixture: "option-mark", target: DESCRIPTION, prop: "fontSize", value: "13px", expected: "13px", unset: "14px" },
  { token: "--toggle-group-option-mark-bg", fixture: "option-mark", target: MARK_ON, prop: "backgroundColor", value: "#33ccaa", expected: "rgb(51, 204, 170)", unset: "UNSET_PRIMARY" },
  { token: "--toggle-group-option-mark-text", fixture: "option-mark", target: MARK_ON, prop: "color", value: "#aa33cc", expected: "rgb(170, 51, 204)", unset: "UNSET_PRIMARY_TEXT" },
  { token: "--toggle-group-option-check-size", fixture: "option-mark", target: MARK_ON, prop: "width", value: "24px", expected: "24px", unset: "20px" },
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
  resolved.UNSET_SECONDARY = await semantic("--text-secondary")
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

// ── VI-806: the round mark's colour and the row's blur, per theme ──────────

/** A private theme's CSS through the engine, when a local visor-themes-private checkout exists. */
function privateThemeCss(slug: string): string | null {
  const env = process.env.VISOR_THEMES_PRIVATE_PATH
  const main = findMainRepoRoot(process.cwd()) ?? process.cwd()
  const dirs = [env && join(env, "themes"), env, join(main, "..", "visor-themes-private", "themes"), ...scanParentForPrivateThemes(join(main, ".."))]
  const file = dirs.filter(Boolean).map((d) => join(d as string, slug, "theme.visor.yaml")).find(existsSync)
  return file ? docsAdapter(generateThemeData(readFileSync(file, "utf-8")), { includeFontImports: false }) : null
}

/** The picked mark's fill, the theme's --interactive-primary-bg, and each row's backdrop-filter, with glass on or not. */
async function readMarkAndBlur(opts: Parameters<typeof open>[2], glass?: "on" | "off" | "off-in-on") {
  const page = await open("toggle-group", "option-mark", opts)
  const out = (await page.evaluate(`(function () {
    var scope = document.getElementById("theme-scope"), root = document.getElementById("root");
    if (${JSON.stringify(glass ?? "")} === "on") scope.setAttribute("data-glass", "on");
    if (${JSON.stringify(glass ?? "")} === "off-in-on") { scope.setAttribute("data-glass", "on"); root.setAttribute("data-glass", "off"); }
    var probe = document.createElement("i"); probe.style.color = "var(--interactive-primary-bg)"; root.appendChild(probe);
    var key = getComputedStyle(probe).color; probe.remove();
    var rows = Array.prototype.map.call(document.querySelectorAll("#root [data-slot=toggle-group-item]"), function (r) { return getComputedStyle(r).backdropFilter; });
    var mark = getComputedStyle(document.querySelector(${JSON.stringify(MARK_ON)}));
    return { mark: mark.backgroundColor, shape: mark.getPropertyValue("corner-shape"), key: key, rows: rows };
  })()`)) as { mark: string; shape: string; key: string; rows: string[] }
  await page.close()
  return out
}

describe("VI-806 — round mark colour and glass-gated blur (real browser)", () => {
  // The "Verify docs build" job installs Chromium and sets VISOR_REQUIRE_BROWSER, so this proof cannot silently skip there.
  it.runIf(process.env.VISOR_REQUIRE_BROWSER)("runs in Chromium", () => {
    expect(ready(), "playwright's chromium is not installed").toBe(true)
  })

  it("neutral light: the mark takes --interactive-primary-bg, and the rows have no blur", async (ctx) => {
    if (!ready()) return ctx.skip()
    const r = await readMarkAndBlur({})
    expect(r.mark).toBe(r.key)
    expect(r.rows).toEqual(["none", "none"])
  }, 30_000)

  it("neutral: glass on gives the glass layer's control blur; off inside on clears it", async (ctx) => {
    if (!ready()) return ctx.skip()
    expect((await readMarkAndBlur({}, "on")).rows).toEqual(["blur(16px)", "blur(16px)"])
    expect((await readMarkAndBlur({}, "off-in-on")).rows).toEqual(["none", "none"])
  }, 30_000)

  const backstage = privateThemeCss("honcho-backstage")
  const honcho = privateThemeCss("honcho")
  // CI has no private themes; these run wherever a visor-themes-private checkout sits beside Visor.
  it.skipIf(!backstage)("honcho-backstage light and dark: the mark is the theme's key, no blur with glass off, its control blur with glass on", async (ctx) => {
    if (!ready()) return ctx.skip()
    for (const mode of ["light", "dark"] as const) {
      const theme = { css: backstage!, className: "honcho-backstage-theme", mode }
      const off = await readMarkAndBlur({ theme })
      expect(off.mark, mode).toBe(off.key)
      expect(off.key, mode).toBe("rgb(255, 45, 138)")
      expect(off.rows, mode).toEqual(["none", "none"])
      // The theme draws squircle corners; the mark stays a circle.
      expect(off.shape, mode).toBe("round")
      const on = await readMarkAndBlur({ theme }, "on")
      expect(on.rows, mode).toEqual(["blur(24px) saturate(1.15)", "blur(24px) saturate(1.15)"])
    }
  }, 60_000)

  it.skipIf(!honcho)("honcho (Today): the mark is the theme's key and the rows are solid", async (ctx) => {
    if (!ready()) return ctx.skip()
    const r = await readMarkAndBlur({ theme: { css: honcho!, className: "honcho-theme", mode: "light" } })
    expect(r.mark).toBe(r.key)
    expect(r.rows).toEqual(["none", "none"])
  }, 30_000)
})
