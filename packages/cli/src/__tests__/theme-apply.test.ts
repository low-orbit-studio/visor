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

  it("nextjs adapter with --scope-prefix wraps rules in the supplied selector (VI-368)", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    themeApplyCommand(".visor.yaml", testDir, {
      adapter: "nextjs",
      scopePrefix: "body.blacklight-theme",
    })

    const outputPath = join(testDir, "globals.css")
    const css = readFileSync(outputPath, "utf-8")
    expect(css).toContain("body.blacklight-theme {")
    expect(css).toContain("body.blacklight-theme.dark")
    expect(css).not.toMatch(/\n:root \{/)
  })

  it("nextjs adapter without --scope-prefix keeps :root output (backward compat)", () => {
    const yamlPath = join(testDir, ".visor.yaml")
    writeFileSync(yamlPath, VALID_YAML, "utf-8")

    themeApplyCommand(".visor.yaml", testDir, { adapter: "nextjs" })

    const outputPath = join(testDir, "globals.css")
    const css = readFileSync(outputPath, "utf-8")
    expect(css).toContain(":root")
  })

  describe("--target-path (VI-601 blessed-manifest dispatch)", () => {
    const MANIFEST_BASE = {
      shape: "admin-ui",
      pattern: "test",
      base_theme: "reference-app",
      requires_visor: ">=1.15.0",
      captures_baseline: "captures/approved/",
      three_gates_status: "passing",
    }

    it("dispatches themes-css-dir to <path>/<themeId>.css", () => {
      const yamlPath = join(testDir, ".visor.yaml")
      writeFileSync(yamlPath, VALID_YAML, "utf-8")
      const buildDir = join(testDir, "build")
      mkdirSync(buildDir, { recursive: true })
      writeFileSync(
        join(buildDir, "blessed-manifest.json"),
        JSON.stringify({
          ...MANIFEST_BASE,
          theme_apply_target: {
            kind: "themes-css-dir",
            path: "app/styles/themes",
          },
        })
      )

      themeApplyCommand(".visor.yaml", testDir, {
        adapter: "nextjs",
        targetPath: buildDir,
      })

      const css = readFileSync(
        join(buildDir, "app", "styles", "themes", "test-theme.css"),
        "utf-8"
      )
      expect(css).toContain("--color-primary-")
    })

    it("dispatches globals-css (backward compat) at app/globals.css", () => {
      const yamlPath = join(testDir, ".visor.yaml")
      writeFileSync(yamlPath, VALID_YAML, "utf-8")
      const buildDir = join(testDir, "build2")
      mkdirSync(buildDir, { recursive: true })
      writeFileSync(
        join(buildDir, "blessed-manifest.json"),
        JSON.stringify(MANIFEST_BASE)
      )

      themeApplyCommand(".visor.yaml", testDir, {
        adapter: "nextjs",
        targetPath: buildDir,
      })

      const css = readFileSync(join(buildDir, "app", "globals.css"), "utf-8")
      expect(css).toContain("--color-primary-")
    })

    it("errors when --target-path is used without --adapter nextjs", () => {
      const yamlPath = join(testDir, ".visor.yaml")
      writeFileSync(yamlPath, VALID_YAML, "utf-8")
      const buildDir = join(testDir, "build3")
      mkdirSync(buildDir, { recursive: true })
      writeFileSync(
        join(buildDir, "blessed-manifest.json"),
        JSON.stringify(MANIFEST_BASE)
      )

      expect(() =>
        themeApplyCommand(".visor.yaml", testDir, {
          adapter: "fumadocs",
          targetPath: buildDir,
        })
      ).toThrow(/process\.exit\(1\)/)
    })

    it("errors clearly when the build root has no blessed-manifest.json", () => {
      const yamlPath = join(testDir, ".visor.yaml")
      writeFileSync(yamlPath, VALID_YAML, "utf-8")
      const buildDir = join(testDir, "build4")
      mkdirSync(buildDir, { recursive: true })

      expect(() =>
        themeApplyCommand(".visor.yaml", testDir, {
          adapter: "nextjs",
          targetPath: buildDir,
        })
      ).toThrow(/process\.exit\(2\)/)
    })
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
        existsSync(join(outputDir, "lib/src/colors/visor_colors.dart"))
      ).toBe(true)
      expect(
        existsSync(join(outputDir, "lib/src/theme/visor_theme.dart"))
      ).toBe(true)
    })

    it("generated visor_colors.dart imports visor_core and declares VisorColors", () => {
      const yamlPath = join(testDir, ".visor.yaml")
      writeFileSync(yamlPath, VALID_YAML, "utf-8")

      themeApplyCommand(".visor.yaml", testDir, {
        adapter: "flutter",
        output: "packages/ui",
      })

      const dart = readFileSync(
        join(testDir, "packages/ui/lib/src/colors/visor_colors.dart"),
        "utf-8"
      )
      expect(dart).toContain("import 'package:visor_core/visor_core.dart';")
      expect(dart).toContain("sealed class VisorColors")
      expect(dart).toContain("static final VisorColorsData light")
      expect(dart).toContain("static final VisorColorsData dark")
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
      expect(existsSync(join(outputDir, "lib/src/colors/visor_colors.dart"))).toBe(true)
      expect(existsSync(join(outputDir, "pubspec.yaml"))).toBe(false)
      expect(existsSync(join(outputDir, "lib/src/theme/visor_theme.dart"))).toBe(false)
    })

    it("respects --package-name flag", () => {
      const yamlPath = join(testDir, ".visor.yaml")
      writeFileSync(yamlPath, VALID_YAML, "utf-8")

      themeApplyCommand(".visor.yaml", testDir, {
        adapter: "flutter",
        output: "packages/ui",
        packageName: "space_ui",
      })

      const pubspec = readFileSync(
        join(testDir, "packages/ui/pubspec.yaml"),
        "utf-8"
      )
      expect(pubspec).toContain("name: space_ui")
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
      expect(parsed.files).toContain("lib/src/colors/visor_colors.dart")
      expect(parsed.size).toBeGreaterThan(0)
    })
  })
})
