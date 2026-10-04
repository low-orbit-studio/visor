// @vitest-environment node
/**
 * VI-615 — SegmentedControl's labels are trimmed to the capital-to-baseline band
 * (docs/label-centering.md), which must never clip what hangs outside that band:
 * descenders (p, y, q, j) and accents (É, Å, Ñ). Measured on pixels, in Chromium
 * and WebKit, in the three VI-682 faces: the ink extent of "Typography jpq ÉÅÑ"
 * with the trim equals its extent with the trim switched off.
 *
 * The mutation control puts `overflow: hidden` on the label (the way a clip would
 * sneak in) and proves the measurement sees it.
 *
 * Skips where Chromium/WebKit or esbuild is missing, or the font CDN is unreachable.
 */
import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { measureInk } from "./ink-centering"
import { FONT_SCENARIOS, withScenario } from "./ink-fonts"

const LABEL = "Typography jpq ÉÅÑ"
const SPEC = {
  modules: { "segmented-control": ["SegmentedControl"] } as Record<string, string[]>,
  cases: ["sm", "md", "lg"].map((s) => ({
    id: `segmented-control ${s}`,
    selector: "[data-slot=toggle-group-item]",
    jsx: `React.createElement(C.SegmentedControl, { size: "${s}", defaultValue: "a", style: { "--segmented-control-indicator-edge": "transparent" }, options: [{ value: "a", label: "${LABEL}" }] })`,
  })),
}
const NO_TRIM = "\n[data-slot=toggle-group-text]{text-box:normal!important;transform:none!important}"
const CLIP = "\n[data-slot=toggle-group-text]{overflow:hidden!important}"
const TOL = 0.3

async function available(engine: "chromium" | "webkit"): Promise<boolean> {
  try {
    const pw = (await import("playwright")) as unknown as Record<string, { executablePath(): string }>
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
const FONTS = await fontsReachable()
const CHROMIUM = (await available("chromium")) && FONTS
const WEBKIT = (await available("webkit")) && FONTS

const inkHeight = (r: { height: number; topGap: number; bottomGap: number }) => r.height - r.topGap - r.bottomGap

for (const [engine, ready] of [["chromium", CHROMIUM], ["webkit", WEBKIT]] as const) {
  describe.skipIf(!ready)(`SegmentedControl labels are not clipped (${engine})`, () => {
    for (const scenario of FONT_SCENARIOS) {
      it(`${scenario.name}: descenders and accents keep their full extent`, async () => {
        const spec = { ...withScenario(scenario, SPEC), browser: engine, dsf: 4 }
        const trimmed = await measureInk(spec)
        const plain = await measureInk({ ...spec, extraCss: spec.extraCss + NO_TRIM })
        for (const t of trimmed) {
          const p = plain.find((x) => x.id === t.id)!
          expect(Math.abs(inkHeight(t) - inkHeight(p)), `${t.id} ink ${inkHeight(t)} vs ${inkHeight(p)}`).toBeLessThanOrEqual(TOL)
        }
      }, 120000)
    }

    it("mutation control: overflow hidden on the label clips the descenders and the test sees it", async () => {
      const spec = { ...withScenario(FONT_SCENARIOS[0], SPEC), browser: engine, dsf: 4 }
      const plain = await measureInk({ ...spec, extraCss: spec.extraCss + NO_TRIM })
      const clipped = await measureInk({ ...spec, extraCss: spec.extraCss + CLIP })
      const seen = clipped.some((c) => inkHeight(plain.find((x) => x.id === c.id)!) - inkHeight(c) > TOL)
      expect(seen).toBe(true)
    }, 120000)
  })
}
