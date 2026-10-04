// @vitest-environment node
/**
 * VI-684 regression — no trimmed control clips ink. Trimming a label's line box
 * to the capital band (text-box: trim-both cap alphabetic) also shrinks the box
 * its glyphs are clipped against: a native <input> cuts everything below the
 * baseline ("Typography jpq" rendered as "Tvpoaraphv ipa"), and an
 * overflow:hidden ancestor of a trimmed span cuts descenders and accents. The
 * centring suites use "HEHTI", which has neither, so they never saw it.
 *
 * This renders Button, toggle-group, tabs, chip, badge, select and input at every
 * size with a label of descenders and accents, and compares each against the same
 * text in an unclipped reference (see ink-clipping.ts). It runs in Chromium and
 * WebKit, in every body face a shipped theme uses.
 *
 * Skips where Chromium/WebKit or esbuild is missing, or the font CDN is unreachable.
 */
import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { buildControls, CLIP_LABEL } from "../../../scripts/ink-controls"
import { measureClipping } from "./ink-clipping"
import { FONT_SCENARIOS, withScenario } from "./ink-fonts"

/** CSS px of vertical extent, and fraction of ink area, a control may lose against the unclipped reference. */
/* A hairline row (an accent ring top, a descender tip) can fall either side of the 50% ink threshold when the control and its reference are painted on different sub-pixel baselines (WebKit, Inter, input sm: 0.75px, 0.2% of the ink). A real clip loses whole rows of descenders and several percent of the ink. */
const EXTENT = 0.8
const AREA = 0.02
const CONTROLS = buildControls(CLIP_LABEL, true)

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

const CHROMIUM = (await available("chromium")) && (await fontsReachable())
const WEBKIT = (await available("webkit")) && (await fontsReachable())

for (const [engine, ok] of [["chromium", CHROMIUM], ["webkit", WEBKIT]] as const) {
  describe.skipIf(!ok)(`trimmed controls do not clip descenders or accents (${engine})`, () => {
    for (const scenario of FONT_SCENARIOS) {
      it(`${scenario.name}: every control and size shows all of "${CLIP_LABEL}"`, async () => {
        const res = await measureClipping({ ...withScenario(scenario, CONTROLS), label: CLIP_LABEL, browser: engine })
        expect(res).toHaveLength(CONTROLS.cases.length)
        for (const r of res) {
          expect(r.extentGap, `${r.id} extent short by ${r.extentGap.toFixed(2)}px`).toBeLessThanOrEqual(EXTENT)
          expect(r.areaLoss, `${r.id} lost ${(r.areaLoss * 100).toFixed(1)}% of its ink`).toBeLessThanOrEqual(AREA)
        }
      }, 120000)
    }
  })
}

describe.skipIf(!CHROMIUM)("no-clip test mutation controls (Chromium)", () => {
  const [arial] = FONT_SCENARIOS
  const run = (css: string) => measureClipping({ ...withScenario(arial, CONTROLS), extraCss: arial.extraCss + css, label: CLIP_LABEL })

  it("re-adding the input trim makes the input fail", async () => {
    const res = await run("\ninput{text-box:trim-both cap alphabetic!important}")
    const failed = res.filter((r) => r.extentGap > EXTENT || r.areaLoss > AREA).map((r) => r.id)
    expect(failed).toEqual(expect.arrayContaining(["input sm", "input md", "input lg"]))
  }, 120000)

  it("clipping a label's descenders makes its control fail", async () => {
    const res = await run("\n[data-slot=badge]{overflow:hidden!important}")
    expect(res.filter((r) => r.id.startsWith("badge")).some((r) => r.extentGap > EXTENT || r.areaLoss > AREA)).toBe(true)
  }, 120000)
})
