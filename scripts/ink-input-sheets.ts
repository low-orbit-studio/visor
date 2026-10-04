/**
 * VI-684 — plain Input sm, md and lg on the real shipped themes, each with a
 * "HEHTI" row (measured) and a "Typography jpq ÉÅÑ" row (no clipping), a centre
 * guide through each box and the measured cap-centre offset in a caption.
 * Usage: npx tsx scripts/ink-input-sheets.ts <out-dir>
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { measureInk } from "../components/ui/__tests__/ink-centering"
import { CLIP_LABEL } from "./ink-controls"

const out = process.argv[2] ?? "input-sheets"
mkdirSync(out, { recursive: true })
const SHEETS = [
  { file: "neutral-light", theme: "neutral", mode: "light" as const },
  { file: "blackout-dark", theme: "blackout", mode: "dark" as const },
  { file: "blacklight-app-dark", theme: "blacklight-app", mode: "dark" as const },
  { file: "modern-minimal-dark", theme: "modern-minimal", mode: "dark" as const },
  { file: "space-dark", theme: "space", mode: "dark" as const },
]
const SIZES = ["sm", "md", "lg"]
const cases = (label: string, tag: string) => SIZES.map((s) => ({ id: `input ${s} ${tag}`, selector: "input", jsx: `React.createElement(C.Input, { size: "${s}", defaultValue: ${JSON.stringify(label)} })` }))

async function main() {
  for (const sheet of SHEETS) {
    const spec = { theme: sheet.theme, mode: sheet.mode, dsf: 4, modules: { input: ["Input"] }, cases: [...cases("HEHTI", "cap"), ...cases(CLIP_LABEL, "jpq")] }
    const ink = sheet.mode === "dark" ? "#e5e5e5" : "#1f1f1f"
    let captions: Record<string, string> = {}
    const first = await measureInk({ ...spec, cases: cases("HEHTI", "cap") })
    for (const r of first) {
      const sz = r.id.split(" ")[1]
      const c = `${sz} · ${r.offset >= 0 ? "+" : "−"}${Math.abs(r.offset).toFixed(2)}px`
      captions[r.id] = c
      captions[`input ${sz} jpq`] = c + " · jpq"
    }
    await measureInk({
      ...spec,
      onPage: async (page, rects) => {
        await page.evaluate(`(() => { const CAPTIONS = ${JSON.stringify(captions)}; for (const r of ${JSON.stringify(rects)}) {
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
        for (const r of rects.filter((q) => q.id.endsWith("cap") || q.id.endsWith("jpq"))) {
          await page.screenshot({ fullPage: true, clip: { x: r.x - 6, y: r.y - 6, width: Math.min(r.w, 150) + 12, height: r.h + 12 }, path: join(out, `${sheet.file}-zoom-${r.id.replace(/ /g, "-")}.png`) })
        }
        await page.evaluate(`document.querySelectorAll("[data-guide]").forEach(g => g.remove())`)
      },
    })
    writeFileSync(join(out, `${sheet.file}.txt`), Object.values(captions).join("\n") + "\n")
    console.log(sheet.file, first.map((r) => `${r.id.split(" ")[1]} ${r.offset.toFixed(2)}`).join("  "))
  }
}
main()
