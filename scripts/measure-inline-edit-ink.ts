/**
 * VI-677 - optical centring of the capitals inside InlineEdit's focus ring
 * (pencil={false}). The measured box is the text button's border box, which is
 * what the focus ring is drawn around. Usage: npx tsx scripts/measure-inline-edit-ink.ts
 * Positive offset = capitals sit low in the ring, negative = high (CSS px).
 */
import { measureInk } from "../components/ui/__tests__/ink-centering"

const common = (value: string, def: string, extra = "") =>
  `React.createElement(C.InlineEdit, { pencil: false, label: "Rider title", value: ${JSON.stringify(value)}, defaultValue: ${JSON.stringify(def)}, onCommit: function () {}${extra} })`
const cases = [
  { id: "14px value", jsx: `React.createElement("p", { style: { margin: 0, fontSize: 14, lineHeight: 1.5 } }, ${common("HEHTI", "")})`, selector: "button" },
  { id: "14px muted default", jsx: `React.createElement("p", { style: { margin: 0, fontSize: 14, lineHeight: 1.5 } }, ${common("", "HEHTI")})`, selector: "button" },
  { id: "21px h2", jsx: common("HEHTI", "", `, as: "h2", style: { margin: 0, fontSize: 21, lineHeight: 1.25, fontWeight: 600 }`), selector: "button" },
]
export const THEMES: Array<{ theme: string; mode: "light" | "dark" }> = [
  { theme: "blacklight-app", mode: "dark" },
  { theme: "blackout", mode: "dark" },
  { theme: "neutral", mode: "light" },
]
export async function run(dsf = 4) {
  const rows: string[] = []
  const out: Array<{ theme: string; id: string; offset: number }> = []
  for (const t of THEMES) {
    const res = await measureInk({ theme: t.theme, mode: t.mode, modules: { "inline-edit": ["InlineEdit"] }, cases, dsf })
    for (const r of res) {
      out.push({ theme: t.theme, id: r.id, offset: r.offset })
      rows.push(`${t.theme.padEnd(16)} ${r.id.padEnd(20)} ${r.width.toFixed(1)}x${r.height.toFixed(1)} top ${r.topGap.toFixed(2)} bottom ${r.bottomGap.toFixed(2)} offset ${r.offset >= 0 ? "+" : ""}${r.offset.toFixed(3)}  ${r.font.split(",")[0]}`)
    }
  }
  return { rows, out }
}
if (process.argv[1]?.endsWith("measure-inline-edit-ink.ts")) run().then((r) => console.log(r.rows.join("\n")))
