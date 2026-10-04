/**
 * VI-684 — proof that WebKit + Inter + input sm draws all of "Typography jpq ÉÅÑ"
 * (the one case control-ink-clipping.test.ts allows 0.8px extent): a 4x crop of the
 * field with an unclipped reference span of the same text, in the same computed font,
 * beside it, and the measured gap for the real input vs the same input with the trim
 * re-added (a real clip). Usage: npx tsx scripts/ink-clip-proof.ts <out.png>
 */
import { measureClipping } from "../components/ui/__tests__/ink-clipping"
import { measureInk } from "../components/ui/__tests__/ink-centering"
import { FONT_SCENARIOS, withScenario } from "../components/ui/__tests__/ink-fonts"
import { buildControls, CLIP_LABEL } from "./ink-controls"

const out = process.argv[2] ?? "ink-clip-proof.png"
const scenario = FONT_SCENARIOS.find((s) => s.name.startsWith("Inter"))!
const spec = { ...withScenario(scenario, buildControls(CLIP_LABEL, false)), browser: "webkit" as const, dsf: 4 }
const smOnly = { ...spec, cases: spec.cases.filter((c) => c.id === "input sm") }

async function main() {
  await measureInk({
    ...smOnly,
    onPage: async (page, rects) => {
      const r = rects[0]
      await page.evaluate(`(() => { const r = ${JSON.stringify(r)}; const inp = document.querySelector("input"); const cs = getComputedStyle(inp);
        const lab = (t, y) => { const e = document.createElement("div"); e.textContent = t; e.style.cssText = "position:absolute;left:" + r.x + "px;top:" + y + "px;font:12px/16px ui-monospace,Menlo,monospace;white-space:nowrap;color:#1f1f1f"; document.body.append(e) };
        lab("input (WebKit, Inter, sm)", r.y - 22);
        const ref = document.createElement("div"); ref.textContent = ${JSON.stringify(CLIP_LABEL)};
        ref.style.cssText = "position:absolute;left:" + (r.x + 14) + "px;top:" + (r.y + r.h + 40) + "px;white-space:nowrap;font:" + cs.font + ";color:" + cs.color + ";line-height:1.5";
        document.body.append(ref);
        lab("unclipped reference (same text, same computed font)", r.y + r.h + 18) })()`)
      await page.screenshot({ fullPage: true, clip: { x: r.x - 10, y: r.y - 30, width: Math.max(r.w + 20, 420), height: r.h + 110 }, path: out })
    },
  })
  const clipped = (css: string) => measureClipping({ ...smOnly, extraCss: scenario.extraCss + css, label: CLIP_LABEL }).then((r) => r[0])
  for (const [name, css] of [["as shipped", ""], ["bottom 16px clipped (a real clip)", "\ninput{clip-path:inset(0 0 16px 0)!important}"]] as const) {
    const r = await clipped(css)
    console.log(`${name.padEnd(30)} extentGap ${r.extentGap.toFixed(2)}px  areaLoss ${(r.areaLoss * 100).toFixed(1)}%`)
  }
}
main()
