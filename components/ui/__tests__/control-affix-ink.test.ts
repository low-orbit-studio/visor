// @vitest-environment node
/**
 * VI-662 — Input and NumberInput with a prefix and suffix meet the same bars as a plain Input.
 *
 *  1. Centring: |cap-centre offset| <= 0.5 CSS px for the value and for the prefix and suffix (so they share a
 *     baseline), at sm, md and lg, in Chromium 2x and 4x and WebKit 4x, in Arial, Product Sans and PP Model Mono.
 *  2. No clip: the affixed fields lose no descender or accent ("Typography jpq ÉÅÑ").
 *
 * The affix takes the same VI-684 baseline nudge as the value (.affix reads --input-nudge). Mutation controls:
 * remove the affix nudge and md/lg fail the centring bound; re-add a text-box trim and the value clips.
 *
 * Kept apart from control-ink-centering.test.ts: these cases would push that harness page past the screenshot limit.
 * Skips where Chromium/WebKit or esbuild is missing, or the font CDN is unreachable.
 */
import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { buildAffixControls, AFFIX_CONTROLS, CLIP_LABEL } from "../../../scripts/ink-controls"
import { measureClipping } from "./ink-clipping"
import { measureInk } from "./ink-centering"
import { FONT_SCENARIOS, withScenario } from "./ink-fonts"

const EPS = 1e-3
const LIMIT = 0.5 + EPS
const EXTENT = 0.35
const AREA = 0.02
const CLIP = buildAffixControls(CLIP_LABEL)

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

const NO_AFFIX_NUDGE = "\n[data-slot=input-prefix],[data-slot=input-suffix]{top:0!important}"
const TRIM = "\ninput{text-box:trim-both cap alphabetic!important}"

describe.skipIf(!CHROMIUM)("affixed Input and NumberInput: centring (Chromium)", () => {
  for (const dsf of [2, 4]) {
    for (const scenario of FONT_SCENARIOS) {
      it(`${scenario.name} at ${dsf}x: value and affix are within 0.5px, and share a baseline`, async () => {
        const res = await measureInk({ ...withScenario(scenario, AFFIX_CONTROLS), dsf })
        for (const r of res) expect(Math.abs(r.offset), `${r.id} ${r.offset}`).toBeLessThanOrEqual(LIMIT)
        for (const size of ["sm", "md", "lg"]) {
          const v = res.find((r) => r.id === `input affix ${size} value`)!.offset
          for (const part of ["prefix", "suffix"]) {
            const a = res.find((r) => r.id === `input affix ${size} ${part}`)!.offset
            expect(Math.abs(a - v), `${size} ${part} vs value`).toBeLessThanOrEqual(0.1)
          }
        }
      }, 120000)
    }
  }

  it("mutation control: without the affix nudge, md and lg affixes leave the value's baseline", async () => {
    let hit = 0
    for (const scenario of FONT_SCENARIOS) {
      const spec = withScenario(scenario, AFFIX_CONTROLS)
      const res = await measureInk({ ...spec, extraCss: spec.extraCss + NO_AFFIX_NUDGE })
      for (const size of ["md", "lg"]) {
        const v = res.find((r) => r.id === `input affix ${size} value`)!.offset
        const a = res.find((r) => r.id === `input affix ${size} prefix`)!.offset
        if (Math.abs(a - v) > 0.1) hit++
      }
    }
    expect(hit).toBeGreaterThan(0)
  }, 180000)
})

describe.skipIf(!WEBKIT)("affixed Input and NumberInput: centring (WebKit)", () => {
  for (const scenario of FONT_SCENARIOS) {
    it(`${scenario.name} at 4x: value and affix are within 0.5px`, async () => {
      const res = await measureInk({ ...withScenario(scenario, AFFIX_CONTROLS), browser: "webkit", dsf: 4 })
      for (const r of res) expect(Math.abs(r.offset), `${r.id} ${r.offset}`).toBeLessThanOrEqual(LIMIT)
    }, 120000)
  }
})

for (const [engine, ok] of [["chromium", CHROMIUM], ["webkit", WEBKIT]] as const) {
  describe.skipIf(!ok)(`affixed Input and NumberInput do not clip descenders or accents (${engine})`, () => {
    for (const scenario of FONT_SCENARIOS) {
      it(`${scenario.name}: every affixed control shows all of "${CLIP_LABEL}"`, async () => {
        const res = await measureClipping({ ...withScenario(scenario, CLIP), label: CLIP_LABEL, browser: engine })
        expect(res).toHaveLength(CLIP.cases.length)
        for (const r of res) {
          expect(r.extentGap, `${r.id} extent short by ${r.extentGap.toFixed(2)}px`).toBeLessThanOrEqual(EXTENT)
          expect(r.areaLoss, `${r.id} lost ${(r.areaLoss * 100).toFixed(1)}% of its ink`).toBeLessThanOrEqual(AREA)
        }
      }, 120000)
    }
  })
}

describe.skipIf(!CHROMIUM)("affix no-clip mutation control (Chromium)", () => {
  it("re-adding the input trim makes the affixed input value fail", async () => {
    const [arial] = FONT_SCENARIOS
    const res = await measureClipping({ ...withScenario(arial, CLIP), extraCss: arial.extraCss + TRIM, label: CLIP_LABEL })
    const failed = res.filter((r) => r.extentGap > EXTENT || r.areaLoss > AREA).map((r) => r.id)
    expect(failed).toEqual(expect.arrayContaining(["input affix sm value", "input affix md value", "input affix lg value"]))
  }, 120000)
})
