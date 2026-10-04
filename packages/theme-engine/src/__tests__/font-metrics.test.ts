import { describe, expect, it } from "vitest"
import { generateFontMetricDecls, FONT_VERTICAL_METRICS } from "../font-metrics.js"

describe("font vertical metrics (VI-684)", () => {
  it("emits em-ratio ascent and descent for a measured face", () => {
    expect(generateFontMetricDecls("Satoshi")).toEqual(["--font-ascent: 1.01;", "--font-descent: 0.24;"])
  })
  it("matches quoted and mixed-case family names", () => {
    expect(generateFontMetricDecls('"Product Sans"')).toEqual(generateFontMetricDecls("product sans"))
  })
  it("emits nothing for an unmeasured face, so the input takes no nudge", () => {
    expect(generateFontMetricDecls("Comic Papyrus")).toEqual([])
  })
  it("covers every body face a shipped theme uses", () => {
    for (const f of ["inter", "outfit", "pitch sans", "pp model mono", "product sans", "satoshi", "system-ui", "arial"]) {
      expect(FONT_VERTICAL_METRICS[f]).toBeDefined()
    }
  })
})
