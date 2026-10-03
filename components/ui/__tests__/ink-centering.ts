/**
 * Optical-centering measurement for fixed-height, single-line controls (VI-682).
 *
 * Flexbox centres a control's line box, which comes from the font's ascent and
 * descent, not from where its capitals sit, so a label lands high or low by an
 * amount that differs per font. This measures it on pixels: it renders each case
 * at a high deviceScaleFactor, screenshots a full-page (never an element, whose
 * clip can round the box up), clips to the control's exact bounding rect, and
 * reads the first and last ink rows of a flat-topped, descender-free label.
 *
 *   offset = (gap above cap-ink - gap below baseline) / 2   in CSS px
 *
 * Positive = the label sits LOW, negative = HIGH. 0 is optically centred.
 */

import { readFileSync } from "node:fs"
import { buildHtml, resolveComponentFile, resolveResetCssFile, resolveThemeCssFile, resolveTokensCssFile } from "../../../packages/cli/src/commands/render"

const ROOT = process.cwd()

/** A control to measure: JSX source (React in scope, `M` = the component module map). */
export interface InkCase {
  id: string
  /** JS expression evaluating to a React element. `C.<name>` resolves to the named export of `modules`. */
  jsx: string
  /** CSS selector, inside the case wrapper, of the control to measure (default: the first child). */
  selector?: string
}
export interface InkResult {
  id: string
  width: number
  height: number
  offset: number
  topGap: number
  bottomGap: number
  font: string
}

export interface MeasureOptions {
  /** Theme slug whose real CSS is loaded (default neutral). */
  theme?: string
  /** Extra CSS appended last (font faces, scope overrides). */
  extraCss?: string
  /** component dir name -> exported names are exposed on `C` (e.g. { button: "Button" }). */
  modules: Record<string, string[]>
  cases: InkCase[]
  mode?: "light" | "dark"
  /** Browser engine (default chromium). */
  browser?: "chromium" | "webkit"
  /** deviceScaleFactor (default 4). */
  dsf?: number
}

export async function measureInk(opts: MeasureOptions): Promise<InkResult[]> {
  const esbuild: any = await import("esbuild")
  const pw = (await import("playwright")) as any
  const chromium = pw[opts.browser ?? "chromium"]
  const DSF = opts.dsf ?? 4
  const theme = opts.theme ?? "neutral"
  const mode = opts.mode ?? "light"

  const imports = Object.entries(opts.modules).map(([dir, names], i) => {
    const file = resolveComponentFile(ROOT, dir) as string
    return `import { ${names.join(", ")} } from ${JSON.stringify(file)};`
  })
  const exposed = Object.values(opts.modules).flat().join(", ")
  const entry = `import * as React from "react";
import { createRoot } from "react-dom/client";
${imports.join("\n")}
const C = { ${exposed} };
const cases = [${opts.cases.map((c) => `{ id: ${JSON.stringify(c.id)}, el: (${c.jsx}) }`).join(",\n")}];
createRoot(document.getElementById("root")).render(
  React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 24 } },
    cases.map((c) => React.createElement("div", { key: c.id, "data-case": c.id, style: { display: "inline-block" } }, c.el))));`
  const built = await esbuild.build({
    stdin: { contents: entry, resolveDir: ROOT, loader: "tsx", sourcefile: "ink-entry.tsx" },
    bundle: true, format: "iife", platform: "browser", jsx: "automatic", write: false, outdir: "ink-out",
    define: { "process.env.NODE_ENV": '"production"' },
    banner: { js: "globalThis.process = globalThis.process || { env: {} };" },
    logLevel: "silent",
  })
  let css = ""
  let js = ""
  for (const f of built.outputFiles ?? []) {
    if (f.path.endsWith(".css")) css += f.text
    else if (f.path.endsWith(".js")) js += f.text
  }
  const html = buildHtml({
    resetCss: readFileSync(resolveResetCssFile(ROOT)!, "utf-8"),
    tokensCss: readFileSync(resolveTokensCssFile(ROOT)!, "utf-8"),
    themeCss: readFileSync(resolveThemeCssFile(ROOT, theme)!, "utf-8"),
    componentCss: css + "\n" + (opts.extraCss ?? "") +
      "\n#theme-scope{display:block;min-height:0;padding:24px;align-items:initial}#root{max-width:none}" +
      "\n*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}",
    bundleJs: js,
    themeClass: `${theme}-theme`,
    mode,
  })

  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ viewport: { width: 900, height: 1400 }, deviceScaleFactor: DSF, colorScheme: mode })
    const page = await context.newPage()
    await page.setContent(html, { waitUntil: "load" })
    await page.waitForFunction(`document.querySelectorAll("[data-case]").length === ${opts.cases.length} && [...document.querySelectorAll("[data-case]")].every(e => e.firstElementChild)`, undefined, { timeout: 10000 })
    await page.evaluate("document.fonts.ready.then(function () { return true })")
    // Fonts are requested lazily, on first use; settle once more after layout.
    await page.evaluate("new Promise(r => setTimeout(r, 400)).then(() => document.fonts.ready).then(() => true)")

    const rects = (await page.evaluate(`JSON.stringify([...document.querySelectorAll("[data-case]")].map(w => {
      const sel = ${JSON.stringify(Object.fromEntries(opts.cases.map((c) => [c.id, c.selector ?? null])))}[w.getAttribute("data-case")]; const el = sel ? w.querySelector(sel) : w.firstElementChild; const r = el.getBoundingClientRect();
      return { id: w.getAttribute("data-case"), x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height, font: getComputedStyle(el).fontFamily };
    }))`)) as string
    const list = JSON.parse(rects) as Array<{ id: string; x: number; y: number; w: number; h: number; font: string }>

    const png = (await page.screenshot({ fullPage: true })) as Buffer
    const b64 = png.toString("base64")
    const out: InkResult[] = []
    // Decode in the browser (no image dependency): canvas + getImageData.
    const analysis = (await page.evaluate(
      `(async () => {
        const img = new Image(); img.src = "data:image/png;base64,${b64}"; await img.decode();
        const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
        const cx = cv.getContext("2d"); cx.drawImage(img, 0, 0);
        const D = ${DSF}; const res = {};
        for (const r of ${JSON.stringify(list)}) {
          // Exact bounding rect, in device pixels. Scan inset 2px top/bottom, 8px sides (edge + corner radius).
          const x0 = Math.round((r.x + 8) * D), x1 = Math.round((r.x + r.w - 8) * D);
          const y0 = Math.round(r.y * D), y1 = Math.round((r.y + r.h) * D);
          const sx = Math.max(x1 - x0, 1);
          const data = cx.getImageData(x0, y0, sx, y1 - y0).data;
          const rowPx = (row, col) => { const i = (row * sx + col) * 4; return [data[i], data[i+1], data[i+2]]; };
          const rows = y1 - y0;
          const bg = rowPx(Math.floor(rows / 2), 0);
          const dist = (p) => Math.abs(p[0]-bg[0]) + Math.abs(p[1]-bg[1]) + Math.abs(p[2]-bg[2]);
          const inset = Math.round(1.25 * D);
          // Per-row peak contrast, then sub-device-pixel edges from the edge rows' coverage.
          const peak = []; let full = 0;
          for (let row = inset; row < rows - inset; row++) {
            let m = 0;
            for (let col = 0; col < sx; col++) { const d = dist(rowPx(row, col)); if (d > m) m = d; }
            peak[row] = m; if (m > full) full = m;
          }
          let first = -1, last = -1;
          for (let row = inset; row < rows - inset; row++) {
            if (peak[row] > full * 0.5) { if (first < 0) first = row; last = row; }
          }
          const covTop = Math.min(peak[first] / full, 1), covBot = Math.min(peak[last] / full, 1);
          const edgeTop = first + (1 - covTop) + 0, edgeBot = last + covBot;
          first = edgeTop; last = edgeBot - 1;
          res[r.id] = { first, last, rows };
        }
        return JSON.stringify(res);
      })()`,
    )) as string
    const parsed = JSON.parse(analysis) as Record<string, { first: number; last: number; rows: number }>
    for (const r of list) {
      const a = parsed[r.id]
      const topGap = a.first / DSF
      const bottomGap = (a.rows - 1 - a.last) / DSF
      out.push({ id: r.id, width: r.w, height: r.h, topGap, bottomGap, offset: (topGap - bottomGap) / 2, font: r.font })
    }
    return out
  } finally {
    await browser.close()
  }
}
