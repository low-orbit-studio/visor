// VI-684: re-measure the vertical metrics committed in packages/theme-engine/src/font-metrics.ts. Needs playwright + network. Usage: node scripts/measure-font-metrics.mjs
import { chromium } from "playwright"
const G = "https://fonts.gstatic.com/s", V = "https://fonts.visor.design/low-orbit-studio"
const fonts = {
  Inter: `${G}/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf`,
  Outfit: `${G}/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1C4E.ttf`,
  "Pitch Sans": `${V}/pitch-sans/PitchSans-Regular.woff2`,
  "PP Model Mono": `${V}/pp-model-mono/PPModelMono-Book.woff2`,
  "Product Sans": "https://fonts.visor.design/low-orbit-studio/product-sans/ProductSans-Regular.woff2", Satoshi: null, Arial: null, "system-ui": null,
}
const b = await chromium.launch(); const p = await b.newPage()
await p.setContent("<body></body>")
const css = (await (await fetch("https://api.fontshare.com/v2/css?f[]=satoshi@400&display=swap")).text()).replace(/\/\/cdn/g, "https://cdn")
const out = await p.evaluate(async ({ fonts, css }) => {
  const st = document.createElement("style"); st.textContent = css; document.head.append(st)
  const res = {}
  for (const [name, url] of Object.entries(fonts)) {
    if (url) { const f = new FontFace(name, `url(${url})`); await f.load(); document.fonts.add(f) }
  }
  await document.fonts.load("1000px Satoshi")
  const cv = document.createElement("canvas").getContext("2d")
  for (const name of Object.keys(fonts)) {
    cv.font = `1000px ${name === "system-ui" ? "system-ui" : `"${name}"`}`
    const m = cv.measureText("H")
    const d = document.createElement("div"); d.style.cssText = `font:1000px ${name === "system-ui" ? "system-ui" : `"${name}"`};height:1cap;width:1px;position:absolute`; document.body.append(d)
    res[name] = { asc: m.fontBoundingBoxAscent / 1000, desc: m.fontBoundingBoxDescent / 1000, cap: d.getBoundingClientRect().height / 1000 }
  }
  return res
}, { fonts, css })
console.log(JSON.stringify(out, null, 1))
await b.close()
