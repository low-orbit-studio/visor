import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { themeValidateCommand } from "../commands/theme-validate.js"

const VALID_YAML = `
name: test-theme
version: 1
colors:
  primary: "#6366f1"
`

const INVALID_YAML_MISSING_PRIMARY = `
name: bad-theme
version: 1
colors: {}
`

const INVALID_YAML_BAD_COLOR = `
name: bad-theme
version: 1
colors:
  primary: "#6366f1"
  accent: "not-a-color"
`

const YAML_WITH_WARNINGS = `
name: warn-theme
version: 1
colors:
  primary: "#6366f1"
  accent: "#6366f2"
`

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-theme-validate-${Date.now()}`)
  mkdirSync(testDir, { recursive: true })
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`)
  }) as never)
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe("theme validate command", () => {
  it("reports valid theme with success message", () => {
    const yamlPath = join(testDir, "theme.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    expect(() => {
      themeValidateCommand("theme.yaml", testDir, {})
    }).toThrow("process.exit(0)")

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const successMsg = calls.find((call: unknown[]) =>
      String(call[0]).includes("valid")
    )
    expect(successMsg).toBeDefined()
  })

  it("outputs JSON for valid theme with --json", () => {
    const yamlPath = join(testDir, "theme.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    expect(() => {
      themeValidateCommand("theme.yaml", testDir, { json: true })
    }).toThrow("process.exit(0)")

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const jsonOutput = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]))
        return parsed.valid !== undefined
      } catch {
        return false
      }
    })
    expect(jsonOutput).toBeDefined()
    const parsed = JSON.parse(String(jsonOutput![0]))
    expect(parsed.valid).toBe(true)
    expect(parsed.errors).toEqual([])
  })

  it("reports errors for missing primary color", () => {
    const yamlPath = join(testDir, "theme.yaml")
    writeFileSync(yamlPath, INVALID_YAML_MISSING_PRIMARY, "utf-8")

    expect(() => {
      themeValidateCommand("theme.yaml", testDir, { json: true })
    }).toThrow("process.exit(1)")

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const jsonOutput = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]))
        return parsed.valid === false
      } catch {
        return false
      }
    })
    expect(jsonOutput).toBeDefined()
    const parsed = JSON.parse(String(jsonOutput![0]))
    expect(parsed.valid).toBe(false)
    expect(parsed.errors.length).toBeGreaterThan(0)
  })

  it("reports errors for invalid color values", () => {
    const yamlPath = join(testDir, "theme.yaml")
    writeFileSync(yamlPath, INVALID_YAML_BAD_COLOR, "utf-8")

    expect(() => {
      themeValidateCommand("theme.yaml", testDir, { json: true })
    }).toThrow("process.exit(1)")

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const jsonOutput = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]))
        return parsed.valid === false
      } catch {
        return false
      }
    })
    expect(jsonOutput).toBeDefined()
    const parsed = JSON.parse(String(jsonOutput![0]))
    expect(parsed.errors.length).toBeGreaterThan(0)
    // Invalid hex is caught by structural validation
    expect(parsed.errors.some((e: { code: string }) => e.code === "STRUCTURAL")).toBe(true)
  })

  it("reports warnings for similar primary/accent", () => {
    const yamlPath = join(testDir, "theme.yaml")
    writeFileSync(yamlPath, YAML_WITH_WARNINGS, "utf-8")

    expect(() => {
      themeValidateCommand("theme.yaml", testDir, { json: true })
    }).toThrow("process.exit(0)")

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const jsonOutput = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]))
        return parsed.valid === true && parsed.warnings !== undefined
      } catch {
        return false
      }
    })
    expect(jsonOutput).toBeDefined()
    const parsed = JSON.parse(String(jsonOutput![0]))
    expect(parsed.warnings.length).toBeGreaterThan(0)
    expect(
      parsed.warnings.some((w: { code: string }) => w.code === "COLOR_SIMILARITY")
    ).toBe(true)
  })

  it("exits with code 2 for missing file", () => {
    expect(() => {
      themeValidateCommand("nonexistent.yaml", testDir, {})
    }).toThrow("process.exit(2)")
  })

  it("exits with code 2 for missing file (--json)", () => {
    expect(() => {
      themeValidateCommand("nonexistent.yaml", testDir, { json: true })
    }).toThrow("process.exit(2)")

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const jsonOutput = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]))
        return parsed.valid === false
      } catch {
        return false
      }
    })
    expect(jsonOutput).toBeDefined()
    const parsed = JSON.parse(String(jsonOutput![0]))
    expect(parsed.errors[0].code).toBe("FILE_NOT_FOUND")
  })

  it("exits with code 1 for invalid YAML syntax", () => {
    const yamlPath = join(testDir, "theme.yaml")
    writeFileSync(yamlPath, "{{invalid yaml", "utf-8")

    expect(() => {
      themeValidateCommand("theme.yaml", testDir, { json: true })
    }).toThrow("process.exit(1)")
  })

  it("human-readable output shows errors clearly", () => {
    const yamlPath = join(testDir, "theme.yaml")
    writeFileSync(yamlPath, INVALID_YAML_MISSING_PRIMARY, "utf-8")

    expect(() => {
      themeValidateCommand("theme.yaml", testDir, {})
    }).toThrow("process.exit(1)")

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const allOutput = calls.map((c: unknown[]) => String(c[0])).join("\n")
    expect(allOutput).toContain("error")
  })

  it("produces deterministic validation results", () => {
    const yamlPath = join(testDir, "theme.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    // Run 1
    expect(() => {
      themeValidateCommand("theme.yaml", testDir, { json: true })
    }).toThrow("process.exit(0)")

    // Run 2
    expect(() => {
      themeValidateCommand("theme.yaml", testDir, { json: true })
    }).toThrow("process.exit(0)")

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const jsonCalls = calls.filter((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]))
        return parsed.valid !== undefined
      } catch {
        return false
      }
    })

    expect(jsonCalls.length).toBeGreaterThanOrEqual(2)
    expect(String(jsonCalls[0]![0])).toBe(String(jsonCalls[1]![0]))
  })
})
