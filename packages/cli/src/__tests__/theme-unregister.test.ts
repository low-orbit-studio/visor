import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { themeUnregisterCommand } from "../commands/theme-unregister.js"

const GLOBALS_WITH_THEME = `@import 'fumadocs-ui/style.css';
@import '../../tokens/dist/tokens.css';
@import './entr-theme.css';
@import './kaiah-theme.css';
@import './neutral-theme.css';

/* styles */
`

const THEME_CONFIG_WITH_THEME = `export const THEME_GROUPS = [
  {
    label: "Client",
    themes: [
      { value: "entr", label: "ENTR" },
      { value: "kaiah", label: "Kaiah" },
    ],
  },
];
`

const CSS_CONTENT = `.entr-theme { --color-primary-500: #22c56d; }`

let testDir: string
let docsAppDir: string
let docsLibDir: string
let globalsPath: string
let themeConfigPath: string
let cssFilePath: string

function mockProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`)
  }) as never)
}

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-unregister-${Date.now()}`)
  docsAppDir = join(testDir, "packages", "docs", "app")
  docsLibDir = join(testDir, "packages", "docs", "lib")
  mkdirSync(docsAppDir, { recursive: true })
  mkdirSync(docsLibDir, { recursive: true })

  globalsPath = join(docsAppDir, "globals.css")
  themeConfigPath = join(docsLibDir, "theme-config.ts")
  cssFilePath = join(docsAppDir, "entr-theme.css")

  writeFileSync(globalsPath, GLOBALS_WITH_THEME, "utf-8")
  writeFileSync(themeConfigPath, THEME_CONFIG_WITH_THEME, "utf-8")
  writeFileSync(cssFilePath, CSS_CONTENT, "utf-8")

  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
  mockProcessExit()
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe("theme unregister command", () => {
  describe("basic unregistration", () => {
    it("removes the CSS file", () => {
      themeUnregisterCommand("entr", testDir, {})
      expect(existsSync(cssFilePath)).toBe(false)
    })

    it("removes the @import from globals.css", () => {
      themeUnregisterCommand("entr", testDir, {})
      const globals = readFileSync(globalsPath, "utf-8")
      expect(globals).not.toContain("@import './entr-theme.css';")
    })

    it("removes the theme entry from theme-config.ts", () => {
      themeUnregisterCommand("entr", testDir, {})
      const config = readFileSync(themeConfigPath, "utf-8")
      expect(config).not.toContain('"entr"')
    })

    it("preserves other themes in globals.css", () => {
      themeUnregisterCommand("entr", testDir, {})
      const globals = readFileSync(globalsPath, "utf-8")
      expect(globals).toContain("@import './kaiah-theme.css';")
      expect(globals).toContain("@import './neutral-theme.css';")
    })

    it("preserves other themes in theme-config.ts", () => {
      themeUnregisterCommand("entr", testDir, {})
      const config = readFileSync(themeConfigPath, "utf-8")
      expect(config).toContain('"kaiah"')
    })
  })

  describe("no-op when theme not registered", () => {
    it("does nothing when theme is not registered", () => {
      const beforeGlobals = readFileSync(globalsPath, "utf-8")
      const beforeConfig = readFileSync(themeConfigPath, "utf-8")

      themeUnregisterCommand("nonexistent-theme", testDir, {})

      expect(readFileSync(globalsPath, "utf-8")).toBe(beforeGlobals)
      expect(readFileSync(themeConfigPath, "utf-8")).toBe(beforeConfig)
    })
  })

  describe("json output", () => {
    it("outputs structured JSON on success", () => {
      const logs: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg))

      themeUnregisterCommand("entr", testDir, { json: true })

      expect(logs.length).toBe(1)
      const result = JSON.parse(logs[0])
      expect(result.success).toBe(true)
      expect(result.slug).toBe("entr")
      expect(result.changes.cssFile).toBe(true)
      expect(result.changes.globalsCSS).toBe(true)
      expect(result.changes.themeConfig).toBe(true)
    })

    it("reports no changes when theme not registered (json)", () => {
      const logs: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg))

      themeUnregisterCommand("nonexistent", testDir, { json: true })

      expect(logs.length).toBe(1)
      const result = JSON.parse(logs[0])
      expect(result.success).toBe(true)
      expect(result.changes.cssFile).toBe(false)
      expect(result.changes.globalsCSS).toBe(false)
      expect(result.changes.themeConfig).toBe(false)
    })
  })

  describe("error handling", () => {
    it("exits with error when repo root not found", () => {
      // Use a temp dir that has no packages/docs
      const isolated = join(tmpdir(), `visor-isolated-${Date.now()}`)
      mkdirSync(isolated, { recursive: true })
      try {
        expect(() =>
          themeUnregisterCommand("entr", isolated, {})
        ).toThrow("process.exit(1)")
      } finally {
        rmSync(isolated, { recursive: true, force: true })
      }
    })
  })
})
