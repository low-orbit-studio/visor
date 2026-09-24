/**
 * Real-browser page harness for component tests (VI-655, VI-656).
 *
 * Bundles a component with one of its `visor render` fixtures exactly the way
 * `visor render` does, loads it in Chromium against the real tokens and theme
 * CSS, and hands back the page. Chromium and esbuild are optional deps, so
 * `launch()` resolves to false where they are missing and callers self-skip.
 */

import { readFileSync } from "node:fs"
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
export const THEME = "neutral"

export interface Bundle { css: string; js: string }
export interface PageLike {
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

/** Launch Chromium. Resolves false when playwright or esbuild is not installed. */
export async function launch(): Promise<boolean> {
  for (const mod of ["playwright", "@playwright/test"]) {
    try {
      const { chromium } = (await import(mod)) as { chromium: { launch: () => Promise<BrowserLike> } }
      browser = await chromium.launch()
      esbuild = (await import("esbuild")) as unknown as typeof esbuild
      return true
    } catch {
      browser = null
    }
  }
  return false
}

export async function close(): Promise<void> {
  if (browser) await browser.close()
  browser = null
}

export const ready = (): boolean => browser !== null

const tokensCss = () => readFileSync(resolveTokensCssFile(REPO_ROOT)!, "utf-8")
const themeCss = () => readFileSync(resolveThemeCssFile(REPO_ROOT, THEME)!, "utf-8")

/** The bundled CSS and JS of one fixture, cached per fixture. */
export async function bundle(component: string, fixture: string): Promise<Bundle> {
  const key = `${component}/${fixture}`
  const cached = bundles.get(key)
  if (cached) return cached
  const spec = FIXTURES[component][fixture]
  const result = await esbuild!.build({
    stdin: {
      contents: buildEntrySource(resolveComponentFile(REPO_ROOT, component)!, spec, spec.export ?? pascalCase(component)),
      resolveDir: REPO_ROOT,
      loader: "tsx",
      sourcefile: "render-page-entry.tsx",
    },
    bundle: true,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    write: false,
    outdir: "render-page-out",
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

/**
 * Open a fixture with transitions and animations off. `scopeCss` is applied to
 * #theme-scope, the element the theme class sits on; `componentCss` replaces
 * the bundle's CSS; `extraCss` is appended after it.
 */
export async function open(
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
  // Pixel comparisons between two loads race a late web font under load.
  await page.evaluate("document.fonts.ready.then(function () { return true })")
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }" })
  return page
}

/**
 * Compare two PNG screenshots in the browser (no image dependency): how many
 * pixels differ, and the largest per-channel difference out of 255. Chromium
 * re-rasterises rounded corners with ±1/255 jitter when pages render
 * concurrently, so "nothing visible changed" is `max <= 2`, not byte equality.
 */
export async function pixelDelta(a: Buffer, b: Buffer): Promise<{ n: number; max: number }> {
  const page = await browser!.newPage()
  const result = (await page.evaluate(`(async function () {
    async function decode(b64) {
      var img = await createImageBitmap(await (await fetch("data:image/png;base64," + b64)).blob());
      var c = new OffscreenCanvas(img.width, img.height), x = c.getContext("2d");
      x.drawImage(img, 0, 0);
      return { w: img.width, h: img.height, d: x.getImageData(0, 0, img.width, img.height).data };
    }
    var A = await decode(${JSON.stringify(a.toString("base64"))}), B = await decode(${JSON.stringify(b.toString("base64"))});
    if (A.w !== B.w || A.h !== B.h) return { n: A.w * A.h, max: 255 };
    var n = 0, max = 0;
    for (var i = 0; i < A.d.length; i += 4) {
      var d = 0;
      for (var k = 0; k < 4; k++) d = Math.max(d, Math.abs(A.d[i + k] - B.d[i + k]));
      if (d) { n++; if (d > max) max = d; }
    }
    return { n: n, max: max };
  })()`)) as { n: number; max: number }
  await page.close()
  return result
}

/**
 * Widest resting edge anywhere under #root, in px: the host outline, the
 * ::after outline, and any border that carries colour. Width is read raw — a
 * transparent edge still counts, because the switch has to zero the width.
 */
export const REST_EDGE = `(function () {
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
