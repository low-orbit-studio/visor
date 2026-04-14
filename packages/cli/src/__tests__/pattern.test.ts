import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

// ---- fixture YAML content ----

const PATTERN_FORM = `
name: Form with Validation
description: Standard form layout with field-level validation.
components_used:
  - field
  - input
  - button
when_to_use:
  - Any form collecting user input
  - Forms needing inline validation feedback
structure: |
  <form onSubmit={handleSubmit}>
    <Field>
      <Input id="email" type="email" required />
    </Field>
    <Button type="submit">Submit</Button>
  </form>
notes: >
  Field component handles spacing.
  Always use FieldLabel with htmlFor.
`.trim()

const PATTERN_DASHBOARD = `
name: Dashboard Layout
description: Top-level dashboard with sidebar and main content area.
components_used:
  - sidebar
  - card
when_to_use:
  - Admin or analytics dashboards
structure: |
  <div className={styles.dashboard}>
    <Sidebar />
    <main>{children}</main>
  </div>
notes: >
  Use CSS grid for the outer layout.
  Sidebar width is controlled via token.
`.trim()

// ---- helper to set up a fake repo ----

function setupFakeRepo(dir: string): void {
  const patternsDir = join(dir, "patterns")
  mkdirSync(patternsDir, { recursive: true })
  writeFileSync(join(patternsDir, "form-with-validation.visor-pattern.yaml"), PATTERN_FORM, "utf-8")
  writeFileSync(join(patternsDir, "dashboard-layout.visor-pattern.yaml"), PATTERN_DASHBOARD, "utf-8")
}

// ---- tests ----

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-pattern-${Date.now()}`)
  mkdirSync(testDir, { recursive: true })
  setupFakeRepo(testDir)
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

import { patternListCommand, patternInfoCommand } from "../commands/pattern.js"

function mockProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`)
  }) as never)
}

function getJsonOutput(): unknown {
  const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
  const jsonStr = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
  if (!jsonStr) throw new Error("No JSON output found")
  return JSON.parse(jsonStr)
}

describe("pattern list command", () => {
  it("returns all patterns with correct count in --json mode", () => {
    const exitSpy = mockProcessExit()
    expect(() => patternListCommand(testDir, { json: true })).toThrow("process.exit(0)")
    const result = getJsonOutput() as { success: boolean; patterns: unknown[]; summary: { total: number } }
    expect(result.success).toBe(true)
    expect(Array.isArray(result.patterns)).toBe(true)
    expect(result.patterns).toHaveLength(2)
    expect(result.summary.total).toBe(2)
    exitSpy.mockRestore()
  })

  it("returns required fields for each pattern in --json mode", () => {
    const exitSpy = mockProcessExit()
    expect(() => patternListCommand(testDir, { json: true })).toThrow("process.exit(0)")
    const result = getJsonOutput() as { patterns: Array<{ name: string; description: string; components_used: string[]; when_to_use: string[] }> }
    const form = result.patterns.find((p) => p.name === "Form with Validation")
    expect(form).toBeDefined()
    expect(form!.description).toBeTruthy()
    expect(Array.isArray(form!.components_used)).toBe(true)
    expect(Array.isArray(form!.when_to_use)).toBe(true)
    exitSpy.mockRestore()
  })

  it("does not include structure field in list output", () => {
    const exitSpy = mockProcessExit()
    expect(() => patternListCommand(testDir, { json: true })).toThrow("process.exit(0)")
    const result = getJsonOutput() as { patterns: Array<Record<string, unknown>> }
    for (const p of result.patterns) {
      expect("structure" in p).toBe(false)
    }
    exitSpy.mockRestore()
  })
})

describe("pattern info command", () => {
  it("returns full pattern data including structure field", () => {
    const exitSpy = mockProcessExit()
    expect(() => patternInfoCommand("Form with Validation", testDir, { json: true })).toThrow("process.exit(0)")
    const result = getJsonOutput() as { success: boolean; pattern: { name: string; structure: string; notes: string } }
    expect(result.success).toBe(true)
    expect(result.pattern.name).toBe("Form with Validation")
    expect(typeof result.pattern.structure).toBe("string")
    expect(result.pattern.structure.length).toBeGreaterThan(0)
    expect(typeof result.pattern.notes).toBe("string")
    expect(result.pattern.notes.length).toBeGreaterThan(0)
    exitSpy.mockRestore()
  })

  it("matches pattern name case-insensitively", () => {
    const exitSpy = mockProcessExit()
    expect(() => patternInfoCommand("form with validation", testDir, { json: true })).toThrow("process.exit(0)")
    const result = getJsonOutput() as { success: boolean; pattern: { name: string } }
    expect(result.success).toBe(true)
    expect(result.pattern.name).toBe("Form with Validation")
    exitSpy.mockRestore()
  })

  it("matches pattern by slug (kebab-case)", () => {
    const exitSpy = mockProcessExit()
    expect(() => patternInfoCommand("form-with-validation", testDir, { json: true })).toThrow("process.exit(0)")
    const result = getJsonOutput() as { success: boolean; pattern: { name: string } }
    expect(result.success).toBe(true)
    expect(result.pattern.name).toBe("Form with Validation")
    exitSpy.mockRestore()
  })

  it("exits with code 1 and error message for unknown pattern name", () => {
    const exitSpy = mockProcessExit()
    expect(() => patternInfoCommand("nonexistent-pattern", testDir, { json: true })).toThrow("process.exit(1)")
    const result = getJsonOutput() as { success: boolean; error: string }
    expect(result.success).toBe(false)
    expect(result.error).toContain("nonexistent-pattern")
    exitSpy.mockRestore()
  })

  it("exits with code 1 for unknown pattern in non-JSON mode", () => {
    const exitSpy = mockProcessExit()
    expect(() => patternInfoCommand("nonexistent-pattern", testDir, {})).toThrow("process.exit(1)")
    exitSpy.mockRestore()
  })
})
