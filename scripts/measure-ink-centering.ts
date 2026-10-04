/**
 * VI-682 — print the optical-centering offset of fixed-height single-line
 * controls per font. Usage: npx tsx scripts/measure-ink-centering.ts [button|controls]
 * Positive offset = label sits low, negative = high (CSS px).
 */
import { measureInk } from "../components/ui/__tests__/ink-centering"
import { FONT_SCENARIOS, withScenario } from "../components/ui/__tests__/ink-fonts"

const LABEL = "HEHTI"
const which = process.argv[2] ?? "button"
const browser = (process.env.INK_BROWSER ?? "chromium") as "chromium" | "webkit"
const dsf = Number(process.env.INK_DSF ?? 4)

const BUTTONS = {
  modules: { button: ["Button"] },
  cases: ["sm", "md", "lg"].map((s) => ({ id: `button ${s}`, jsx: `React.createElement(C.Button, { size: "${s}" }, "${LABEL}")` })),
}

async function main() {
  const rows: string[] = []
  for (const s of FONT_SCENARIOS) {
    const spec = which === "button" ? BUTTONS : which === "affix" ? (await import("./ink-controls")).AFFIX_CONTROLS : (await import("./ink-controls")).CONTROLS
    const sc = withScenario(s, spec)
    const res = await measureInk({ ...sc, extraCss: sc.extraCss + (which === "affix" ? (await import("./ink-controls")).AFFIX_MEASURE_CSS : ""), browser, dsf })
    for (const r of res) rows.push(`${s.name.padEnd(36)} ${r.id.padEnd(22)} ${r.width.toFixed(1)}x${r.height.toFixed(1)}  top ${r.topGap.toFixed(2)}  bottom ${r.bottomGap.toFixed(2)}  offset ${r.offset >= 0 ? "+" : ""}${r.offset.toFixed(3)}`)
  }
  console.log(rows.join("\n"))
}
main()
