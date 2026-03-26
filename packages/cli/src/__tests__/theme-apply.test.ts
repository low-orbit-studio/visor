import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { themeApplyCommand } from "../commands/theme-apply.js"

const VALID_YAML = `
name: test-theme
version: 1
colors:
  primary: "#6366f1"
`

const INVALID_YAML = `
name: bad-theme
version: 1
colors: {}
`

let testDir: string

function mockProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`)
  }) as never)
}

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-theme-apply-${Date.now()}`)
  mkdirSync(testDir, { recursive: true })
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
  mockProcessExit()
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe("theme apply command", () => {
  it("generates CSS from a valid .visor.yaml", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    themeApplyCommand(".visor.yaml", testDir, {})

    const outputPath = join(testDir, "visor-theme.css")
    expect(existsSync(outputPath)).toBe(true)

    const css = readFileSync(outputPath, "utf-8")
    expect(css).toContain("--color-primary-")
    expect(css).toContain(":root")
  })

  it("writes to custom output path", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    themeApplyCommand(".visor.yaml", testDir, {
      output: "styles/theme.css",
    })

    const outputPath = join(testDir, "styles/theme.css")
    expect(existsSync(outputPath)).toBe(true)
  })

  it("outputs structured JSON with --json flag", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    themeApplyCommand(".visor.yaml", testDir, { json: true })

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const jsonOutput = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]))
        return parsed.success !== undefined
      } catch {
        return false
      }
    })

    expect(jsonOutput).toBeDefined()
    const parsed = JSON.parse(String(jsonOutput![0]))
    expect(parsed.success).toBe(true)
    expect(parsed.file).toBeDefined()
    expect(parsed.sections).toBeDefined()
    expect(parsed.sections.fullBundle).toBeGreaterThan(0)
  })

  it("exits with code 2 for missing file", () => {
    expect(() => {
      themeApplyCommand("nonexistent.yaml", testDir, {})
    }).toThrow("process.exit(2)")
  })

  it("exits with code 2 for missing file (--json)", () => {
    expect(() => {
      themeApplyCommand("nonexistent.yaml", testDir, { json: true })
    }).toThrow("process.exit(2)")

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const jsonOutput = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]))
        return parsed.success === false
      } catch {
        return false
      }
    })
    expect(jsonOutput).toBeDefined()
  })

  it("exits with code 1 for invalid config", () => {
    const yamlPath = join(testDir, "bad.yaml")
    writeFileSync(yamlPath, INVALID_YAML, "utf-8")

    expect(() => {
      themeApplyCommand("bad.yaml", testDir, {})
    }).toThrow("process.exit(1)")
  })

  it("produces deterministic output", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    // Run 1
    themeApplyCommand(".visor.yaml", testDir, { output: "out1.css" })
    const out1 = readFileSync(join(testDir, "out1.css"), "utf-8")

    // Run 2
    themeApplyCommand(".visor.yaml", testDir, { output: "out2.css" })
    const out2 = readFileSync(join(testDir, "out2.css"), "utf-8")

    expect(out1).toBe(out2)
  })
})
