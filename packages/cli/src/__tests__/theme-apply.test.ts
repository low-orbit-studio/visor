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

  it("generates NextJS adapter output with --adapter nextjs", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    themeApplyCommand(".visor.yaml", testDir, { adapter: "nextjs" })

    const outputPath = join(testDir, "globals.css")
    expect(existsSync(outputPath)).toBe(true)
    const css = readFileSync(outputPath, "utf-8")
    expect(css).toContain("@layer visor-primitives")
  })

  it("generates fumadocs adapter output with --adapter fumadocs", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    themeApplyCommand(".visor.yaml", testDir, { adapter: "fumadocs" })

    const outputPath = join(testDir, "visor-fumadocs-bridge.css")
    expect(existsSync(outputPath)).toBe(true)
    const css = readFileSync(outputPath, "utf-8")
    expect(css).toContain("--color-fd-background:")
  })

  it("generates deck adapter output with --adapter deck", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    themeApplyCommand(".visor.yaml", testDir, { adapter: "deck" })

    const outputPath = join(testDir, "visor-deck-test-theme.css")
    expect(existsSync(outputPath)).toBe(true)
    const css = readFileSync(outputPath, "utf-8")
    expect(css).toContain(".deck--test-theme")
  })

  it("adapter JSON output includes adapter name", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    themeApplyCommand(".visor.yaml", testDir, { json: true, adapter: "nextjs" })

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
    expect(parsed.adapter).toBe("nextjs")
    expect(parsed.size).toBeGreaterThan(0)
  })

  describe("flutter adapter", () => {
    it("writes a directory tree with --adapter flutter", () => {
      const yamlPath = join(testDir, ".visor.yaml")
      writeFileSync(yamlPath, VALID_YAML, "utf-8")

      themeApplyCommand(".visor.yaml", testDir, {
        adapter: "flutter",
        output: "packages/ui",
      })

      const outputDir = join(testDir, "packages/ui")
      expect(existsSync(outputDir)).toBe(true)
      expect(existsSync(join(outputDir, "pubspec.yaml"))).toBe(true)
      expect(existsSync(join(outputDir, "lib/ui.dart"))).toBe(true)
      expect(
        existsSync(join(outputDir, "lib/src/colors/ui_colors.dart"))
      ).toBe(true)
      expect(
        existsSync(join(outputDir, "lib/src/theme/ui_theme.dart"))
      ).toBe(true)
    })

    it("generated ui_colors.dart imports visor_core and declares UIColors", () => {
      const yamlPath = join(testDir, ".visor.yaml")
      writeFileSync(yamlPath, VALID_YAML, "utf-8")

      themeApplyCommand(".visor.yaml", testDir, {
        adapter: "flutter",
        output: "packages/ui",
      })

      const dart = readFileSync(
        join(testDir, "packages/ui/lib/src/colors/ui_colors.dart"),
        "utf-8"
      )
      expect(dart).toContain("import 'package:visor_core/visor_core.dart';")
      expect(dart).toContain("sealed class UIColors")
      expect(dart).toContain("static final VisorColors light")
      expect(dart).toContain("static final VisorColors dark")
    })

    it("respects --tokens-only flag", () => {
      const yamlPath = join(testDir, ".visor.yaml")
      writeFileSync(yamlPath, VALID_YAML, "utf-8")

      themeApplyCommand(".visor.yaml", testDir, {
        adapter: "flutter",
        output: "packages/ui",
        tokensOnly: true,
      })

      const outputDir = join(testDir, "packages/ui")
      expect(existsSync(join(outputDir, "lib/src/colors/ui_colors.dart"))).toBe(true)
      expect(existsSync(join(outputDir, "pubspec.yaml"))).toBe(false)
      expect(existsSync(join(outputDir, "lib/src/theme/ui_theme.dart"))).toBe(false)
    })

    it("respects --package-name flag", () => {
      const yamlPath = join(testDir, ".visor.yaml")
      writeFileSync(yamlPath, VALID_YAML, "utf-8")

      themeApplyCommand(".visor.yaml", testDir, {
        adapter: "flutter",
        output: "packages/ui",
        packageName: "solespark_ui",
      })

      const pubspec = readFileSync(
        join(testDir, "packages/ui/pubspec.yaml"),
        "utf-8"
      )
      expect(pubspec).toContain("name: solespark_ui")
    })

    it("uses default output directory packages/ui when none supplied", () => {
      const yamlPath = join(testDir, ".visor.yaml")
      writeFileSync(yamlPath, VALID_YAML, "utf-8")

      themeApplyCommand(".visor.yaml", testDir, { adapter: "flutter" })

      expect(existsSync(join(testDir, "packages/ui/pubspec.yaml"))).toBe(true)
    })

    it("emits structured JSON with file list when --json", () => {
      const yamlPath = join(testDir, ".visor.yaml")
      writeFileSync(yamlPath, VALID_YAML, "utf-8")

      themeApplyCommand(".visor.yaml", testDir, {
        adapter: "flutter",
        output: "packages/ui",
        json: true,
      })

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.find((call: unknown[]) => {
        try {
          const parsed = JSON.parse(String(call[0]))
          return parsed.success === true && parsed.adapter === "flutter"
        } catch {
          return false
        }
      })

      expect(jsonOutput).toBeDefined()
      const parsed = JSON.parse(String(jsonOutput![0]))
      expect(parsed.directory).toContain("packages/ui")
      expect(Array.isArray(parsed.files)).toBe(true)
      expect(parsed.files).toContain("lib/src/colors/ui_colors.dart")
      expect(parsed.size).toBeGreaterThan(0)
    })
  })
})
