// @vitest-environment node
/**
 * VI-684 — every fixed-height single-line control centres its label's capitals
 * within 0.25 CSS px, in any font (Arial, Product Sans, PP Model Mono), on the
 * shared mechanism documented in docs/label-centering.md. Measured on pixels,
 * with the VI-682 harness: toggle-group, tabs, chip, badge, select (the value
 * span, not the caret) and input, at every size.
 *
 * Input is the one exception, and it is a ceiling, not a miss: a native <input>
 * cannot carry the Blink baseline correction (a transform would move the whole
 * field), and its inner line box is placed on whole CSS px in Chromium, so an odd box height
 * (md is 51px) can leave the capitals up to half a px off; WebKit does not yet
 * trim an <input> at all (Arial sits 0.34px high). It is held to 0.5px there.
 *
 * Skips where Chromium/WebKit or esbuild is missing, or the font CDN is unreachable.
 */
import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { CONTROLS } from "../../../scripts/ink-controls"
import { measureInk, type InkResult } from "./ink-centering"
import { FONT_SCENARIOS, withScenario } from "./ink-fonts"

const EPS = 1e-3
const limit = (id: string, engine: "chromium" | "webkit" = "chromium") => (id.startsWith("input") && (engine === "webkit" || id === "input md") ? 0.5 : 0.25) + EPS

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

/** Switch the trim off everywhere: what the controls rendered before VI-684. */
const NO_TRIM =
  "\n[data-slot=toggle-group-text],[data-slot=tabs-trigger-text],[data-slot=badge-text],[data-slot=chip-text],[data-slot=select-trigger]>span{text-box:normal!important;transform:none!important;padding-block:0!important}input{text-box:normal!important}"

describe.skipIf(!CHROMIUM)("control label optical centering (Chromium)", () => {
  for (const dsf of [2, 4]) {
    for (const scenario of FONT_SCENARIOS) {
      it(`${scenario.name} at ${dsf}x: every control and size is centred`, async () => {
        const res = await measureInk({ ...withScenario(scenario, CONTROLS), dsf })
        for (const r of res) expect(Math.abs(r.offset), `${r.id} ${r.offset}`).toBeLessThanOrEqual(limit(r.id))
      }, 120000)
    }
  }

  it("the trim leaves every control box exactly as large as without it", async () => {
    for (const scenario of FONT_SCENARIOS) {
      const spec = withScenario(scenario, CONTROLS)
      const trimmed = await measureInk(spec)
      const plain = await measureInk({ ...spec, extraCss: spec.extraCss + NO_TRIM })
      for (const t of trimmed) {
        const p = plain.find((x) => x.id === t.id) as InkResult
        // A fraction of a LayoutUnit (1/64 px) is the most the padding that hands the trim back can differ by.
        expect(Math.abs(t.width - p.width), `${scenario.name} ${t.id} width`).toBeLessThan(0.05)
        expect(Math.abs(t.height - p.height), `${scenario.name} ${t.id} height`).toBeLessThan(0.05)
      }
    }
  }, 180000)

  it("mutation control: without the trim, toggle-group and badge fail the centring bound", async () => {
    const hit: string[] = []
    for (const scenario of FONT_SCENARIOS) {
      const spec = withScenario(scenario, CONTROLS)
      const res = await measureInk({ ...spec, extraCss: spec.extraCss + NO_TRIM })
      for (const r of res) if (Math.abs(r.offset) > limit(r.id)) hit.push(r.id)
    }
    expect(hit.some((id) => id.startsWith("toggle-group"))).toBe(true)
    expect(hit.some((id) => id.startsWith("badge"))).toBe(true)
  }, 180000)
})

describe.skipIf(!WEBKIT)("control label optical centering (WebKit)", () => {
  for (const scenario of FONT_SCENARIOS) {
    it(`${scenario.name} at 4x: every control and size is centred`, async () => {
      const res = await measureInk({ ...withScenario(scenario, CONTROLS), browser: "webkit", dsf: 4 })
      for (const r of res) expect(Math.abs(r.offset), `${r.id} ${r.offset}`).toBeLessThanOrEqual(limit(r.id, "webkit"))
    }, 120000)
  }
})
