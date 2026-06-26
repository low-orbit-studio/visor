// Derived from: spec/rules.md — R-PROGRESS, R-DERIVATION-DEPENDENCY (frozen-data resolutions for
// blind-oracle gaps G-C, G-D). Covers the const maps added to spec/state-machine.ts.
import { describe, it, expect } from "vitest"
import {
  STAGE_PROGRESS,
  DERIVATION_DEPENDENCIES,
  DERIVATION_ORDER,
} from "../../spec/state-machine"

describe("R-PROGRESS — STAGE_PROGRESS (journey.html CFG)", () => {
  const rows: Array<[keyof typeof STAGE_PROGRESS, number, number]> = [
    ["start", 0, 5],
    ["strategy", 2, 20],
    ["verbal", 6, 60],
    ["visual", 7, 75],
    ["prove", 8, 88],
    ["export", 10, 100],
    ["canvas", 10, 100],
  ]
  it.each(rows)("%s → done=%i pct=%i", (view, done, pct) => {
    expect(STAGE_PROGRESS[view]).toEqual({ done, pct })
  })

  it("boundary: start is the floor; export and canvas both pin to 100%", () => {
    expect(STAGE_PROGRESS.start.pct).toBe(5)
    expect(STAGE_PROGRESS.export.pct).toBe(100)
    expect(STAGE_PROGRESS.canvas.pct).toBe(100)
  })

  it("done counts are non-decreasing through the guided chain", () => {
    const order: Array<keyof typeof STAGE_PROGRESS> = [
      "start",
      "strategy",
      "verbal",
      "visual",
      "prove",
      "export",
    ]
    for (let i = 1; i < order.length; i++) {
      expect(STAGE_PROGRESS[order[i]].done).toBeGreaterThanOrEqual(
        STAGE_PROGRESS[order[i - 1]].done,
      )
    }
  })
})

describe("R-DERIVATION-DEPENDENCY — DERIVATION_DEPENDENCIES", () => {
  it("freezes the exact upstream graph", () => {
    expect(DERIVATION_DEPENDENCIES).toEqual({
      essence: ["positioning"],
      personality: ["essence"],
      pillars: ["essence"],
      voice: ["personality"],
      tone: ["voice"],
    })
  })

  it("visual, prove, and export have no upstream derivation dependency", () => {
    expect(DERIVATION_DEPENDENCIES.visual).toBeUndefined()
    expect(DERIVATION_DEPENDENCIES.prove).toBeUndefined()
    expect(DERIVATION_DEPENDENCIES.export).toBeUndefined()
  })

  it("every dependency names a real, earlier derivation step", () => {
    for (const [section, deps] of Object.entries(DERIVATION_DEPENDENCIES)) {
      const sectionOrder = DERIVATION_ORDER.indexOf(section as never)
      for (const dep of deps ?? []) {
        const depOrder = DERIVATION_ORDER.indexOf(dep as never)
        expect(depOrder).toBeGreaterThanOrEqual(0)
        expect(depOrder).toBeLessThan(sectionOrder)
      }
    }
  })
})
