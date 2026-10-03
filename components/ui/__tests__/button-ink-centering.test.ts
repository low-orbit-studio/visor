// @vitest-environment node
/**
 * VI-682 — a Button label is optically centred, measured on pixels, in every
 * font. The flex container centres the line box (font ascent + descent), not the
 * capitals, so an untrimmed label sat up to ~1px high depending on the face.
 * This renders Button sm/md/lg in Arial, Product Sans and PP Model Mono, takes a
 * full-page screenshot clipped to each button's exact rect, and reads the
 * cap-ink top gap against the baseline bottom gap (label has no descenders).
 *
 * Skips where Chromium or esbuild is missing, or the font CDN is unreachable.
 */
import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { measureInk, type InkResult } from "./ink-centering"
import { FONT_SCENARIOS, withScenario } from "./ink-fonts"

const TOLERANCE = 0.25 + 1e-3 // CSS px
const SIZES = ["sm", "md", "lg"]
const SIZED = { modules: { button: ["Button"] }, cases: SIZES.map((s) => ({ id: s, jsx: `React.createElement(C.Button, { size: "${s}" }, "HEHTI")` })) }

async function available(engine: "chromium" | "webkit"): Promise<boolean> {
  try {
    const pw = (await import("playwright")) as any
    await import("esbuild")
    return existsSync(pw[engine].executablePath())
  } catch {
    return false
  }
}
async function fontsReachable(): Promise<boolean> {
  try {
    const r = await fetch("https://fonts.visor.design/low-orbit-studio/pp-model-mono/PPModelMono-Medium.woff2", { method: "HEAD", signal: AbortSignal.timeout(5000) })
    return r.ok
  } catch {
    return false
  }
}

const CHROMIUM = (await available("chromium")) && (await fontsReachable())
const WEBKIT = (await available("webkit")) && (await fontsReachable())

describe.skipIf(!CHROMIUM)("Button label optical centering (Chromium)", () => {
  for (const dsf of [2, 4]) {
    for (const scenario of FONT_SCENARIOS) {
      it(`${scenario.name} at ${dsf}x: every size within ${TOLERANCE.toFixed(2)}px`, async () => {
        const res = await measureInk({ ...withScenario(scenario, SIZED), dsf })
        for (const r of res) expect(Math.abs(r.offset), `${r.id} ${r.offset}`).toBeLessThanOrEqual(TOLERANCE)
      }, 90000)
    }
  }

  it("the trim leaves every button box exactly as large as without it (sizes, icon, asChild)", async () => {
    const cases = [
      ...SIZES.map((s) => ({ id: `text ${s}`, jsx: `React.createElement(C.Button, { size: "${s}" }, "Get started")` })),
      { id: "icon+text", jsx: `React.createElement(C.Button, null, React.createElement("svg", { width: 16, height: 16, viewBox: "0 0 16 16" }, React.createElement("rect", { width: 16, height: 16, fill: "currentColor" })), "Save")` },
      { id: "icon only", jsx: `React.createElement(C.Button, { size: "icon", "aria-label": "x" }, React.createElement("svg", { width: 16, height: 16, viewBox: "0 0 16 16" }, React.createElement("rect", { width: 16, height: 16, fill: "currentColor" })))` },
      { id: "asChild", jsx: `React.createElement(C.Button, { asChild: true }, React.createElement("a", { href: "#" }, "Link"))` },
      { id: "dlg", jsx: `React.createElement(C.Button, { size: "dlg" }, "Dialog")` },
    ]
    for (const scenario of FONT_SCENARIOS) {
      const spec = withScenario(scenario, { modules: { button: ["Button"] }, cases })
      const trimmed = await measureInk(spec)
      const plain = await measureInk({ ...spec, extraCss: spec.extraCss + "\n[data-slot=button-text]{text-box:normal!important;transform:none!important}" })
      for (const t of trimmed) {
        const p = plain.find((x) => x.id === t.id) as InkResult
        expect(t.width, `${scenario.name} ${t.id} width`).toBeCloseTo(p.width, 2)
        expect(t.height, `${scenario.name} ${t.id} height`).toBeCloseTo(p.height, 2)
      }
    }
  }, 120000)
})

describe.skipIf(!WEBKIT)("Button label optical centering (WebKit)", () => {
  for (const scenario of FONT_SCENARIOS) {
    it(`${scenario.name} at 4x: every size within ${TOLERANCE.toFixed(2)}px`, async () => {
      const res = await measureInk({ ...withScenario(scenario, SIZED), browser: "webkit", dsf: 4 })
      for (const r of res) expect(Math.abs(r.offset), `${r.id} ${r.offset}`).toBeLessThanOrEqual(TOLERANCE)
    }, 90000)
  }
})
