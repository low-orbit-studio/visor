import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { themeRegisterCommand } from "../commands/theme-register.js"

const VALID_YAML = `
name: test-theme
version: 1
colors:
  primary: "#2563EB"
`

const SECOND_YAML = `
name: alpha-theme
version: 1
colors:
  primary: "#7C3AED"
`

const GLOBALS_CSS_INITIAL = `@import 'fumadocs-ui/style.css';
@import '../../tokens/dist/tokens.css';
@import './blackout-theme.css';
@import './neutral-theme.css';
@import './space-theme.css';

/* some styles */
:root { color: red; }
`

const THEME_CONFIG_INITIAL = `export interface ThemeEntry {
  value: string;
  label: string;
}

export interface ThemeGroup {
  label: string;
  themes: ThemeEntry[];
}

export const THEME_GROUPS: ThemeGroup[] = [
  {
    label: "Visor",
    themes: [
      { value: "blackout", label: "Blackout" },
      { value: "neutral", label: "Neutral" },
      { value: "space", label: "Space" },
    ],
  },
  {
    label: "Client",
    themes: [
      { value: "kaiah", label: "Kaiah" },
    ],
  },
];

export const ALL_THEMES = THEME_GROUPS.flatMap((g) => g.themes.map((t) => t.value));
`

let testDir: string
let repoRoot: string
let docsAppDir: string
let docsLibDir: string
let globalsPath: string
let themeConfigPath: string

function mockProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`)
  }) as never)
}

function setupFakeRepo(testRoot: string) {
  const docsApp = join(testRoot, "packages", "docs", "app")
  const docsLib = join(testRoot, "packages", "docs", "lib")
  mkdirSync(docsApp, { recursive: true })
  mkdirSync(docsLib, { recursive: true })
  writeFileSync(join(docsApp, "globals.css"), GLOBALS_CSS_INITIAL, "utf-8")
  writeFileSync(join(docsLib, "theme-config.ts"), THEME_CONFIG_INITIAL, "utf-8")
  return { docsApp, docsLib }
}

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-register-${Date.now()}`)
  mkdirSync(testDir, { recursive: true })

  // Create a fake repo structure inside testDir
  repoRoot = testDir
  const { docsApp, docsLib } = setupFakeRepo(repoRoot)
  docsAppDir = docsApp
  docsLibDir = docsLib
  globalsPath = join(docsApp, "globals.css")
  themeConfigPath = join(docsLib, "theme-config.ts")

  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
  mockProcessExit()
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

function writeYaml(filename: string, content: string) {
  const path = join(testDir, filename)
  writeFileSync(path, content, "utf-8")
  return path
}

describe("theme register command", () => {
  describe("basic registration", () => {
    it("creates the CSS file in packages/docs/app/", () => {
      writeYaml(".visor.yaml", VALID_YAML)
      themeRegisterCommand(".visor.yaml", testDir, { group: "Client" })

      const cssPath = join(docsAppDir, "test-theme-theme.css")
      expect(existsSync(cssPath)).toBe(true)
      const css = readFileSync(cssPath, "utf-8")
      expect(css).toContain(".test-theme-theme {")
    })

    it("adds @import to globals.css", () => {
      writeYaml(".visor.yaml", VALID_YAML)
      themeRegisterCommand(".visor.yaml", testDir, { group: "Client" })

      const globals = readFileSync(globalsPath, "utf-8")
      expect(globals).toContain("@import './test-theme-theme.css';")
    })

    it("adds theme entry to theme-config.ts", () => {
      writeYaml(".visor.yaml", VALID_YAML)
      themeRegisterCommand(".visor.yaml", testDir, { group: "Client" })

      const config = readFileSync(themeConfigPath, "utf-8")
      expect(config).toContain('value: "test-theme"')
      expect(config).toContain('label: "Test Theme"')
    })
  })

  describe("alphabetical ordering", () => {
    it("inserts globals.css import in alphabetical order", () => {
      writeYaml(".visor.yaml", SECOND_YAML) // alpha-theme — should go before blackout-theme
      themeRegisterCommand(".visor.yaml", testDir, { group: "Client" })

      const globals = readFileSync(globalsPath, "utf-8")
      const alphaIdx = globals.indexOf("@import './alpha-theme-theme.css';")
      const blackoutIdx = globals.indexOf("@import './blackout-theme.css';")
      expect(alphaIdx).toBeGreaterThan(-1)
      expect(alphaIdx).toBeLessThan(blackoutIdx)
    })

    it("inserts theme-config.ts entry in alphabetical order", () => {
      writeYaml(".visor.yaml", SECOND_YAML) // alpha-theme — should go before kaiah
      themeRegisterCommand(".visor.yaml", testDir, { group: "Client" })

      const config = readFileSync(themeConfigPath, "utf-8")
      const alphaIdx = config.indexOf('"alpha-theme"')
      const kaiahIdx = config.indexOf('"kaiah"')
      expect(alphaIdx).toBeGreaterThan(-1)
      expect(alphaIdx).toBeLessThan(kaiahIdx)
    })
  })

  describe("idempotency", () => {
    it("is idempotent — second run produces no changes", () => {
      writeYaml(".visor.yaml", VALID_YAML)
      themeRegisterCommand(".visor.yaml", testDir, { group: "Client" })

      const globalsAfterFirst = readFileSync(globalsPath, "utf-8")
      const configAfterFirst = readFileSync(themeConfigPath, "utf-8")
      const cssAfterFirst = readFileSync(join(docsAppDir, "test-theme-theme.css"), "utf-8")

      themeRegisterCommand(".visor.yaml", testDir, { group: "Client" })

      expect(readFileSync(globalsPath, "utf-8")).toBe(globalsAfterFirst)
      expect(readFileSync(themeConfigPath, "utf-8")).toBe(configAfterFirst)
      expect(readFileSync(join(docsAppDir, "test-theme-theme.css"), "utf-8")).toBe(cssAfterFirst)
    })

    it("does not duplicate globals.css import on second run", () => {
      writeYaml(".visor.yaml", VALID_YAML)
      themeRegisterCommand(".visor.yaml", testDir, { group: "Client" })
      themeRegisterCommand(".visor.yaml", testDir, { group: "Client" })

      const globals = readFileSync(globalsPath, "utf-8")
      const matches = globals.match(/@import '\.\/test-theme-theme\.css';/g)
      expect(matches).toHaveLength(1)
    })

    it("does not duplicate theme-config.ts entry on second run", () => {
      writeYaml(".visor.yaml", VALID_YAML)
      themeRegisterCommand(".visor.yaml", testDir, { group: "Client" })
      themeRegisterCommand(".visor.yaml", testDir, { group: "Client" })

      const config = readFileSync(themeConfigPath, "utf-8")
      const matches = config.match(/value: "test-theme"/g)
      expect(matches).toHaveLength(1)
    })
  })

  describe("dry run", () => {
    it("does not write any files in dry-run mode", () => {
      writeYaml(".visor.yaml", VALID_YAML)
      themeRegisterCommand(".visor.yaml", testDir, { group: "Client", dryRun: true })

      expect(existsSync(join(docsAppDir, "test-theme-theme.css"))).toBe(false)
      expect(readFileSync(globalsPath, "utf-8")).toBe(GLOBALS_CSS_INITIAL)
      expect(readFileSync(themeConfigPath, "utf-8")).toBe(THEME_CONFIG_INITIAL)
    })

    it("reports what would change in dry-run --json mode", () => {
      const logs: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg))

      writeYaml(".visor.yaml", VALID_YAML)
      themeRegisterCommand(".visor.yaml", testDir, { group: "Client", dryRun: true, json: true })

      expect(logs.length).toBe(1)
      const result = JSON.parse(logs[0])
      expect(result.success).toBe(true)
      expect(result.dryRun).toBe(true)
      expect(result.slug).toBe("test-theme")
      expect(result.changes.cssFile.changed).toBe(true)
      expect(result.changes.globalsCSS.changed).toBe(true)
      expect(result.changes.themeConfig.changed).toBe(true)
    })
  })

  describe("json output", () => {
    it("outputs structured JSON on success", () => {
      const logs: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg))

      writeYaml(".visor.yaml", VALID_YAML)
      themeRegisterCommand(".visor.yaml", testDir, { group: "Client", json: true })

      expect(logs.length).toBe(1)
      const result = JSON.parse(logs[0])
      expect(result.success).toBe(true)
      expect(result.slug).toBe("test-theme")
      expect(result.group).toBe("Client")
    })
  })

  describe("error handling", () => {
    it("exits with code 2 for missing YAML file", () => {
      expect(() =>
        themeRegisterCommand("nonexistent.yaml", testDir, { group: "Client" })
      ).toThrow("process.exit(2)")
    })

    it("outputs JSON error for missing file in --json mode", () => {
      const logs: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg))

      expect(() =>
        themeRegisterCommand("nonexistent.yaml", testDir, { group: "Client", json: true })
      ).toThrow("process.exit(2)")

      expect(logs.length).toBeGreaterThan(0)
      const result = JSON.parse(logs[0])
      expect(result.success).toBe(false)
    })

    it("exits with error for unknown group", () => {
      writeYaml(".visor.yaml", VALID_YAML)
      expect(() =>
        themeRegisterCommand(".visor.yaml", testDir, { group: "NonExistentGroup" })
      ).toThrow("process.exit(1)")
    })
  })
})
