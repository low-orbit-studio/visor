// @vitest-environment node
/**
 * VI-839 — the squircle fallback, proven in real Chromium and WebKit.
 *
 * Chromium draws `corner-shape: squircle` natively and must not see the
 * fallback. WebKit (Playwright's, standing in for Safari, which has no
 * corner-shape) draws a squircle theme's components with the shared
 * `--squircle-radius` / `--squircle-clip`, each from its own `--squircle-r`:
 * its radius clamped to half its height, which is what Chromium draws. A round
 * theme changes nothing in either engine. Focus rings stay outside the clip.
 *
 * VI-841: the fallback is drawn with the force hook (`forceSquircleFallback`)
 * in WebKit, and in Chromium next to its native corner, so the proof holds in
 * a WebKit that draws `corner-shape` natively (Playwright 1.64+). The one test
 * of the real `@supports` gate calls `requireNoCornerShape` first, so a
 * Playwright upgrade that turns it native fails instead of passing silently.
 *
 * Skips where Chromium, WebKit or esbuild is unavailable; CI's concentric
 * job installs both and sets VISOR_REQUIRE_BROWSER.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { FIXTURES } from "../../../packages/cli/src/commands/render"
import { generateThemeData } from "../../../packages/theme-engine/src/pipeline"
import { docsAdapter } from "../../../packages/theme-engine/src/adapters/docs"
import { nextjsAdapter } from "../../../packages/theme-engine/src/adapters/nextjs"
import { SQUIRCLE_FALLBACK, forceSquircleFallback } from "../../../packages/theme-engine/src/generate-css"
import { scanConcentric } from "../../../packages/tokens/src/test-utils/concentric-scan"
import { bundle, close, launch, open, pixelDelta, requireNoCornerShape, type PageLike } from "./render-page"

type Engine = "chromium" | "webkit"
type Theme = { css: string; className: string; mode: "light" | "dark" }

// Paper's radii run 10 to 28px with pill buttons, so both clamped and unclamped corners are covered.
const paper = readFileSync(join(process.cwd(), "themes/paper.visor.yaml"), "utf8")
const theme = (name: string, yaml: string): Theme => ({
  css: docsAdapter(generateThemeData(yaml.replace(/^name: .*/m, `name: ${name}`))),
  className: `${name}-theme`,
  mode: "light",
})
const SQUIRCLE = theme("squircle-probe", `${paper}\ncorners: squircle\n`)
const ROUND = theme("round-probe", paper)

const h = "var h = React.createElement;"
FIXTURES.card = FIXTURES.card ?? {}
FIXTURES.card.vi839 = { export: "Card", props: `(function () { ${h} return { style: { width: 280 }, children: [h(__mod.CardHeader, { key: "h" }, h(__mod.CardTitle, null, "Settle up")), h(__mod.CardContent, { key: "c" }, "Card body copy.")] }; })()` }
FIXTURES.tabs.vi839 = { export: "Tabs", props: `(function () { ${h} return { defaultValue: "one", children: [h(__mod.TabsList, { key: "l" }, [h(__mod.TabsTrigger, { key: "1", value: "one" }, "Overview"), h(__mod.TabsTrigger, { key: "2", value: "two" }, "Activity")]), h(__mod.TabsContent, { key: "c", value: "one" }, "Overview content")] }; })()` }

/**
 * Boxes that stay round in Safari: their focus halo or shadow hugs the box, and
 * Safari cannot shape a box-shadow (or a drop-shadow, which runs before the
 * clip) to the squircle, so a squircle would show a seam between the two.
 */
const ROUND_IN_SAFARI: Array<[component: string, fixture: string, targets: string[]]> = [
  ["input", "default", ["#root input"]],
  ["input", "suffix", ["#root [data-slot=input-wrapper]"]],
  ["card", "vi839", ["#root [data-slot=card]"]],
  ["tabs", "vi839", ["#root [data-slot=tabs-list]", "#root [data-slot=tabs-list] [data-state=active]"]],
]

/** Every box that draws the fallback, per fixture. */
const CASES: Array<[component: string, fixture: string, targets: string[]]> = [
  ["button", "default", ["#root button"]],
  ["button", "sm", ["#root button"]],
  ["button", "lg-outline", ["#root button"]],
  ["button", "dlg", ["#root button"]],
  ["button", "icon-outline", ["#root button"]],
  ["segmented-control", "default", ["#root [data-variant=outline]", "#root [data-variant=outline] > [aria-hidden=true]", "#root [data-slot=toggle-group-item]"]],
  ["dialog", "default", ["[role=dialog]"]],
  ["meter", "default", ["#root [data-slot=meter-track]", "#root [data-slot=meter-fill]"]],
  ["badge", "default", ["#root [data-slot=badge]"]],
  ["chip", "default", ["#root [data-slot=chip]"]],
]

interface Box { sel: string; w: number; h: number; radius: number; clip: string; squircle: number; shape: string }

const READ = (targets: string[]) => `JSON.stringify(${JSON.stringify(targets)}.map(function (sel) {
  var el = document.querySelector(sel);
  if (!el) return { sel: sel, w: 0, h: 0, radius: -1, clip: "missing", squircle: 0, shape: "" };
  var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
  return { sel: sel, w: r.width, h: r.height, radius: parseFloat(cs.borderTopLeftRadius) || 0, clip: cs.clipPath,
    squircle: parseFloat(cs.getPropertyValue("--squircle-r")) || 0, shape: cs.getPropertyValue("corner-top-left-shape") };
}))`

async function measure(component: string, fixture: string, targets: string[], t: Theme, forceSquircle = false): Promise<Box[]> {
  const page = await open(component, fixture, { theme: t, forceSquircle })
  const boxes = JSON.parse((await page.evaluate(READ(targets))) as string) as Box[]
  await page.close()
  return boxes
}

/** The CSS without the fallback: every `@supports not (corner-shape: squircle)` block cut out. */
function strip(css: string): string {
  const at = css.indexOf("@supports not (corner-shape: squircle)")
  if (at === -1) return css
  let depth = 0
  for (let i = css.indexOf("{", at); i < css.length; i++) {
    if (css[i] === "{") depth++
    else if (css[i] === "}" && --depth === 0) return strip(css.slice(0, at) + css.slice(i + 1))
  }
  throw new Error("unbalanced @supports block")
}

/** Pixel delta between a fixture drawn with the fallback and with it cut out. */
async function unchanged(component: string, fixture: string, t: Theme, forceSquircle = false): Promise<{ n: number; max: number }> {
  const shot = async (componentCss: string, themeCss: string) => {
    const page = await open(component, fixture, { theme: { ...t, css: themeCss }, componentCss, forceSquircle })
    // SegmentedControl places its pill after mount; shoot once it is placed in both loads.
    await page.evaluate(`new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); })`)
    const png = await page.screenshot({})
    await page.close()
    return png
  }
  const { css } = await bundle(component, fixture)
  return pixelDelta(await shot(css, t.css), await shot(strip(css), strip(t.css)))
}

/** `squircle` and `round` as the engine draws them (WebKit with the force hook); `forced`: Chromium with the hook. */
const results: Record<Engine, Record<string, { squircle: Box[]; round: Box[]; forced: Box[] }>> = { chromium: {}, webkit: {} }
/** WebKit, squircle theme: the boxes that must stay round. */
const keptRound: Box[] = []
/** Pixels the fallback changes where it must change none: Chromium in both themes, WebKit in the round one. */
const untouched: Array<{ key: string; n: number; max: number }> = []
/** Control: WebKit in a squircle theme must change, or the comparison above proves nothing. */
let drawn: { n: number; max: number } | null = null
const available: Record<Engine, boolean> = { chromium: false, webkit: false }
let focus: { input: { n: number }; button: { n: number }; corner: { n: number } } | null = null
let concentric: ReturnType<typeof scanConcentric> = []
/** The edge layers in WebKit: Button's ::after ring, and the SegmentedControl track's (off, as its own edge is). */
let rings: { button: string; buttonPaint: string; track: string } | null = null

/** Pixels that change in a band outside the box when it takes focus. */
async function ringOutside(page: PageLike, sel: string): Promise<{ band: Buffer; corner: Buffer }> {
  const r = JSON.parse((await page.evaluate(`JSON.stringify(document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect())`)) as string)
  return {
    // A strip above the box, clear of it by a pixel.
    band: await page.screenshot({ clip: { x: r.x + r.width / 4, y: r.y - 5, width: r.width / 2, height: 4 } }),
    // The square beyond the top-left corner, where the clip would cut a ring.
    corner: await page.screenshot({ clip: { x: r.x - 4, y: r.y - 4, width: 7, height: 7 } }),
  }
}

async function collect(engine: Engine): Promise<void> {
  if (!(await launch(engine))) return
  available[engine] = true
  // WebKit stands in for Safari, so it always draws the fallback, natively supported corner-shape or not.
  const forceSquircle = engine === "webkit"
  for (const [component, fixture, targets] of CASES) {
    results[engine][`${component}/${fixture}`] = {
      squircle: await measure(component, fixture, targets, SQUIRCLE, forceSquircle),
      round: await measure(component, fixture, targets, ROUND, forceSquircle),
      forced: engine === "chromium" ? await measure(component, fixture, targets, SQUIRCLE, true) : [],
    }
    for (const t of engine === "chromium" ? [SQUIRCLE, ROUND] : [ROUND]) {
      untouched.push({ key: `${engine} ${t.className} ${component}/${fixture}`, ...(await unchanged(component, fixture, t, forceSquircle)) })
    }
  }
  if (engine === "webkit") {
    for (const [component, fixture, targets] of ROUND_IN_SAFARI) keptRound.push(...(await measure(component, fixture, targets, SQUIRCLE, true)))
    drawn = await unchanged("button", "default", SQUIRCLE, true)
    const edgeLayer = async (component: string, fixture: string, sel: string, pseudo: string) => {
      const page = await open(component, fixture, { theme: SQUIRCLE, forceSquircle: true })
      const read = JSON.parse((await page.evaluate(`JSON.stringify((function () {
        var el = document.querySelector(${JSON.stringify(sel)}), s = getComputedStyle(el, ${JSON.stringify(pseudo)});
        return { clip: s.clipPath, paint: s.outlineWidth, style: s.outlineStyle + "/" + getComputedStyle(el).outlineStyle };
      })())`)) as string) as { clip: string; paint: string; style: string }
      await page.close()
      return read
    }
    const outline = await edgeLayer("button", "lg-outline", "#root button", "::after")
    const track = await edgeLayer("segmented-control", "default", "#root [data-variant=outline]", "::before")
    rings = { button: outline.clip, buttonPaint: outline.paint, track: track.style }
    // Focus rings: the input's halo and the button's outline sit outside the box, which the clip keeps.
    const shots = async (component: string, fixture: string, sel: string) => {
      const page = await open(component, fixture, { theme: SQUIRCLE, scale: 2, forceSquircle: true })
      const before = await ringOutside(page, sel)
      await page.evaluate(`document.querySelector(${JSON.stringify(sel)}).focus()`)
      const after = await ringOutside(page, sel)
      await page.close()
      return { band: await pixelDelta(before.band, after.band), corner: await pixelDelta(before.corner, after.corner) }
    }
    const input = await shots("input", "default", "#root input")
    const button = await shots("button", "default", "#root button")
    focus = { input: input.band, button: button.band, corner: input.corner }
    // Nested corners stay concentric where the fallback draws them.
    // The first segment is selected, so the pill sits in the track's corners.
    const page = await open("segmented-control", "disabled-option", { theme: SQUIRCLE, forceSquircle: true })
    // The pill is placed after mount; scan once it is.
    await page.evaluate(`new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); })`)
    // `__name`: the transform's keep-names helper, which the serialised function calls.
    concentric = JSON.parse((await page.evaluate(`var __name = function (f) { return f }; JSON.stringify((${scanConcentric.toString()})({ root: "#root" }))`)) as string)
    await page.close()
  }
  await close()
}

beforeAll(async () => {
  await collect("chromium")
  await collect("webkit")
}, 240_000)

afterAll(async () => { await close() })

describe("VI-839 squircle fallback: theme engine", () => {
  for (const [name, adapter] of [["docs", docsAdapter], ["nextjs", nextjsAdapter]] as const) {
    it(`${name}: a squircle theme ships the fallback in its base layer; a round theme ships none`, () => {
      const emit = (extra: string) => adapter(generateThemeData(`name: probe\nversion: 1\ncolors:\n  primary: "#6b46ff"\n${extra}`))
      const squircle = emit("corners: squircle")
      expect(squircle).toContain(SQUIRCLE_FALLBACK)
      expect(squircle.indexOf(SQUIRCLE_FALLBACK)).toBeLessThan(squircle.indexOf("@layer visor-semantic"))
      expect(emit("")).not.toContain("--squircle")
    })
  }

  it("gates on the missing property and on the theme's corner, and clips with shape()", () => {
    expect(SQUIRCLE_FALLBACK).toContain("@supports not (corner-shape: squircle)")
    expect(SQUIRCLE_FALLBACK).toContain("@container style(--corner-shape: squircle)")
    expect(SQUIRCLE_FALLBACK).toMatch(/--squircle-clip: shape\(nonzero from /)
    expect(SQUIRCLE_FALLBACK).toContain("--squircle-radius: calc(var(--squircle-r) * 0.54);")
    expect(SQUIRCLE_FALLBACK).toMatch(/--squircle-ring: shape\(evenodd from /)
  })

  it("VI-841: the force hook lifts every @supports gate, turns native corner-shape off, and never ships", () => {
    const component = "@supports not (corner-shape:squircle){@container style(--corner-shape: squircle){.b{clip-path:var(--squircle-clip, none)}}}"
    const forced = forceSquircleFallback(`${SQUIRCLE_FALLBACK}\n${component}`)
    expect(forced).not.toMatch(/@supports\s+not\s*\(\s*corner-shape/)
    expect(forced.match(/@media all/g)).toHaveLength(2)
    expect(forced).toContain("@container style(--corner-shape: squircle)")
    expect(forced).toContain("*, *::before, *::after { corner-shape: round !important; }")
    const shipped = docsAdapter(generateThemeData(`name: probe\nversion: 1\ncolors:\n  primary: "#6b46ff"\ncorners: squircle`))
    expect(shipped).not.toContain("@media all")
    expect(shipped).not.toContain("corner-shape: round !important")
  })

  it("VI-841: the guard fails where corner-shape is native, and passes where it is missing", async () => {
    const page = (supported: boolean) => ({ evaluate: async () => supported })
    await expect(requireNoCornerShape(page(true))).rejects.toThrow("this WebKit draws corner-shape natively; the fallback is not being tested")
    await expect(requireNoCornerShape(page(false))).resolves.toBeUndefined()
  })
})

describe("VI-839 squircle fallback: Chromium and WebKit", () => {
  it("Chromium draws corner-shape natively: no clip on any target", (ctx) => {
    if (!available.chromium) return ctx.skip()
    for (const [key, { squircle }] of Object.entries(results.chromium)) {
      for (const b of squircle) {
        expect(b.clip, `${key} ${b.sel}`).toBe("none")
        // Playwright 1.64's Chromium (156) serialises the keyword as superellipse(2).
        expect(["squircle", "superellipse(2)"], `${key} ${b.sel}`).toContain(b.shape)
      }
    }
  })

  it("WebKit, and Chromium with the force hook, clip each target with a shape() at its radius clamped to half its height", (ctx) => {
    if (!available.chromium || !available.webkit) return ctx.skip()
    const drawnBy = (engine: Engine) => Object.entries(results[engine]).map(([key, r]) => [`${engine} ${key}`, engine === "webkit" ? r.squircle : r.forced, results.chromium[key].squircle] as const)
    for (const [key, fallback, chromium] of [...drawnBy("webkit"), ...drawnBy("chromium")]) {
      fallback.forEach((b, i) => {
        const native = chromium[i]
        const expected = Math.min(native.radius, native.h / 2, native.w / 2)
        expect(b.clip, `${key} ${b.sel}`).toMatch(/^shape\(from /)
        expect(b.shape, `${key} ${b.sel}: native corner-shape is off`).not.toBe("squircle")
        expect(b.squircle, `${key} ${b.sel}: --squircle-r vs Chromium's drawn radius`).toBeGreaterThan(0)
        expect(Math.abs(b.squircle - expected), `${key} ${b.sel}: --squircle-r ${b.squircle} vs ${expected}`).toBeLessThanOrEqual(1)
        expect(b.radius, `${key} ${b.sel}: the circle under the clip`).toBeCloseTo(b.squircle * 0.54, 1)
      })
    }
  })

  it("Chromium in any theme, and WebKit in a round theme, draw the same pixels with or without the fallback", (ctx) => {
    if (!available.chromium || !available.webkit) return ctx.skip()
    expect(untouched.length).toBe(CASES.length * 3)
    // Chromium re-rasterises rounded corners with ±1/255 jitter, so "nothing changed" is max <= 2.
    for (const u of untouched) expect(u.max, `${u.key}: ${u.n} pixels differ`).toBeLessThanOrEqual(2)
    expect(drawn?.n, "WebKit in a squircle theme: the fallback redraws the corners").toBeGreaterThan(0)
  })

  it("a round theme changes nothing in either engine", (ctx) => {
    if (!available.chromium || !available.webkit) return ctx.skip()
    for (const [key, { round }] of Object.entries(results.webkit)) {
      round.forEach((b, i) => {
        expect(b.clip, `${key} ${b.sel}`).toBe("none")
        expect(results.chromium[key].round[i].clip, `${key} ${b.sel}`).toBe("none")
        expect(b.radius, `${key} ${b.sel}`).toBe(results.chromium[key].round[i].radius)
      })
    }
  })

  it("WebKit leaves inputs, cards and tabs round: no clip, their own radius", (ctx) => {
    if (!available.webkit) return ctx.skip()
    expect(keptRound.length).toBe(5)
    for (const b of keptRound) {
      expect(b.clip, b.sel).toBe("none")
      expect(b.radius, b.sel).toBeGreaterThan(0)
    }
  })

  it("WebKit draws edges as squircle rings, and only where the element draws its own edge", (ctx) => {
    if (!available.webkit || !rings) return ctx.skip()
    expect(rings.button).toMatch(/^shape\(evenodd /)
    expect(parseFloat(rings.buttonPaint)).toBeGreaterThan(1)
    // Radix puts outline: none on the track; the ring follows the track's own outline style.
    expect(rings.track).toBe("none/none")
  })

  it("WebKit keeps focus rings: ring pixels appear outside the clipped box", (ctx) => {
    if (!available.webkit || !focus) return ctx.skip()
    expect(focus.input.n, "input focus halo above the box").toBeGreaterThan(0)
    expect(focus.button.n, "button focus ring above the box").toBeGreaterThan(0)
    expect(focus.corner.n, "input focus halo beyond the corner").toBeGreaterThan(0)
  })

  it("WebKit keeps the segmented control's nested corners concentric", (ctx) => {
    if (!available.webkit) return ctx.skip()
    expect(concentric.length).toBeGreaterThan(0)
    expect(concentric.filter((p) => p.innerShape === "squircle").length).toBeGreaterThan(0)
    expect(concentric.filter((p) => !p.ok)).toEqual([])
  })

  // The real gate, unforced: a WebKit that draws corner-shape natively fails here instead of passing untested.
  it("WebKit without the hook takes the @supports path", async (ctx) => {
    if (!available.webkit || !(await launch("webkit"))) return ctx.skip()
    try {
      const page = await open("button", "default", { theme: SQUIRCLE })
      await requireNoCornerShape(page)
      const [b] = JSON.parse((await page.evaluate(READ(["#root button"]))) as string) as Box[]
      expect(b.clip).toMatch(/^shape\(from /)
      expect(b.squircle).toBeGreaterThan(0)
    } finally {
      await close()
    }
  }, 60_000)

  // CI installs Chromium and WebKit for this file and sets VISOR_REQUIRE_BROWSER, so the proof cannot silently skip there.
  it.runIf(process.env.VISOR_REQUIRE_BROWSER)("runs in Chromium and WebKit", () => {
    expect(available).toEqual({ chromium: true, webkit: true })
  })
})
