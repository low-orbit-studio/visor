/**
 * VI-684 — zoomed contact sheets of the fixed-height controls with a centre
 * guide through each box, plus the measured offset for every control.
 * Usage: npx tsx scripts/ink-zoom.ts <out-dir>
 * The guide is the vertical centre of the control's own box; capitals should
 * straddle it (cap top and baseline equidistant above and below).
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { measureInk } from "../components/ui/__tests__/ink-centering"
import { FONT_SCENARIOS, withScenario } from "../components/ui/__tests__/ink-fonts"
import { CONTROLS } from "./ink-controls"

const out = process.argv[2] ?? "ink-zoom"
mkdirSync(out, { recursive: true })

const SHEETS = [
  { file: "modern-minimal-dark", scenario: 1, mode: "dark" as const },
  { file: "pp-model-mono-dark", scenario: 2, mode: "dark" as const },
  { file: "neutral-light", scenario: 0, mode: "light" as const },
]

async function main() {
  for (const sheet of SHEETS) {
    const spec = withScenario(FONT_SCENARIOS[sheet.scenario], CONTROLS)
    const res = await measureInk({
      ...spec,
      mode: sheet.mode,
      dsf: 4,
      extraCss: spec.extraCss,
      onPage: async (page, rects) => {
        await page.evaluate(`(() => { for (const r of ${JSON.stringify(rects)}) {
          const g = document.createElement("div"); g.setAttribute("data-guide", "");
          g.style.cssText = "position:absolute;pointer-events:none;height:0.5px;background:#ff00cc;z-index:99999;left:" + (r.x - 4) + "px;top:" + (r.y + r.h / 2 - 0.25) + "px;width:" + (r.w + 8) + "px";
          document.body.appendChild(g);
        } })()`)
        const x0 = Math.min(...rects.map((r) => r.x)) - 8, y0 = Math.min(...rects.map((r) => r.y)) - 8
        const x1 = Math.max(...rects.map((r) => r.x + r.w)) + 8, y1 = Math.max(...rects.map((r) => r.y + r.h)) + 8
        await page.screenshot({ clip: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }, path: join(out, `${sheet.file}.png`) })
        await page.evaluate(`document.querySelectorAll("[data-guide]").forEach(g => g.remove())`)
      },
    })
    const lines = res.map((r) => `${r.id.padEnd(24)} ${r.width.toFixed(1)}x${r.height.toFixed(1)}  offset ${r.offset >= 0 ? "+" : ""}${r.offset.toFixed(3)}`)
    writeFileSync(join(out, `${sheet.file}.txt`), lines.join("\n") + "\n")
    console.log(`${sheet.file}\n${lines.join("\n")}`)
  }
}
main()
