/** Prints the no-clip measurement for every control (VI-684). INK_BROWSER=webkit for WebKit. Usage: npx tsx scripts/ink-clip-report.ts */
import { measureClipping } from "../components/ui/__tests__/ink-clipping"
import { FONT_SCENARIOS, withScenario } from "../components/ui/__tests__/ink-fonts"
import { buildControls, CLIP_LABEL } from "./ink-controls"

async function main() {
  const controls = buildControls(CLIP_LABEL, true)
  for (const [i, s] of FONT_SCENARIOS.entries()) {
    if (process.env.INK_SCENARIO && Number(process.env.INK_SCENARIO) !== i) continue
    const res = await measureClipping({ ...withScenario(s, controls), label: CLIP_LABEL, extraCss: s.extraCss + (process.env.INK_EXTRA ?? ""), browser: process.env.INK_BROWSER === "webkit" ? "webkit" : "chromium", dsf: Number(process.env.INK_DSF ?? 4) })
    console.log(`\n${s.name}`)
    for (const r of res) console.log(`${r.id.padEnd(24)} extent short ${r.extentGap.toFixed(2).padStart(6)}px   ink lost ${(r.areaLoss * 100).toFixed(1).padStart(5)}%`)
  }
}
main()
