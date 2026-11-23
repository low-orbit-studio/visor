// @vitest-environment node
/**
 * VI-837 — concentric inner radii, proven in a real browser.
 *
 * Every control with a track and a selected item draws its inner radius as the
 * track radius minus the gap between them (padding plus border, measured from
 * the bounding rects), so nested corners always run parallel. Checked at every
 * size in every built-in theme, light and dark, with the shared
 * `expectConcentric` helper consumers get from `@loworbitstudio/visor-core/test-utils`.
 * jsdom cannot resolve the var()/calc() chain, hence Chromium.
 *
 * Skips where Chromium or esbuild is unavailable.
 */
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { FIXTURES } from "../../../packages/cli/src/commands/render"
import { expectConcentric, type ConcentricBox } from "../../../packages/tokens/src/test-utils/concentric"
import { close, launch, open, ready } from "./render-page"

const SIZES = ["xs", "sm", "md", "lg"] as const
const MODES = ["light", "dark"] as const
const OPTIONS = `[{ value: "a", label: "Unpaid" }, { value: "b", label: "Paid" }, { value: "c", label: "Any" }]`

// Test-only fixtures: one per size, and the theme switcher in each mode (it sets the html mode on mount).
for (const size of SIZES) {
  FIXTURES["segmented-control"][`vi837-${size}`] = { export: "SegmentedControl", props: `{ "aria-label": "Status", size: "${size}", defaultValue: "b", options: ${OPTIONS} }` }
  FIXTURES["toggle-group"][`vi837-${size}`] = {
    export: "ToggleGroup",
    props: `(function () { var h = React.createElement; return { type: "single", variant: "outline", size: "${size}", "aria-label": "View", defaultValue: "w", children: [h(__mod.ToggleGroupItem, { key: "d", value: "d" }, "Day"), h(__mod.ToggleGroupItem, { key: "w", value: "w" }, "Week")] }; })()`,
  }
}
FIXTURES.tabs["vi837-default"] = {
  export: "Tabs",
  props: `(function () { var h = React.createElement; return { defaultValue: "one", children: [h(__mod.TabsList, { key: "l" }, [h(__mod.TabsTrigger, { key: "1", value: "one" }, "Overview"), h(__mod.TabsTrigger, { key: "2", value: "two" }, "Activity")]), h(__mod.TabsContent, { key: "c", value: "one" }, "Overview content")] }; })()`,
}
for (const mode of MODES) {
  FIXTURES["theme-switcher"] = FIXTURES["theme-switcher"] ?? {}
  FIXTURES["theme-switcher"][`vi837-${mode}`] = { export: "ThemeSwitcher", props: `{ defaultMode: "${mode}" }` }
}

/** Track and selected item of each control, as helper boxes. */
const READ = `JSON.stringify((function () {
  var pairs = [];
  var add = function (track, inner) {
    if (!track || !inner) return;
    var box = function (el) { var r = el.getBoundingClientRect(); return { top: r.top, height: r.height, radius: getComputedStyle(el).borderTopLeftRadius }; };
    pairs.push({ outer: box(track), inner: box(inner) });
  };
  document.querySelectorAll('#root [data-variant="outline"][data-size]').forEach(function (g) {
    add(g, g.querySelector(':scope > [aria-hidden="true"]'));
    add(g, g.querySelector('[data-state="on"]'));
  });
  document.querySelectorAll('#root [data-slot="tabs-list"]').forEach(function (l) { add(l, l.querySelector('[data-state="active"]')); });
  document.querySelectorAll('#root [role="radiogroup"]').forEach(function (g) { if (!g.closest('[data-slot]')) add(g, g.querySelector('[aria-checked="true"]')); });
  return pairs;
})())`

type Pair = { outer: ConcentricBox; inner: ConcentricBox }
type Theme = { css: string; className: string; mode: "light" | "dark" }

async function pairs(component: string, fixture: string, opts: { theme?: Theme; scopeCss?: string } = {}): Promise<Pair[]> {
  const page = await open(component, fixture, opts)
  // The sliding pill is placed after mount.
  await page.evaluate(`new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); })`)
  const out = JSON.parse((await page.evaluate(READ)) as string) as Pair[]
  await page.close()
  return out
}

const THEME_DIR = join(process.cwd(), "packages/docs/app")
const THEMES = readdirSync(THEME_DIR).filter((f) => f.endsWith("-theme.css")).map((f) => f.replace(/-theme\.css$/, ""))

const CASES: Array<[string, (mode: string) => string]> = [
  ...SIZES.map((s) => ["segmented-control", () => `vi837-${s}`] as [string, () => string]),
  ...SIZES.map((s) => ["toggle-group", () => `vi837-${s}`] as [string, () => string]),
  ["tabs", () => "vi837-default"],
  ["theme-switcher", (mode) => `vi837-${mode}`],
]

beforeAll(async () => { await launch() }, 60_000)
afterAll(close, 30_000)

describe("expectConcentric", () => {
  it("passes nested corners and pill in pill, fails a mismatch", () => {
    expect(expectConcentric({ top: 0, height: 38, radius: "8px" }, { top: 5, height: 28, radius: "3px" }).expected).toBe(3)
    expect(() => expectConcentric({ top: 0, height: 38, radius: 999 }, { top: 4, height: 30, radius: 995 })).not.toThrow()
    expect(() => expectConcentric({ top: 0, height: 38, radius: 8 }, { top: 5, height: 28, radius: 6 })).toThrow(/should be 3px/)
    expect(expectConcentric({ top: 0, height: 30, radius: 2 }, { top: 5, height: 20, radius: 0 }).expected).toBe(0)
  })
})

describe("VI-837 concentric inner radii (real browser)", () => {
  for (const theme of THEMES) it(`every track control, every size, light and dark: ${theme}`, async (ctx) => {
    if (!ready()) return ctx.skip()
    const css = readFileSync(join(THEME_DIR, `${theme}-theme.css`), "utf-8")
    let checked = 0
    for (const mode of MODES) {
      for (const [component, fixture] of CASES) {
        const found = await pairs(component, fixture(mode), { theme: { css, className: `${theme}-theme`, mode } })
        expect(found.length, `${component}/${fixture(mode)} in ${theme} ${mode}`).toBeGreaterThan(0)
        for (const p of found) {
          try { expectConcentric(p.outer, p.inner) } catch (e) { throw new Error(`${component}/${fixture(mode)} in ${theme} ${mode}: ${(e as Error).message}`) }
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(CASES.length * MODES.length)
  }, 120_000)

  it("a theme that binds only the track radius (14px) with 2px padding and a 1px border gets an 11px inner radius", async (ctx) => {
    if (!ready()) return ctx.skip()
    const found = await pairs("segmented-control", "vi837-md", { scopeCss: "--segmented-control-radius: 14px; --segmented-control-track-padding: 2px;" })
    expect(found.map((p) => p.outer.radius)).toEqual(["14px", "14px"])
    expect(found.map((p) => p.inner.radius)).toEqual(["11px", "11px"])
    for (const p of found) expect(expectConcentric(p.outer, p.inner).expected).toBe(11)
  }, 30_000)

  it("a 999px track gives a pill in a pill with no special case", async (ctx) => {
    if (!ready()) return ctx.skip()
    const found = await pairs("segmented-control", "vi837-md", { scopeCss: "--segmented-control-radius: 999px;" })
    expect(found[0].inner.radius).toBe("994px")
    for (const p of found) expectConcentric(p.outer, p.inner)
  }, 30_000)

  it("the inner tokens still override", async (ctx) => {
    if (!ready()) return ctx.skip()
    const found = await pairs("segmented-control", "vi837-md", { scopeCss: "--segmented-control-indicator-radius: 2px; --segmented-control-item-radius: 2px;" })
    expect(found.map((p) => p.inner.radius)).toEqual(["2px", "2px"])
  }, 30_000)

  it("mutation control: the old fixed 6px trigger in a pill rail is caught", async (ctx) => {
    if (!ready()) return ctx.skip()
    const broken = await pairs("tabs", "vi837-default", { scopeCss: "--tabs-trigger-radius: 6px;" })
    expect(() => expectConcentric(broken[0].outer, broken[0].inner)).toThrow(/not concentric/)
  }, 30_000)
})
