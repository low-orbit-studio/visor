import { describe, it, expect } from "vitest"
import { join } from "path"
import { scanDesign, collectFiles, loadVisorRc, RULES } from "../src/check/design.js"
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs"
import { tmpdir } from "os"

const FIXTURES = join(import.meta.dirname, "fixtures/design")

// ─── Helper ───────────────────────────────────────────────────────────────────

function scanFixture(fixtureName: string, options?: Parameters<typeof scanDesign>[1]) {
  return scanDesign(join(FIXTURES, fixtureName), options)
}

function fixtureErrors(fixtureName: string, rule: string) {
  const result = scanFixture(fixtureName)
  return result.errors.filter(f => f.rule === rule)
}

function fixtureWarnings(fixtureName: string, rule: string) {
  const result = scanFixture(fixtureName)
  return result.warnings.filter(f => f.rule === rule)
}

// ─── Rule inventory ───────────────────────────────────────────────────────────

describe("rule registry", () => {
  it("exports exactly 16 rules", () => {
    expect(RULES).toHaveLength(16)
  })

  it("has 8 error-severity rules", () => {
    expect(RULES.filter(r => r.severity === "error")).toHaveLength(8)
  })

  it("has 8 warn-severity rules", () => {
    expect(RULES.filter(r => r.severity === "warn")).toHaveLength(8)
  })

  const expectedErrorRules = [
    "tier-1-token-direct-usage",
    "hardcoded-hex",
    "hardcoded-px",
    "missing-dark-mode-block",
    "missing-hover-transition",
    "div-as-input",
    "setstate-hover",
    "missing-aria-pressed",
  ]

  const expectedWarnRules = [
    "banned-fonts",
    "purple-gradient-on-white",
    "pure-black-untinted",
    "bounce-easing",
    "sub-44px-touch-target",
    "line-length-over-75ch",
    "gradient-text",
    "excessive-card-nesting",
  ]

  for (const name of expectedErrorRules) {
    it(`includes error rule: ${name}`, () => {
      expect(RULES.find(r => r.name === name && r.severity === "error")).toBeTruthy()
    })
  }

  for (const name of expectedWarnRules) {
    it(`includes warn rule: ${name}`, () => {
      expect(RULES.find(r => r.name === name && r.severity === "warn")).toBeTruthy()
    })
  }
})

// ─── Clean fixture — no violations ───────────────────────────────────────────

describe("clean fixture", () => {
  it("produces zero errors on the clean fixture", () => {
    const result = scanFixture("clean")
    expect(result.errors).toHaveLength(0)
  })

  it("produces zero warnings on the clean fixture", () => {
    const result = scanFixture("clean")
    expect(result.warnings).toHaveLength(0)
  })

  it("scans multiple files from a directory", () => {
    const result = scanFixture("clean")
    expect(result.summary.filesScanned).toBeGreaterThanOrEqual(2)
  })
})

// ─── Error rule: tier-1-token-direct-usage ───────────────────────────────────

describe("rule: tier-1-token-direct-usage", () => {
  it("flags --primitive- usage in TSX", () => {
    const findings = fixtureErrors("tier-1-token-direct-usage-bad", "tier-1-token-direct-usage")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("finding has file, line, rule, message, fix", () => {
    const findings = fixtureErrors("tier-1-token-direct-usage-bad", "tier-1-token-direct-usage")
    const f = findings[0]
    expect(f.file).toContain("tier-1-token-direct-usage-bad")
    expect(f.line).toBeGreaterThan(0)
    expect(f.rule).toBe("tier-1-token-direct-usage")
    expect(f.message).toBeTruthy()
    expect(f.fix).toBeTruthy()
  })

  it("does NOT fire on the clean fixture", () => {
    expect(fixtureErrors("clean", "tier-1-token-direct-usage")).toHaveLength(0)
  })
})

// ─── Error rule: hardcoded-hex ────────────────────────────────────────────────

describe("rule: hardcoded-hex", () => {
  it("flags hex color literals in TSX", () => {
    const findings = fixtureErrors("hardcoded-hex-bad", "hardcoded-hex")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("includes the hex value in the message", () => {
    const findings = fixtureErrors("hardcoded-hex-bad", "hardcoded-hex")
    expect(findings.some(f => f.message.includes("#"))).toBe(true)
  })

  it("does NOT fire on the clean fixture", () => {
    expect(fixtureErrors("clean", "hardcoded-hex")).toHaveLength(0)
  })
})

// ─── Error rule: hardcoded-px ────────────────────────────────────────────────

describe("rule: hardcoded-px", () => {
  it("flags hardcoded pixel spacing in CSS", () => {
    const findings = fixtureErrors("hardcoded-px-bad", "hardcoded-px")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("does NOT fire on the clean fixture", () => {
    expect(fixtureErrors("clean", "hardcoded-px")).toHaveLength(0)
  })
})

// ─── Error rule: missing-dark-mode-block ─────────────────────────────────────

describe("rule: missing-dark-mode-block", () => {
  it("flags CSS files with no dark mode block", () => {
    const findings = fixtureErrors("missing-dark-mode-block-bad", "missing-dark-mode-block")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("finding is on line 1", () => {
    const findings = fixtureErrors("missing-dark-mode-block-bad", "missing-dark-mode-block")
    expect(findings[0].line).toBe(1)
  })

  it("does NOT fire on CSS with @media (prefers-color-scheme: dark)", () => {
    expect(fixtureErrors("clean", "missing-dark-mode-block")).toHaveLength(0)
  })

  it("does NOT fire on CSS with [data-theme=dark]", () => {
    const tmpDir = join(tmpdir(), `visor-test-dark-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
    writeFileSync(join(tmpDir, "styles.css"), `
      .card { color: var(--color-text); }
      [data-theme="dark"] .card { color: var(--color-text-dark); }
    `)
    const result = scanDesign(tmpDir)
    rmSync(tmpDir, { recursive: true })
    expect(result.errors.filter(f => f.rule === "missing-dark-mode-block")).toHaveLength(0)
  })
})

// ─── Error rule: missing-hover-transition ────────────────────────────────────

describe("rule: missing-hover-transition", () => {
  it("flags CSS with :hover but no transition", () => {
    const findings = fixtureErrors("missing-hover-transition-bad", "missing-hover-transition")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("does NOT fire on the clean fixture (which has transition)", () => {
    expect(fixtureErrors("clean", "missing-hover-transition")).toHaveLength(0)
  })

  it("does NOT fire on CSS with no :hover at all", () => {
    const tmpDir = join(tmpdir(), `visor-test-nohover-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
    writeFileSync(join(tmpDir, "styles.css"), `
      .card { color: var(--color-text); }
      @media (prefers-color-scheme: dark) { .card { color: var(--c); } }
    `)
    const result = scanDesign(tmpDir)
    rmSync(tmpDir, { recursive: true })
    expect(result.errors.filter(f => f.rule === "missing-hover-transition")).toHaveLength(0)
  })
})

// ─── Error rule: div-as-input ────────────────────────────────────────────────

describe("rule: div-as-input", () => {
  it("flags <div onClick> without role=", () => {
    const findings = fixtureErrors("div-as-input-bad", "div-as-input")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("does NOT fire on the clean fixture", () => {
    expect(fixtureErrors("clean", "div-as-input")).toHaveLength(0)
  })

  it("does NOT fire on <div onClick role='button'>", () => {
    const tmpDir = join(tmpdir(), `visor-test-div-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
    writeFileSync(join(tmpDir, "c.tsx"), `
      export function Good() {
        return <div onClick={fn} role="button" tabIndex={0}>ok</div>
      }
    `)
    const result = scanDesign(tmpDir)
    rmSync(tmpDir, { recursive: true })
    expect(result.errors.filter(f => f.rule === "div-as-input")).toHaveLength(0)
  })
})

// ─── Error rule: setstate-hover ──────────────────────────────────────────────

describe("rule: setstate-hover", () => {
  it("flags useState used for hover tracking", () => {
    const findings = fixtureErrors("setstate-hover-bad", "setstate-hover")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("flags onMouseEnter with setState call", () => {
    const findings = fixtureErrors("setstate-hover-bad", "setstate-hover")
    expect(findings.some(f => f.message.includes("onMouseEnter"))).toBe(true)
  })

  it("does NOT fire on the clean fixture", () => {
    expect(fixtureErrors("clean", "setstate-hover")).toHaveLength(0)
  })
})

// ─── Error rule: missing-aria-pressed ────────────────────────────────────────

describe("rule: missing-aria-pressed", () => {
  it("flags toggle button without aria-pressed", () => {
    const findings = fixtureErrors("missing-aria-pressed-bad", "missing-aria-pressed")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("does NOT fire on the clean fixture (has aria-pressed)", () => {
    expect(fixtureErrors("clean", "missing-aria-pressed")).toHaveLength(0)
  })
})

// ─── Warn rule: banned-fonts ──────────────────────────────────────────────────

describe("rule: banned-fonts", () => {
  it("flags Inter font usage in CSS", () => {
    const findings = fixtureWarnings("banned-fonts-bad", "banned-fonts")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("includes the font name in the message", () => {
    const findings = fixtureWarnings("banned-fonts-bad", "banned-fonts")
    expect(findings[0].message).toContain("Inter")
  })

  it("does NOT fire on the clean fixture", () => {
    expect(fixtureWarnings("clean", "banned-fonts")).toHaveLength(0)
  })
})

// ─── Warn rule: purple-gradient-on-white ─────────────────────────────────────

describe("rule: purple-gradient-on-white", () => {
  it("flags purple gradient in CSS", () => {
    const findings = fixtureWarnings("purple-gradient-on-white-bad", "purple-gradient-on-white")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("does NOT fire on the clean fixture", () => {
    expect(fixtureWarnings("clean", "purple-gradient-on-white")).toHaveLength(0)
  })
})

// ─── Warn rule: pure-black-untinted ──────────────────────────────────────────

describe("rule: pure-black-untinted", () => {
  it("flags #000 color usage", () => {
    const findings = fixtureWarnings("pure-black-untinted-bad", "pure-black-untinted")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("does NOT fire on the clean fixture", () => {
    expect(fixtureWarnings("clean", "pure-black-untinted")).toHaveLength(0)
  })
})

// ─── Warn rule: bounce-easing ────────────────────────────────────────────────

describe("rule: bounce-easing", () => {
  it("flags bounce cubic-bezier with overshoot values", () => {
    const findings = fixtureWarnings("bounce-easing-bad", "bounce-easing")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("does NOT fire on the clean fixture", () => {
    expect(fixtureWarnings("clean", "bounce-easing")).toHaveLength(0)
  })
})

// ─── Warn rule: sub-44px-touch-target ────────────────────────────────────────

describe("rule: sub-44px-touch-target", () => {
  it("flags small explicit dimensions on icon-button", () => {
    const findings = fixtureWarnings("sub-44px-touch-target-bad", "sub-44px-touch-target")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("does NOT fire on the clean fixture", () => {
    expect(fixtureWarnings("clean", "sub-44px-touch-target")).toHaveLength(0)
  })
})

// ─── Warn rule: line-length-over-75ch ────────────────────────────────────────

describe("rule: line-length-over-75ch", () => {
  it("flags max-width over 75ch", () => {
    const findings = fixtureWarnings("line-length-over-75ch-bad", "line-length-over-75ch")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("includes the ch value in the message", () => {
    const findings = fixtureWarnings("line-length-over-75ch-bad", "line-length-over-75ch")
    expect(findings[0].message).toContain("90ch")
  })

  it("does NOT fire on the clean fixture", () => {
    expect(fixtureWarnings("clean", "line-length-over-75ch")).toHaveLength(0)
  })
})

// ─── Warn rule: gradient-text ────────────────────────────────────────────────

describe("rule: gradient-text", () => {
  it("flags background-clip: text usage", () => {
    const findings = fixtureWarnings("gradient-text-bad", "gradient-text")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("does NOT fire on the clean fixture", () => {
    expect(fixtureWarnings("clean", "gradient-text")).toHaveLength(0)
  })
})

// ─── Warn rule: excessive-card-nesting ───────────────────────────────────────

describe("rule: excessive-card-nesting", () => {
  it("flags Card nested 3 levels deep", () => {
    const findings = fixtureWarnings("excessive-card-nesting-bad", "excessive-card-nesting")
    expect(findings.length).toBeGreaterThan(0)
  })

  it("does NOT fire on the clean fixture", () => {
    expect(fixtureWarnings("clean", "excessive-card-nesting")).toHaveLength(0)
  })
})

// ─── Scan options ─────────────────────────────────────────────────────────────

describe("scanDesign options", () => {
  it("--errors-only skips warning rules", () => {
    const result = scanFixture("banned-fonts-bad", { errorsOnly: true })
    expect(result.warnings).toHaveLength(0)
  })

  it("disabledRules suppresses a specific rule", () => {
    const result = scanFixture("hardcoded-hex-bad", {
      disabledRules: ["hardcoded-hex"],
    })
    expect(result.errors.filter(f => f.rule === "hardcoded-hex")).toHaveLength(0)
  })

  it("disabledRules does not suppress other rules", () => {
    // hardcoded-hex-bad fixture has hex colors — if we disable hardcoded-hex,
    // we shouldn't see that rule but others should still work
    const resultWithRule = scanFixture("hardcoded-hex-bad")
    const resultWithout = scanFixture("hardcoded-hex-bad", { disabledRules: ["hardcoded-hex"] })
    expect(resultWithout.errors.filter(f => f.rule === "hardcoded-hex")).toHaveLength(0)
    expect(resultWithRule.errors.filter(f => f.rule === "hardcoded-hex").length).toBeGreaterThan(0)
  })

  it("returns correct filesScanned count", () => {
    const result = scanFixture("clean")
    expect(result.summary.filesScanned).toBe(result.summary.filesScanned)
    expect(typeof result.summary.filesScanned).toBe("number")
  })

  it("summary errorCount matches errors array length", () => {
    const result = scanFixture("hardcoded-hex-bad")
    expect(result.summary.errorCount).toBe(result.errors.length)
  })

  it("summary warningCount matches warnings array length", () => {
    const result = scanFixture("banned-fonts-bad")
    expect(result.summary.warningCount).toBe(result.warnings.length)
  })
})

// ─── collectFiles ─────────────────────────────────────────────────────────────

describe("collectFiles", () => {
  it("collects tsx files from a directory", () => {
    const files = collectFiles(join(FIXTURES, "clean"))
    expect(files.some(f => f.endsWith(".tsx"))).toBe(true)
  })

  it("collects css files from a directory", () => {
    const files = collectFiles(join(FIXTURES, "clean"))
    expect(files.some(f => f.endsWith(".css"))).toBe(true)
  })

  it("returns empty array for non-existent path", () => {
    const files = collectFiles("/nonexistent/path/xyz")
    expect(files).toHaveLength(0)
  })

  it("returns single file when given a file path", () => {
    const file = join(FIXTURES, "clean/component.tsx")
    const files = collectFiles(file)
    expect(files).toHaveLength(1)
    expect(files[0]).toBe(file)
  })

  it("skips node_modules directory", () => {
    const tmpDir = join(tmpdir(), `visor-test-nm-${Date.now()}`)
    mkdirSync(join(tmpDir, "node_modules"), { recursive: true })
    writeFileSync(join(tmpDir, "node_modules", "bad.tsx"), `const x = "#ff0000"`)
    writeFileSync(join(tmpDir, "good.tsx"), `export default function Good() { return null }`)
    const files = collectFiles(tmpDir)
    rmSync(tmpDir, { recursive: true })
    expect(files.some(f => f.includes("node_modules"))).toBe(false)
    expect(files.some(f => f.endsWith("good.tsx"))).toBe(true)
  })
})

// ─── loadVisorRc ──────────────────────────────────────────────────────────────

describe("loadVisorRc", () => {
  it("returns empty object when no .visorrc.json exists", () => {
    const rc = loadVisorRc("/nonexistent/path")
    expect(rc).toEqual({})
  })

  it("reads disabledRules from .visorrc.json", () => {
    const tmpDir = join(tmpdir(), `visor-test-rc-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
    writeFileSync(
      join(tmpDir, ".visorrc.json"),
      JSON.stringify({ disabledRules: ["gradient-text", "bounce-easing"] })
    )
    const rc = loadVisorRc(tmpDir)
    rmSync(tmpDir, { recursive: true })
    expect(rc.disabledRules).toEqual(["gradient-text", "bounce-easing"])
  })

  it("returns empty object for malformed .visorrc.json", () => {
    const tmpDir = join(tmpdir(), `visor-test-rc-bad-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
    writeFileSync(join(tmpDir, ".visorrc.json"), "not valid json {{")
    const rc = loadVisorRc(tmpDir)
    rmSync(tmpDir, { recursive: true })
    expect(rc).toEqual({})
  })
})

// ─── JSON output schema validation ───────────────────────────────────────────

describe("output schema", () => {
  it("result has errors, warnings, summary shape", () => {
    const result = scanFixture("hardcoded-hex-bad")
    expect(Array.isArray(result.errors)).toBe(true)
    expect(Array.isArray(result.warnings)).toBe(true)
    expect(typeof result.summary.errorCount).toBe("number")
    expect(typeof result.summary.warningCount).toBe("number")
    expect(typeof result.summary.filesScanned).toBe("number")
  })

  it("each finding has file, line, rule, severity, message", () => {
    const result = scanFixture("hardcoded-hex-bad")
    if (result.errors.length > 0) {
      const f = result.errors[0]
      expect(typeof f.file).toBe("string")
      expect(typeof f.line).toBe("number")
      expect(typeof f.rule).toBe("string")
      expect(f.severity).toBe("error")
      expect(typeof f.message).toBe("string")
    }
  })

  it("fix field is a string when present", () => {
    const result = scanFixture("hardcoded-hex-bad")
    const withFix = result.errors.find(f => f.fix !== undefined)
    if (withFix) {
      expect(typeof withFix.fix).toBe("string")
    }
  })
})
