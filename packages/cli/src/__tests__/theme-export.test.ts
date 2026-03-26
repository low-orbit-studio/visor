import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { themeExportCommand } from "../commands/theme-export.js"

const VALID_YAML = `
name: test-theme
version: 1
colors:
  primary: "#6366f1"
  accent: "#ec4899"
`

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-theme-export-${Date.now()}`)
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

describe("theme export command", () => {
  it("exports theme as YAML by default", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    themeExportCommand(undefined, testDir, {})

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const yamlOutput = calls.find((call: unknown[]) => {
      const str = String(call[0])
      return str.includes("name:") && str.includes("test-theme")
    })
    expect(yamlOutput).toBeDefined()
  })

  it("exports theme as JSON with --format json", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    themeExportCommand(undefined, testDir, { format: "json" })

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const jsonOutput = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]))
        return parsed.name === "test-theme"
      } catch {
        return false
      }
    })
    expect(jsonOutput).toBeDefined()
  })

  it("outputs structured JSON with --json flag (yaml format)", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    themeExportCommand(undefined, testDir, { json: true })

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const jsonOutput = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]))
        return parsed.success === true && parsed.yaml !== undefined
      } catch {
        return false
      }
    })
    expect(jsonOutput).toBeDefined()
  })

  it("outputs structured JSON with --json --format json", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    themeExportCommand(undefined, testDir, { json: true, format: "json" })

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const jsonOutput = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]))
        return parsed.success === true && parsed.theme !== undefined
      } catch {
        return false
      }
    })
    expect(jsonOutput).toBeDefined()
    const parsed = JSON.parse(String(jsonOutput![0]))
    expect(parsed.theme.name).toBe("test-theme")
  })

  it("reads from a custom file path", () => {
    const customPath = join(testDir, "custom-theme.yaml")
    writeFileSync(customPath, VALID_YAML, "utf-8")

    themeExportCommand("custom-theme.yaml", testDir, {})

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const yamlOutput = calls.find((call: unknown[]) => {
      const str = String(call[0])
      return str.includes("name:") && str.includes("test-theme")
    })
    expect(yamlOutput).toBeDefined()
  })

  it("exits with code 2 for missing file", () => {
    expect(() => {
      themeExportCommand("nonexistent.yaml", testDir, {})
    }).toThrow("process.exit(2)")
  })

  it("exits with code 2 for missing file (--json)", () => {
    expect(() => {
      themeExportCommand("nonexistent.yaml", testDir, { json: true })
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

  it("produces deterministic output", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    themeExportCommand(undefined, testDir, { json: true, format: "json" })
    themeExportCommand(undefined, testDir, { json: true, format: "json" })

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const jsonCalls = calls.filter((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]))
        return parsed.success === true
      } catch {
        return false
      }
    })

    expect(jsonCalls.length).toBeGreaterThanOrEqual(2)
    expect(String(jsonCalls[0]![0])).toBe(String(jsonCalls[1]![0]))
  })
})
