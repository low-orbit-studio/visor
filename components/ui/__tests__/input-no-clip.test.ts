// @vitest-environment node
/**
 * VI-662 — a native input must never clip descenders or accents.
 *
 * `text-box: trim-both cap alphabetic` on a native <input> shrinks its inner box
 * to the capital band and the input clips its content to that box, so "jpq" lose
 * their tails and "ÉÅÑ" their accents. This renders the affixed Input and
 * NumberInput with "Typography jpq ÉÅÑ" in Chromium and WebKit and compares the
 * ink height of the typed value against an unclipped <span> in the same font.
 * The mutation control re-adds the trim and must fail.
 *
 * Skips where an engine or esbuild is missing.
 */
import { existsSync, readFileSync } from "node:fs"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { buildHtml, resolveResetCssFile, resolveThemeCssFile, resolveTokensCssFile } from "../../../packages/cli/src/commands/render"
import { bundle, close, launch, ready } from "./render-page"

const TEXTS: Record<string, string> = { input: "Typography jpq ÉÅÑ", "number-input": "jpqÉÅÑ" } // NumberInput's field is 4rem wide
const DSF = 4
const TRIM = "input{text-box:trim-both cap alphabetic!important}"
const CASES = [
  { id: "input/default (plain)", component: "input", fixture: "default", numeric: false },
  { id: "input/descenders", component: "input", fixture: "descenders", numeric: false },
  { id: "number-input/descenders", component: "number-input", fixture: "descenders", numeric: true },
]

type Engine = "chromium" | "webkit"
type Page = {
  setContent(h: string, o: object): Promise<void>
  evaluate(e: string): Promise<unknown>
  screenshot(o: object): Promise<Buffer>
  waitForFunction(e: string, a?: unknown, o?: object): Promise<unknown>
}
const browsers = new Map<Engine, { newContext(o: object): Promise<{ newPage(): Promise<Page>; close(): Promise<void> }>; close(): Promise<void> }>()
const R = process.cwd()

beforeAll(async () => {
  if (!(await launch())) return
  const pw = (await import("playwright")) as unknown as Record<Engine, { executablePath(): string; launch(): Promise<never> }>
  for (const e of ["chromium", "webkit"] as Engine[]) {
    try {
      if (existsSync(pw[e].executablePath())) browsers.set(e, (await pw[e].launch()) as never)
    } catch {
      /* engine unavailable */
    }
  }
}, 60_000)
afterAll(async () => {
  for (const b of browsers.values()) await b.close()
  await close()
})

/** Ink height (device px) of the typed value and of an unclipped reference span. */
async function inkHeights(engine: Engine, c: (typeof CASES)[number], extraCss = ""): Promise<{ value: number; ref: number }> {
  const b = await bundle(c.component, c.fixture)
  const html = buildHtml({
    resetCss: readFileSync(resolveResetCssFile(R)!, "utf-8"),
    tokensCss: readFileSync(resolveTokensCssFile(R)!, "utf-8"),
    themeCss: readFileSync(resolveThemeCssFile(R, "neutral")!, "utf-8"),
    componentCss: b.css + `\n*{transition:none!important;animation:none!important;caret-color:transparent!important}\n${extraCss}`,
    bundleJs: b.js,
    themeClass: "neutral-theme",
    mode: "light",
  })
  const ctx = await browsers.get(engine)!.newContext({ viewport: { width: 720, height: 480 }, deviceScaleFactor: DSF })
  const page = await ctx.newPage()
  await page.setContent(html, { waitUntil: "load" })
  await page.waitForFunction("document.querySelector('#root input')")
  await page.evaluate("document.fonts.ready.then(function(){return true})")
  // Put the text in the input without going through React (NumberInput only accepts numbers).
  await page.evaluate(`(function(){var i=document.querySelector("#root input");var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;set.call(i,${JSON.stringify(TEXTS[c.component])});
    var cs=getComputedStyle(i);var r=document.createElement("div");r.id="ref";r.textContent=${JSON.stringify(TEXTS[c.component])};
    r.style.cssText="position:absolute;left:24px;top:300px;white-space:nowrap;background:"+getComputedStyle(i.parentElement).backgroundColor+";color:"+cs.color+";font:"+cs.font+";text-align:left";
    document.body.appendChild(r);})()`)
  const boxes = JSON.parse((await page.evaluate(`JSON.stringify((function(){var i=document.querySelector("#root input").getBoundingClientRect(),r=document.getElementById("ref").getBoundingClientRect();
    var cs=getComputedStyle(document.querySelector("#root input"));
    return {i:{x:i.x+parseFloat(cs.paddingLeft)+3,y:i.y+3,w:Math.min(i.width-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-6,r.width),h:i.height-6},r:{x:r.x,y:r.y-4,w:r.width,h:r.height+8}}})())`)) as string)
  const shot = (await page.screenshot({ fullPage: true })) as Buffer
  const rows = (await page.evaluate(`(async function(){var img=new Image();img.src="data:image/png;base64,${shot.toString("base64")}";await img.decode();
    var cv=document.createElement("canvas");cv.width=img.width;cv.height=img.height;var cx=cv.getContext("2d");cx.drawImage(img,0,0);
    function ink(b){var x0=Math.round(b.x*${DSF}),y0=Math.round(b.y*${DSF}),w=Math.round(b.w*${DSF}),h=Math.round(b.h*${DSF});var d=cx.getImageData(x0,y0,w,h).data;
      var bg=[d[0],d[1],d[2]],first=-1,last=-1;
      for(var y=0;y<h;y++){var hit=false;for(var x=0;x<w;x++){var i=(y*w+x)*4;if(Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2])>96){hit=true;break}}
        if(hit){if(first<0)first=y;last=y}}
      return first<0?0:last-first+1}
    return JSON.stringify({value:ink(${JSON.stringify(boxes.i)}),ref:ink(${JSON.stringify(boxes.r)})})})()`)) as string
  await ctx.close()
  return JSON.parse(rows)
}

for (const engine of ["chromium", "webkit"] as Engine[]) {
  describe(`VI-662 no-clip (${engine})`, () => {
    for (const c of CASES) {
      it(`${c.id}: descenders and accents are intact`, { timeout: 60_000 }, async (ctx) => {
        if (!ready() || !browsers.has(engine)) return ctx.skip()
        const { value, ref } = await inkHeights(engine, c)
        expect(ref).toBeGreaterThan(20)
        // an unclipped value is as tall as the reference ink, within half a CSS px
        expect(value).toBeGreaterThanOrEqual(ref - DSF / 2)
      })
      it(`${c.id}: mutation control, re-adding the trim clips it`, { timeout: 60_000 }, async (ctx) => {
        if (!ready() || !browsers.has(engine)) return ctx.skip()
        if (engine === "webkit") return ctx.skip() // WebKit does not trim a native input yet, so there is nothing to re-add
        const { value, ref } = await inkHeights(engine, c, TRIM)
        expect(value).toBeLessThan(ref - DSF / 2)
      })
    }
  })
}
