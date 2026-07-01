import { describe, it, expect } from "vitest"
import { join } from "path"
import {
  checkThemeModeFile,
  checkThemeModeSource,
  LUMINANCE_THRESHOLD,
} from "../src/check/theme-mode.js"

const FIXTURES = join(import.meta.dirname, "fixtures/theme-mode")

function runFixture(name: string) {
  return checkThemeModeFile(join(FIXTURES, `${name}.visor.yaml`))
}

// ─── dark-only ────────────────────────────────────────────────────────────────

describe("dark-only", () => {
  it("FAILS on a light-rendered dark-only theme (the regression)", () => {
    const result = runFixture("dark-only-light")
    expect(result.pass).toBe(false)
    expect(result.skipped).toBe(false)
    expect(result.mode).toBe("dark-only")
  })

  it("reports the offending computed background color on failure", () => {
    const result = runFixture("dark-only-light")
    expect(result.computed_bg).toBe("#ffffff")
    expect(result.luminance).not.toBeNull()
    expect(result.luminance!).toBeGreaterThanOrEqual(LUMINANCE_THRESHOLD)
  })

  it("PASSES on a dark-rendered dark-only theme", () => {
    const result = runFixture("dark-only-dark")
    expect(result.pass).toBe(true)
    expect(result.skipped).toBe(false)
    expect(result.mode).toBe("dark-only")
    expect(result.computed_bg).toBe("#000000")
    expect(result.luminance!).toBeLessThan(LUMINANCE_THRESHOLD)
  })
})

// ─── light-only ───────────────────────────────────────────────────────────────

describe("light-only", () => {
  it("FAILS on a dark-rendered light-only theme", () => {
    const result = runFixture("light-only-dark")
    expect(result.pass).toBe(false)
    expect(result.mode).toBe("light-only")
    expect(result.computed_bg).toBe("#0b0b0b")
    expect(result.luminance!).toBeLessThan(LUMINANCE_THRESHOLD)
  })

  it("PASSES on a light-rendered light-only theme", () => {
    const result = runFixture("light-only-light")
    expect(result.pass).toBe(true)
    expect(result.mode).toBe("light-only")
    expect(result.computed_bg).toBe("#ffffff")
    expect(result.luminance!).toBeGreaterThanOrEqual(LUMINANCE_THRESHOLD)
  })
})

// ─── adaptive / skip ────────────────────────────────────────────────────────────

describe("adaptive", () => {
  it("SKIPS an explicit adaptive theme", () => {
    const result = runFixture("adaptive")
    expect(result.skipped).toBe(true)
    expect(result.pass).toBe(true)
    expect(result.mode).toBe("adaptive")
    expect(result.computed_bg).toBeNull()
    expect(result.luminance).toBeNull()
  })

  it("SKIPS a theme with no color-scheme (resolves to adaptive, back-compat)", () => {
    const result = runFixture("no-scheme")
    expect(result.skipped).toBe(true)
    expect(result.pass).toBe(true)
    expect(result.mode).toBe("adaptive")
  })
})

// ─── Output schema (machine-readable, for pipeline wiring) ───────────────────────

describe("output schema", () => {
  it("failure result carries the ticket's { pass, mode, computed_bg, luminance } keys", () => {
    const result = runFixture("dark-only-light")
    expect(result).toMatchObject({
      pass: false,
      mode: "dark-only",
      computed_bg: expect.any(String),
      luminance: expect.any(Number),
    })
    expect(typeof result.threshold).toBe("number")
    expect(typeof result.reason).toBe("string")
    expect(result.reason.length).toBeGreaterThan(0)
  })

  it("is JSON-serializable and round-trips", () => {
    const result = runFixture("dark-only-dark")
    const round = JSON.parse(JSON.stringify(result))
    expect(round).toEqual(result)
  })

  it("threshold defaults to LUMINANCE_THRESHOLD (0.2)", () => {
    expect(LUMINANCE_THRESHOLD).toBe(0.2)
    expect(runFixture("dark-only-dark").threshold).toBe(0.2)
  })
})

// ─── Threshold behavior ─────────────────────────────────────────────────────────

describe("threshold", () => {
  const midGray = `
name: mid-gray
version: 1
color-scheme: dark-only
colors:
  primary: "#666666"
  background: "#808080"
colors-dark:
  background: "#808080"
`

  it("respects a custom threshold (mid-gray passes a permissive threshold, fails a strict one)", () => {
    // #808080 luminance ≈ 0.216
    const permissive = checkThemeModeSource(midGray, 0.9)
    const strict = checkThemeModeSource(midGray, 0.05)
    expect(permissive.pass).toBe(true) // 0.216 < 0.9 → counts as dark
    expect(strict.pass).toBe(false) // 0.216 >= 0.05 → counts as light
  })
})

// ─── Reason string ──────────────────────────────────────────────────────────────

describe("reason", () => {
  it("names the declared mode and the offending color on failure", () => {
    const result = runFixture("dark-only-light")
    expect(result.reason).toContain("dark-only")
    expect(result.reason).toContain("#ffffff")
  })

  it("explains the skip on adaptive", () => {
    const result = runFixture("adaptive")
    expect(result.reason.toLowerCase()).toContain("adaptive")
  })
})
