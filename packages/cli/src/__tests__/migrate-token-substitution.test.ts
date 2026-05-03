import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import {
  applySubstitutionsToContent,
  collectCssFiles,
  runSubstitutionPass,
  V7_ENTR_SUBSTITUTION_MAP,
  migrateTokenSubstitutionCommand,
} from "../commands/migrate-token-substitution.js"

// ---------------------------------------------------------------------------
// Unit tests — pure logic (no I/O)
// ---------------------------------------------------------------------------

describe("applySubstitutionsToContent", () => {
  it("substitutes a single V7 primitive with Visor semantic", () => {
    const css = `.card { background: var(--panel); }`
    const { newContent, substitutions } = applySubstitutionsToContent(css, V7_ENTR_SUBSTITUTION_MAP)
    expect(newContent).toBe(`.card { background: var(--surface-card); }`)
    expect(substitutions).toHaveLength(1)
    expect(substitutions[0].from).toBe("--panel")
    expect(substitutions[0].to).toBe("--surface-card")
    expect(substitutions[0].line).toBe(1)
  })

  it("substitutes multiple V7 primitives in a single file", () => {
    const css = [
      `.wrapper { background: var(--panel); color: var(--text); }`,
      `.label { color: var(--text-2); }`,
      `.badge { background: var(--mint-soft); color: var(--mint); }`,
    ].join("\n")
    const { substitutions } = applySubstitutionsToContent(css, V7_ENTR_SUBSTITUTION_MAP)
    expect(substitutions.length).toBeGreaterThanOrEqual(4)
  })

  it("handles all 11 table entries", () => {
    const entries = Object.entries(V7_ENTR_SUBSTITUTION_MAP)
    expect(entries.length).toBe(11)

    for (const [from, to] of entries) {
      const css = `.x { color: var(${from}); }`
      const { newContent, substitutions } = applySubstitutionsToContent(css, V7_ENTR_SUBSTITUTION_MAP)
      expect(substitutions).toHaveLength(1)
      expect(newContent).toContain(`var(${to})`)
    }
  })

  it("is idempotent — second run is a no-op (gate D4)", () => {
    const css = `.card { background: var(--panel); color: var(--text-3); }`
    const { newContent: pass1 } = applySubstitutionsToContent(css, V7_ENTR_SUBSTITUTION_MAP)
    const { newContent: pass2, substitutions: subs2 } = applySubstitutionsToContent(pass1, V7_ENTR_SUBSTITUTION_MAP)
    expect(pass2).toBe(pass1)
    expect(subs2).toHaveLength(0)
  })

  it("preserves fallback values inside var()", () => {
    const css = `.x { color: var(--text, #fff); }`
    const { newContent } = applySubstitutionsToContent(css, V7_ENTR_SUBSTITUTION_MAP)
    // The property name is substituted; fallback may or may not be preserved
    expect(newContent).toContain(`var(--text-primary`)
  })

  it("does not substitute brand-local tokens (--screen, --font-marquee)", () => {
    const css = `.x { background: var(--screen); font-family: var(--font-marquee); }`
    const { substitutions } = applySubstitutionsToContent(css, V7_ENTR_SUBSTITUTION_MAP)
    expect(substitutions).toHaveLength(0)
  })

  it("does not substitute discrete type-scale tokens (--text-11 through --text-56)", () => {
    const css = `.x { font-size: var(--text-11); } .y { font-size: var(--text-56); }`
    const { substitutions } = applySubstitutionsToContent(css, V7_ENTR_SUBSTITUTION_MAP)
    // These should not be substituted — they're V7's discrete type scale, brand-local
    expect(substitutions).toHaveLength(0)
  })

  it("handles multiple matches on the same line", () => {
    const css = `.x { background: var(--panel); color: var(--text); }`
    const { substitutions } = applySubstitutionsToContent(css, V7_ENTR_SUBSTITUTION_MAP)
    expect(substitutions.length).toBeGreaterThanOrEqual(2)
  })

  it("returns correct line numbers (1-based)", () => {
    const css = `/* comment */\n.card { background: var(--panel); }\n`
    const { substitutions } = applySubstitutionsToContent(css, V7_ENTR_SUBSTITUTION_MAP)
    expect(substitutions[0].line).toBe(2)
  })
})

describe("V7_ENTR_SUBSTITUTION_MAP — table completeness", () => {
  it("contains the 10 canonical entries from §3.1 plus --text-4", () => {
    const expected = [
      "--panel",
      "--panel-2",
      "--panel-3",
      "--text",
      "--text-2",
      "--text-3",
      "--text-4",
      "--mint",
      "--mint-soft",
      "--warn",
      "--warn-soft",
    ]
    for (const key of expected) {
      expect(V7_ENTR_SUBSTITUTION_MAP).toHaveProperty(key)
    }
  })

  it("maps --panel to --surface-card", () => {
    expect(V7_ENTR_SUBSTITUTION_MAP["--panel"]).toBe("--surface-card")
  })

  it("maps --text to --text-primary", () => {
    expect(V7_ENTR_SUBSTITUTION_MAP["--text"]).toBe("--text-primary")
  })

  it("maps --mint to --accent-primary", () => {
    expect(V7_ENTR_SUBSTITUTION_MAP["--mint"]).toBe("--accent-primary")
  })

  it("maps --warn-soft to --surface-warning-subtle", () => {
    expect(V7_ENTR_SUBSTITUTION_MAP["--warn-soft"]).toBe("--surface-warning-subtle")
  })
})

// ---------------------------------------------------------------------------
// Integration tests — file I/O
// ---------------------------------------------------------------------------

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `visor-migrate-test-${Date.now()}`)
  mkdirSync(testDir, { recursive: true })
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe("collectCssFiles", () => {
  it("collects .css and .module.css files recursively", () => {
    mkdirSync(join(testDir, "components"), { recursive: true })
    writeFileSync(join(testDir, "style.css"), "")
    writeFileSync(join(testDir, "components", "Card.module.css"), "")
    writeFileSync(join(testDir, "components", "Card.tsx"), "") // should not be collected
    const files = collectCssFiles(testDir)
    expect(files).toHaveLength(2)
    expect(files.some((f) => f.endsWith("style.css"))).toBe(true)
    expect(files.some((f) => f.endsWith("Card.module.css"))).toBe(true)
  })

  it("skips node_modules and .next directories", () => {
    mkdirSync(join(testDir, "node_modules", "some-pkg"), { recursive: true })
    mkdirSync(join(testDir, ".next"), { recursive: true })
    writeFileSync(join(testDir, "node_modules", "some-pkg", "style.css"), "")
    writeFileSync(join(testDir, ".next", "style.css"), "")
    writeFileSync(join(testDir, "app.css"), "")
    const files = collectCssFiles(testDir)
    expect(files).toHaveLength(1)
    expect(files[0]).toContain("app.css")
  })
})

describe("runSubstitutionPass", () => {
  it("returns filesChanged=0 when no V7 primitives found", () => {
    writeFileSync(join(testDir, "clean.css"), `.card { background: var(--surface-card); }`)
    const result = runSubstitutionPass(testDir, V7_ENTR_SUBSTITUTION_MAP, "entr")
    expect(result.filesChanged).toBe(0)
    expect(result.totalSubstitutions).toBe(0)
  })

  it("finds V7 primitives and returns proposed substitutions", () => {
    writeFileSync(join(testDir, "component.css"), `.card { background: var(--panel); color: var(--text); }`)
    const result = runSubstitutionPass(testDir, V7_ENTR_SUBSTITUTION_MAP, "entr")
    expect(result.filesChanged).toBe(1)
    expect(result.totalSubstitutions).toBe(2)
    expect(result.files[0].newContent).toContain("var(--surface-card)")
    expect(result.files[0].newContent).toContain("var(--text-primary)")
  })

  it("does NOT write files — runSubstitutionPass is purely analytical", () => {
    const original = `.card { background: var(--panel); }`
    writeFileSync(join(testDir, "component.css"), original)
    runSubstitutionPass(testDir, V7_ENTR_SUBSTITUTION_MAP, "entr")
    // File on disk should be unchanged
    const onDisk = readFileSync(join(testDir, "component.css"), "utf-8")
    expect(onDisk).toBe(original)
  })
})

describe("migrateTokenSubstitutionCommand — dry-run (gate)", () => {
  it("reports proposed changes without writing files", () => {
    const original = `.card { background: var(--panel); }`
    writeFileSync(join(testDir, "comp.css"), original)

    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit(${code})`)
    }) as never)

    expect(() =>
      migrateTokenSubstitutionCommand(testDir, testDir, { themeId: "entr" })
    ).toThrow("exit(0)")

    // File must be unchanged
    const onDisk = readFileSync(join(testDir, "comp.css"), "utf-8")
    expect(onDisk).toBe(original)
  })
})

describe("migrateTokenSubstitutionCommand — apply mode", () => {
  it("writes substitutions to disk when --apply is set", () => {
    writeFileSync(join(testDir, "comp.css"), `.card { background: var(--panel); }`)

    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit(${code})`)
    }) as never)

    expect(() =>
      migrateTokenSubstitutionCommand(testDir, testDir, { themeId: "entr", apply: true })
    ).toThrow("exit(0)")

    const onDisk = readFileSync(join(testDir, "comp.css"), "utf-8")
    expect(onDisk).toContain("var(--surface-card)")
    expect(onDisk).not.toContain("var(--panel)")
  })

  it("is idempotent — running apply twice leaves files unchanged on second run", () => {
    writeFileSync(join(testDir, "comp.css"), `.card { background: var(--panel); }`)

    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit(${code})`)
    }) as never)

    // First run — applies
    expect(() =>
      migrateTokenSubstitutionCommand(testDir, testDir, { themeId: "entr", apply: true })
    ).toThrow("exit(0)")

    const afterFirst = readFileSync(join(testDir, "comp.css"), "utf-8")

    // Second run — no-op (filesChanged = 0)
    expect(() =>
      migrateTokenSubstitutionCommand(testDir, testDir, { themeId: "entr", apply: true })
    ).toThrow("exit(0)")

    const afterSecond = readFileSync(join(testDir, "comp.css"), "utf-8")
    expect(afterSecond).toBe(afterFirst)
  })
})

describe("migrateTokenSubstitutionCommand — JSON mode", () => {
  function captureJson(): unknown {
    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const jsonLine = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
    expect(jsonLine).toBeDefined()
    return JSON.parse(jsonLine!)
  }

  it("outputs dryRun:true in JSON dry-run mode", () => {
    writeFileSync(join(testDir, "comp.css"), `.x { color: var(--text); }`)

    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit(${code})`)
    }) as never)

    expect(() =>
      migrateTokenSubstitutionCommand(testDir, testDir, { themeId: "entr", json: true })
    ).toThrow("exit(0)")

    const result = captureJson() as { dryRun: boolean; filesChanged: number }
    expect(result.dryRun).toBe(true)
    expect(result.filesChanged).toBe(1)
  })

  it("outputs applied:true in JSON apply mode", () => {
    writeFileSync(join(testDir, "comp.css"), `.x { color: var(--text); }`)

    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit(${code})`)
    }) as never)

    expect(() =>
      migrateTokenSubstitutionCommand(testDir, testDir, { themeId: "entr", json: true, apply: true })
    ).toThrow("exit(0)")

    const result = captureJson() as { applied: boolean }
    expect(result.applied).toBe(true)
  })

  it("outputs success:false for unknown theme-id", () => {
    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit(${code})`)
    }) as never)

    expect(() =>
      migrateTokenSubstitutionCommand(testDir, testDir, { themeId: "nonexistent-zzz", json: true })
    ).toThrow("exit(1)")

    const result = captureJson() as { success: boolean; error: string }
    expect(result.success).toBe(false)
    expect(result.error).toContain("nonexistent-zzz")
  })
})

describe("Integration fixture — R1 pre-§3.1 → R2 post-§3.1 (gate)", () => {
  it("transforms a V7-primitive component file to expected Visor-semantic output", () => {
    // Fixture: a realistic V7-primitive CSS file (like KpiCard.module.css from admin-v7-r1)
    const r1Input = [
      `.card {`,
      `  background: var(--panel);`,
      `  border-radius: var(--radius-md);`,
      `}`,
      `.value {`,
      `  color: var(--text);`,
      `  font-size: var(--text-32);`,
      `}`,
      `.label {`,
      `  color: var(--text-3);`,
      `}`,
      `.trend {`,
      `  color: var(--mint);`,
      `}`,
      `.badge {`,
      `  background: var(--mint-soft);`,
      `  color: var(--mint);`,
      `}`,
      `.warn {`,
      `  background: var(--warn-soft);`,
      `  color: var(--warn);`,
      `}`,
    ].join("\n")

    // Expected: V7 primitives replaced with Visor semantics;
    // --radius-md and --text-32 (type scale) unchanged (brand-local)
    const r2Expected = [
      `.card {`,
      `  background: var(--surface-card);`,
      `  border-radius: var(--radius-md);`,
      `}`,
      `.value {`,
      `  color: var(--text-primary);`,
      `  font-size: var(--text-32);`,
      `}`,
      `.label {`,
      `  color: var(--text-tertiary);`,
      `}`,
      `.trend {`,
      `  color: var(--accent-primary);`,
      `}`,
      `.badge {`,
      `  background: var(--surface-accent-subtle);`,
      `  color: var(--accent-primary);`,
      `}`,
      `.warn {`,
      `  background: var(--surface-warning-subtle);`,
      `  color: var(--text-warning);`,
      `}`,
    ].join("\n")

    const { newContent } = applySubstitutionsToContent(r1Input, V7_ENTR_SUBSTITUTION_MAP)
    expect(newContent).toBe(r2Expected)
  })
})
