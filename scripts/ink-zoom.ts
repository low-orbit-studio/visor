/**
 * VI-684 — zoomed contact sheets of the fixed-height controls with a centre
 * guide through each box, plus the measured offset for every control.
 * Usage: npx tsx scripts/ink-zoom.ts <out-dir>
 * The guide is the vertical centre of the control's own box; capitals should
 * straddle it (cap top and baseline equidistant above and below).
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { measureInk, type InkResult } from "../components/ui/__tests__/ink-centering"
import { FONT_SCENARIOS, withScenario } from "../components/ui/__tests__/ink-fonts"
import { CONTROLS } from "./ink-controls"

const out = process.argv[2] ?? "ink-zoom"
mkdirSync(out, { recursive: true })

const SHEETS = [
  { file: "modern-minimal-dark", scenario: 1, mode: "dark" as const },
  { file: "blacklight-app-dark", scenario: -1, mode: "dark" as const },
  { file: "neutral-light", scenario: 0, mode: "light" as const },
]

async function main() {
  for (const sheet of SHEETS) {
    const spec = withScenario(sheet.scenario < 0 ? { name: "blacklight-app", theme: "blacklight-app", extraCss: "" } : FONT_SCENARIOS[sheet.scenario], CONTROLS)
    // Pass 1 measures; pass 2 re-renders the same page with a guide and a caption per control.
    const measured = await measureInk({ ...spec, mode: sheet.mode, dsf: 4 })
    const caption = (id: string) => {
      const r = measured.find((m) => m.id === id) as InkResult
      return `${id} · ${r.offset >= 0 ? "+" : "\u2212"}${Math.abs(r.offset).toFixed(2)}px`
    }
    const ink = sheet.mode === "dark" ? "#e5e5e5" : "#1f1f1f"
    const res = await measureInk({
      ...spec,
      mode: sheet.mode,
      dsf: 4,
      extraCss: spec.extraCss,
      onPage: async (page, rects) => {
        await page.evaluate(`(() => { const CAPTIONS = ${JSON.stringify(Object.fromEntries(measured.map((m) => [m.id, caption(m.id)])))}; for (const r of ${JSON.stringify(rects)}) {
          const g = document.createElement("div"); g.setAttribute("data-guide", "");
          g.style.cssText = "position:absolute;pointer-events:none;height:0.5px;background:#ff00cc;z-index:99999;left:" + (r.x - 4) + "px;top:" + (r.y + r.h / 2 - 0.25) + "px;width:" + (r.w + 8) + "px";
          document.body.appendChild(g);
          const c = document.createElement("div"); c.setAttribute("data-guide", ""); c.textContent = CAPTIONS[r.id];
          c.style.cssText = "position:absolute;pointer-events:none;white-space:nowrap;font:600 12px/16px ui-monospace,Menlo,monospace;color:${ink};left:" + r.x + "px;top:" + (r.y + r.h + 6) + "px";
          document.body.appendChild(c);
        } })()`)
        const x0 = Math.min(...rects.map((r) => r.x)) - 12, y0 = Math.min(...rects.map((r) => r.y)) - 12
        const x1 = Math.max(...rects.map((r) => r.x + Math.max(r.w, 230))) + 12, y1 = Math.max(...rects.map((r) => r.y + r.h)) + 36
        await page.screenshot({ fullPage: true, clip: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }, path: join(out, `${sheet.file}.png`) })
        await page.evaluate(`document.querySelectorAll("[data-guide]").forEach(g => g.remove())`)
      },
    })
    const lines = res.map((r) => `${r.id.padEnd(24)} ${r.width.toFixed(1)}x${r.height.toFixed(1)}  offset ${r.offset >= 0 ? "+" : ""}${r.offset.toFixed(3)}`)
    writeFileSync(join(out, `${sheet.file}.txt`), lines.join("\n") + "\n")
    console.log(`${sheet.file}\n${lines.join("\n")}`)
  }
}
main()
