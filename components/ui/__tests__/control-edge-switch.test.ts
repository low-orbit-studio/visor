// @vitest-environment node
/**
 * VI-655 — the one switch for form-control edges, proven in a real browser.
 *
 * Every form control draws its resting edge from the shared --control-edge-*
 * tokens, so `--control-edge-width: 0` on any ancestor removes every resting
 * edge at once. A string check on the CSS cannot prove that (an outline drawn
 * on ::after, a `var()` fallback, a border that still carries colour all read
 * the same to a regex), so this suite bundles each real component exactly the
 * way `visor render` does, loads it in Chromium, and reads computed styles and
 * pixels.
 *
 * Skips where Chromium is unavailable (playwright is an optional dep),
 * mirroring scripts/rules/__tests__/token-resolution-transparency.test.ts. The
 * CI-portable half of the contract lives in control-edge-tokens.test.ts.
 */

import { readFileSync } from "node:fs"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
  FIXTURES,
  buildEntrySource,
  buildHtml,
  pascalCase,
  resolveComponentFile,
  resolveThemeCssFile,
  resolveTokensCssFile,
} from "../../../packages/cli/src/commands/render"

const REPO_ROOT = process.cwd()
const THEME = "neutral"

/** Every fixture of every component the switch governs. */
const COMPONENTS = [
  "input", "textarea", "select", "checkbox", "switch",
  "tag-input", "chip", "file-upload", "empty-state", "button",
]
/** Fixtures that draw a visible resting edge while the switch is on. */
const EDGED = new Set([
  "input/default", "textarea/default", "select/default", "checkbox/default",
  "tag-input/default", "chip/outlined", "file-upload/default", "empty-state/default",
  "button/outline", "button/gated", "button/dlg-ghost",
])
/** Fixtures that draw a dashed (drop) edge. */
const DASHED = new Set(["file-upload/default", "empty-state/default"])

interface Bundle { css: string; js: string }
interface PageLike {
  setContent(html: string, opts: { waitUntil: "load" }): Promise<void>
  evaluate(expression: string): Promise<unknown>
  waitForFunction(expression: string, arg?: unknown, opts?: { timeout: number }): Promise<unknown>
  addStyleTag(opts: { content: string }): Promise<unknown>
  screenshot(opts: { clip?: { x: number; y: number; width: number; height: number } }): Promise<Buffer>
  close(): Promise<void>
}
interface BrowserLike { newPage(opts?: { viewport: { width: number; height: number } }): Promise<PageLike>; close(): Promise<void> }

let browser: BrowserLike | null = null
let esbuild: { build(opts: Record<string, unknown>): Promise<{ outputFiles?: Array<{ path: string; text: string }> }> } | null = null
const bundles = new Map<string, Bundle>()

const tokensCss = () => readFileSync(resolveTokensCssFile(REPO_ROOT)!, "utf-8")
const themeCss = () => readFileSync(resolveThemeCssFile(REPO_ROOT, THEME)!, "utf-8")

async function bundle(component: string, fixture: string): Promise<Bundle> {
  const key = `${component}/${fixture}`
  const cached = bundles.get(key)
  if (cached) return cached
  const spec = FIXTURES[component][fixture]
  const result = await esbuild!.build({
    stdin: {
      contents: buildEntrySource(resolveComponentFile(REPO_ROOT, component)!, spec, spec.export ?? pascalCase(component)),
      resolveDir: REPO_ROOT,
      loader: "tsx",
      sourcefile: "edge-switch-entry.tsx",
    },
    bundle: true,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    write: false,
    outdir: "edge-switch-out",
    define: { "process.env.NODE_ENV": '"production"' },
    banner: { js: "globalThis.process = globalThis.process || { env: {} };" },
    logLevel: "silent",
  })
  const out: Bundle = { css: "", js: "" }
  for (const f of result.outputFiles ?? []) {
    if (f.path.endsWith(".css")) out.css += f.text
    else if (f.path.endsWith(".js")) out.js += f.text
  }
  bundles.set(key, out)
  return out
}

const ALL_FIXTURES = COMPONENTS.flatMap((c) => Object.keys(FIXTURES[c]).map((f) => ({ component: c, fixture: f, id: `${c}/${f}` })))

/** Open a fixture. `scopeCss` is applied to #theme-scope; `componentCss` replaces the bundle's CSS. */
async function open(
  component: string,
  fixture: string,
  opts: { scopeCss?: string; componentCss?: string; extraCss?: string } = {},
): Promise<PageLike> {
  const b = await bundle(component, fixture)
  const page = await browser!.newPage({ viewport: { width: 720, height: 480 } })
  const html = buildHtml({
    tokensCss: tokensCss(),
    themeCss: themeCss(),
    componentCss: (opts.componentCss ?? b.css) + `\n#theme-scope { ${opts.scopeCss ?? ""} }\n${opts.extraCss ?? ""}`,
    bundleJs: b.js,
    themeClass: `${THEME}-theme`,
    mode: "light",
  })
  await page.setContent(html, { waitUntil: "load" })
  await page.waitForFunction("document.getElementById('root') && document.getElementById('root').childElementCount > 0", undefined, { timeout: 10000 })
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }" })
  return page
}

/**
 * Widest resting edge anywhere under #root, in px: the host outline, the
 * ::after outline, and any border that carries colour. Width is read raw — a
 * transparent edge still counts, because the switch has to zero the width.
 */
const REST_EDGE = `(function () {
  var widest = 0;
  var read = function (cs) { return cs.outlineStyle === "none" ? 0 : parseFloat(cs.outlineWidth) || 0; };
  var visible = function (c) { return c !== "transparent" && !/rgba\\([^)]*,\\s*0\\)$/.test(c); };
  var els = document.querySelectorAll("#root *");
  for (var i = 0; i < els.length; i++) {
    var cs = getComputedStyle(els[i]);
    widest = Math.max(widest, read(cs), read(getComputedStyle(els[i], "::after")));
    ["Top", "Right", "Bottom", "Left"].forEach(function (s) {
      if (cs["border" + s + "Style"] !== "none" && visible(cs["border" + s + "Color"])) {
        widest = Math.max(widest, parseFloat(cs["border" + s + "Width"]) || 0);
      }
    });
  }
  return widest;
})()`

const RECTS = `JSON.stringify([].map.call(document.querySelectorAll("#root *"), function (el) {
  var r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height];
}))`

const SHOT = { clip: { x: 0, y: 0, width: 720, height: 480 } }
const OFF = "--control-edge-width: 0;"

beforeAll(async () => {
  for (const mod of ["playwright", "@playwright/test"]) {
    try {
      const { chromium } = (await import(mod)) as { chromium: { launch: () => Promise<BrowserLike> } }
      browser = await chromium.launch()
      esbuild = (await import("esbuild")) as unknown as typeof esbuild
      break
    } catch {
      browser = null // chromium or esbuild not installed — tests self-skip below
    }
  }
}, 60_000)

afterAll(async () => {
  if (browser) await browser.close()
})

describe("VI-655 — one switch turns every form-control edge off (real browser)", () => {
  describe("the switch", () => {
    // Invalid fixtures are excluded: invalid is a state edge, drawn at
    // --control-state-edge-width on purpose, and is covered below.
    for (const { component, fixture, id } of ALL_FIXTURES.filter((f) => f.fixture !== "invalid")) {
      it(`${id}: --control-edge-width: 0 zeroes every resting edge`, async (ctx) => {
        if (!browser) return ctx.skip()
        const on = await open(component, fixture)
        const onEdge = (await on.evaluate(REST_EDGE)) as number
        await on.close()
        if (EDGED.has(id)) expect(onEdge, `${id} should draw an edge with the switch on`).toBeGreaterThan(0)

        const off = await open(component, fixture, { scopeCss: OFF })
        expect(await off.evaluate(REST_EDGE)).toBe(0)
        await off.close()
      }, 30_000)
    }

    // Mutation control: take the switch out of ONE component's CSS and that
    // component — and only that one — keeps its edge with the switch off.
    for (const component of COMPONENTS) {
      it(`${component}: mutation control — without the token its edge survives the switch`, async (ctx) => {
        if (!browser) return ctx.skip()
        const fixture = Object.keys(FIXTURES[component]).find((f) => EDGED.has(`${component}/${f}`)) ?? "default"
        const b = await bundle(component, fixture)
        const mutated = b.css.replaceAll("--control-edge-width", "--control-edge-width-mutated")
        expect(mutated, `${component} CSS must read --control-edge-width`).not.toBe(b.css)

        const page = await open(component, fixture, { scopeCss: OFF, componentCss: mutated })
        expect(await page.evaluate(REST_EDGE)).toBeGreaterThan(0)
        await page.close()
      }, 30_000)
    }
  })

  describe("no border does the work", () => {
    for (const { component, fixture, id } of ALL_FIXTURES) {
      it(`${id}: a border-color: transparent !important host rule changes nothing`, async (ctx) => {
        if (!browser) return ctx.skip()
        const plain = await open(component, fixture)
        const before = await plain.screenshot(SHOT)
        await plain.close()
        const hammered = await open(component, fixture, {
          extraCss: "*, *::before, *::after { border-color: transparent !important; }",
        })
        const after = await hammered.screenshot(SHOT)
        await hammered.close()
        expect(Buffer.compare(before, after)).toBe(0)
      }, 30_000)
    }

    it("mutation control — an edge drawn with a coloured border IS caught", async (ctx) => {
      if (!browser) return ctx.skip()
      const css = (await bundle("input", "default")).css + "\n#root input { border-color: rgb(255, 0, 0); }"
      const plain = await open("input", "default", { componentCss: css })
      const before = await plain.screenshot(SHOT)
      await plain.close()
      const hammered = await open("input", "default", {
        componentCss: css,
        extraCss: "*, *::before, *::after { border-color: transparent !important; }",
      })
      const after = await hammered.screenshot(SHOT)
      await hammered.close()
      expect(Buffer.compare(before, after)).not.toBe(0)
    }, 30_000)
  })

  describe("no layout shift", () => {
    for (const { component, fixture, id } of ALL_FIXTURES) {
      it(`${id}: every box is identical with the switch on and off`, async (ctx) => {
        if (!browser) return ctx.skip()
        const on = await open(component, fixture)
        const onRects = await on.evaluate(RECTS)
        await on.close()
        const off = await open(component, fixture, { scopeCss: OFF })
        const offRects = await off.evaluate(RECTS)
        await off.close()
        expect(offRects).toBe(onRects)
      }, 30_000)
    }

    it("mutation control — an edge whose width takes layout space IS caught", async (ctx) => {
      if (!browser) return ctx.skip()
      const css = (await bundle("input", "default")).css + "\n#root input { border-width: var(--control-edge-width, 1px); }"
      const on = await open("input", "default", { componentCss: css })
      const onRects = await on.evaluate(RECTS)
      await on.close()
      const off = await open("input", "default", { componentCss: css, scopeCss: OFF })
      const offRects = await off.evaluate(RECTS)
      await off.close()
      expect(offRects).not.toBe(onRects)
    }, 30_000)
  })

  describe("focus and invalid survive the switch", () => {
    // Invalid fixtures are excluded: on select / checkbox / switch / textarea the
    // invalid ring already out-cascades the focus ring on main, with edges on or
    // off — a pre-existing gap the edge switch neither causes nor changes.
    const focusable = ALL_FIXTURES.filter(
      ({ component, fixture }) => fixture !== "invalid" && FIXTURES[component][fixture].interactiveTarget,
    )
    for (const { component, fixture, id } of focusable) {
      it(`${id}: focus still draws a visible ring at --control-edge-width: 0`, async (ctx) => {
        if (!browser) return ctx.skip()
        const target = FIXTURES[component][fixture].interactiveTarget!
        const page = await open(component, fixture, { scopeCss: OFF })
        const rest = await page.screenshot(SHOT)
        await page.evaluate(`document.querySelector(${JSON.stringify(`#root ${target}`)}).focus()`)
        const focused = await page.screenshot(SHOT)
        await page.close()
        expect(Buffer.compare(rest, focused)).not.toBe(0)
      }, 30_000)
    }

    for (const component of ["input", "textarea", "select", "checkbox", "switch"]) {
      it(`${component}: invalid still draws a visible ring at --control-edge-width: 0`, async (ctx) => {
        if (!browser) return ctx.skip()
        const page = await open(component, "invalid", { scopeCss: OFF })
        const invalid = await page.screenshot(SHOT)
        await page.evaluate(`document.querySelector("#root [aria-invalid]").removeAttribute("aria-invalid")`)
        const valid = await page.screenshot(SHOT)
        await page.close()
        expect(Buffer.compare(invalid, valid)).not.toBe(0)
      }, 30_000)
    }

    it("checkbox: an unchecked box still reads as a box with edges off", async (ctx) => {
      if (!browser) return ctx.skip()
      const page = await open("checkbox", "default", { scopeCss: OFF })
      const shown = await page.screenshot(SHOT)
      await page.evaluate(`document.querySelector("#root button").style.visibility = "hidden"`)
      const hidden = await page.screenshot(SHOT)
      await page.close()
      expect(Buffer.compare(shown, hidden)).not.toBe(0)
    }, 30_000)
  })

  describe("dashed edges", () => {
    for (const id of DASHED) {
      const [component, fixture] = id.split("/")
      it(`${id}: --control-drop-edge-width brings the dashed edge back while solid edges stay off`, async (ctx) => {
        if (!browser) return ctx.skip()
        const page = await open(component, fixture, { scopeCss: `${OFF} --control-drop-edge-width: 1px;` })
        expect(await page.evaluate(REST_EDGE)).toBeGreaterThan(0)
        await page.close()
      }, 30_000)
    }

    it("input: --control-drop-edge-width does not bring solid edges back", async (ctx) => {
      if (!browser) return ctx.skip()
      const page = await open("input", "default", { scopeCss: `${OFF} --control-drop-edge-width: 1px;` })
      expect(await page.evaluate(REST_EDGE)).toBe(0)
      await page.close()
    }, 30_000)
  })
})

// Keep the fixture list honest: every governed component has a fixture.
describe("VI-655 fixture coverage", () => {
  it("registers a visor render fixture for every governed component", () => {
    for (const c of COMPONENTS) expect(FIXTURES[c], `missing FIXTURES.${c}`).toBeTruthy()
  })
})
