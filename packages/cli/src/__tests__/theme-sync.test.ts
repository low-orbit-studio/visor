import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { themeSyncCommand } from "../commands/theme-sync.js"

// ============================================================
// Fixtures
// ============================================================

const STOCK_YAML_BLACKOUT = `
name: blackout
version: 1
group: Visor

colors:
  primary: "#666666"
  background: "#000000"
  surface: "#0a0a0a"
`

const STOCK_YAML_NEUTRAL = `
name: neutral
version: 1
group: Visor

colors:
  primary: "#1798ad"
`

const CUSTOM_YAML_ENTR = `
name: entr
version: 1
group: Client

colors:
  primary: "#22C56D"
`

const CUSTOM_YAML_REFERENCE = `
name: reference-app
version: 1
group: Low Orbit

colors:
  primary: "#1A5F7A"
`

const CUSTOM_YAML_NO_GROUP = `
name: mystery-theme
version: 1

colors:
  primary: "#FF0000"
`

const GLOBALS_CSS_INITIAL = `@import 'fumadocs-ui/style.css';
@import '../../tokens/dist/tokens.css';

/* some styles */
:root { color: red; }
`

const GLOBALS_CSS_WITH_EXISTING_IMPORTS = `@import 'fumadocs-ui/style.css';
@import '../../tokens/dist/tokens.css';
@import './blackout-theme.css';
@import './entr-theme.css';
@import './neutral-theme.css';

/* some styles */
:root { color: red; }
`

const GITIGNORE_INITIAL = `# Dependencies
node_modules/

# OS files
.DS_Store
`

const GITIGNORE_WITH_BLOCK = `# Dependencies
node_modules/

# Custom themes
custom-themes/

# BEGIN visor-custom-theme-css (managed by \`visor theme sync\` — do not edit manually)
packages/docs/app/entr-theme.css
# END visor-custom-theme-css
`

// ============================================================
// Test Setup
// ============================================================

let testDir: string

function mockProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`)
  }) as never)
}

function setupFakeRepo(root: string) {
  const docsApp = join(root, "packages", "docs", "app")
  const docsLib = join(root, "packages", "docs", "lib")
  const docsPublicThemes = join(root, "packages", "docs", "public", "themes")
  const themesDir = join(root, "themes")
  const gitignorePath = join(root, ".gitignore")

  mkdirSync(docsApp, { recursive: true })
  mkdirSync(docsLib, { recursive: true })
  mkdirSync(docsPublicThemes, { recursive: true })
  mkdirSync(themesDir, { recursive: true })

  writeFileSync(join(docsApp, "globals.css"), GLOBALS_CSS_INITIAL, "utf-8")
  writeFileSync(
    join(docsLib, "theme-config.ts"),
    `export const THEME_GROUPS: any[] = [];\nexport const ALL_THEMES: string[] = [];\n`,
    "utf-8",
  )
  writeFileSync(gitignorePath, GITIGNORE_INITIAL, "utf-8")

  return { docsApp, docsLib, docsPublicThemes, themesDir, gitignorePath }
}

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-sync-${Date.now()}`)
  mkdirSync(testDir, { recursive: true })
  setupFakeRepo(testDir)

  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
  mockProcessExit()
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

function writeStockYaml(filename: string, content: string) {
  const path = join(testDir, "themes", filename)
  writeFileSync(path, content, "utf-8")
  return path
}

function writeCustomYaml(filename: string, content: string) {
  const customDir = join(testDir, "custom-themes")
  mkdirSync(customDir, { recursive: true })
  const path = join(customDir, filename)
  writeFileSync(path, content, "utf-8")
  return path
}

// ============================================================
// Tests
// ============================================================

describe("theme sync command", () => {
  describe("stock themes only", () => {
    it("generates CSS files for all stock themes", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeStockYaml("neutral.visor.yaml", STOCK_YAML_NEUTRAL)

      themeSyncCommand(testDir, {})

      const docsApp = join(testDir, "packages", "docs", "app")
      expect(existsSync(join(docsApp, "blackout-theme.css"))).toBe(true)
      expect(existsSync(join(docsApp, "neutral-theme.css"))).toBe(true)
    })

    it("generates correct CSS class scope", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})

      const css = readFileSync(
        join(testDir, "packages", "docs", "app", "blackout-theme.css"),
        "utf-8",
      )
      expect(css).toContain(".blackout-theme {")
    })

    it("generates theme-config.ts with Visor group", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeStockYaml("neutral.visor.yaml", STOCK_YAML_NEUTRAL)

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      expect(config).toContain('"Visor"')
      expect(config).toContain('value: "blackout"')
      expect(config).toContain('value: "neutral"')
    })

    it("does NOT include a Custom or Low Orbit group when no custom themes exist", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      expect(config).not.toContain('"Client"')
      expect(config).not.toContain('"Low Orbit"')
    })

    it("updates globals.css with theme imports wrapped in marker comments", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})

      const globals = readFileSync(
        join(testDir, "packages", "docs", "app", "globals.css"),
        "utf-8",
      )
      expect(globals).toContain("BEGIN visor-theme-imports")
      expect(globals).toContain("END visor-theme-imports")
      expect(globals).toContain("@import './blackout-theme.css';")
    })

    it("copies YAMLs to packages/docs/public/themes/", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})

      const publicYaml = join(
        testDir,
        "packages", "docs", "public", "themes", "blackout.visor.yaml",
      )
      expect(existsSync(publicYaml)).toBe(true)
    })

    it("gracefully handles missing custom-themes/ directory", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      // No custom-themes dir created

      expect(() => themeSyncCommand(testDir, {})).not.toThrow()

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      expect(config).toContain('value: "blackout"')
    })
  })

  describe("stock + custom themes", () => {
    it("generates CSS for both stock and custom themes", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR)

      themeSyncCommand(testDir, {})

      const docsApp = join(testDir, "packages", "docs", "app")
      expect(existsSync(join(docsApp, "blackout-theme.css"))).toBe(true)
      expect(existsSync(join(docsApp, "entr-theme.css"))).toBe(true)
    })

    it("places themes in correct groups from YAML group field", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR)
      writeCustomYaml("reference-app.visor.yaml", CUSTOM_YAML_REFERENCE)

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      expect(config).toContain('"Visor"')
      expect(config).toContain('"Client"')
      expect(config).toContain('"Low Orbit"')
      expect(config).toContain('value: "blackout"')
      expect(config).toContain('value: "entr"')
      expect(config).toContain('value: "reference-app"')
    })

    it("Visor group appears before Client group in theme-config.ts", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR)

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      const visorIdx = config.indexOf('"Visor"')
      const clientIdx = config.indexOf('"Client"')
      expect(visorIdx).toBeLessThan(clientIdx)
    })

    it("themes within each group are sorted alphabetically", () => {
      writeStockYaml("neutral.visor.yaml", STOCK_YAML_NEUTRAL)
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      const blackoutIdx = config.indexOf('"blackout"')
      const neutralIdx = config.indexOf('"neutral"')
      expect(blackoutIdx).toBeLessThan(neutralIdx)
    })
  })

  describe("group field handling", () => {
    it("uses YAML group field to assign to correct group", () => {
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR) // group: Client

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      const clientIdx = config.indexOf('"Client"')
      const entrIdx = config.indexOf('"entr"')
      expect(clientIdx).toBeGreaterThan(-1)
      expect(entrIdx).toBeGreaterThan(clientIdx) // entr appears after "Client" label
    })

    it("defaults to 'Visor' group for stock themes without a group field", () => {
      const noGroupStock = `name: plain\nversion: 1\ncolors:\n  primary: "#ff0000"\n`
      writeStockYaml("plain.visor.yaml", noGroupStock)

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      expect(config).toContain('"Visor"')
      expect(config).toContain('value: "plain"')
    })

    it("defaults to 'Custom' group for custom themes without a group field", () => {
      writeCustomYaml("mystery.visor.yaml", CUSTOM_YAML_NO_GROUP)

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      expect(config).toContain('"Custom"')
      expect(config).toContain('value: "mystery-theme"')
    })

    it("creates groups that do not exist in any current config", () => {
      writeCustomYaml("reference-app.visor.yaml", CUSTOM_YAML_REFERENCE) // group: Low Orbit

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      expect(config).toContain('"Low Orbit"')
      expect(config).toContain('value: "reference-app"')
    })
  })

  describe("idempotency", () => {
    it("produces identical output on second run", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR)

      themeSyncCommand(testDir, {})
      const configAfterFirst = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      const globalsAfterFirst = readFileSync(
        join(testDir, "packages", "docs", "app", "globals.css"),
        "utf-8",
      )

      themeSyncCommand(testDir, {})
      expect(readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )).toBe(configAfterFirst)
      expect(readFileSync(
        join(testDir, "packages", "docs", "app", "globals.css"),
        "utf-8",
      )).toBe(globalsAfterFirst)
    })

    it("does not duplicate globals.css imports on second run", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})
      themeSyncCommand(testDir, {})

      const globals = readFileSync(
        join(testDir, "packages", "docs", "app", "globals.css"),
        "utf-8",
      )
      const matches = globals.match(/@import '\.\/blackout-theme\.css';/g)
      expect(matches).toHaveLength(1)
    })
  })

  describe("theme removal (stale cleanup)", () => {
    it("deletes CSS for a theme whose YAML was removed", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeStockYaml("neutral.visor.yaml", STOCK_YAML_NEUTRAL)
      themeSyncCommand(testDir, {})

      // Remove neutral
      rmSync(join(testDir, "themes", "neutral.visor.yaml"))
      themeSyncCommand(testDir, {})

      const docsApp = join(testDir, "packages", "docs", "app")
      expect(existsSync(join(docsApp, "blackout-theme.css"))).toBe(true)
      expect(existsSync(join(docsApp, "neutral-theme.css"))).toBe(false)
    })

    it("removes unregistered theme from theme-config.ts", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeStockYaml("neutral.visor.yaml", STOCK_YAML_NEUTRAL)
      themeSyncCommand(testDir, {})

      rmSync(join(testDir, "themes", "neutral.visor.yaml"))
      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      expect(config).toContain('value: "blackout"')
      expect(config).not.toContain('value: "neutral"')
    })

    it("removes import for deleted theme from globals.css", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeStockYaml("neutral.visor.yaml", STOCK_YAML_NEUTRAL)
      themeSyncCommand(testDir, {})

      rmSync(join(testDir, "themes", "neutral.visor.yaml"))
      themeSyncCommand(testDir, {})

      const globals = readFileSync(
        join(testDir, "packages", "docs", "app", "globals.css"),
        "utf-8",
      )
      expect(globals).toContain("@import './blackout-theme.css';")
      expect(globals).not.toContain("@import './neutral-theme.css';")
    })

    it("cleans up pre-existing stale CSS files not in the manifest", () => {
      // Pre-create a CSS file for an unmanaged theme
      const docsApp = join(testDir, "packages", "docs", "app")
      writeFileSync(join(docsApp, "old-theme-theme.css"), ".old-theme-theme {}", "utf-8")

      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      themeSyncCommand(testDir, {})

      expect(existsSync(join(docsApp, "old-theme-theme.css"))).toBe(false)
    })
  })

  describe("handles existing theme imports in globals.css", () => {
    it("replaces existing theme import block with marked block", () => {
      writeFileSync(
        join(testDir, "packages", "docs", "app", "globals.css"),
        GLOBALS_CSS_WITH_EXISTING_IMPORTS,
        "utf-8",
      )
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})

      const globals = readFileSync(
        join(testDir, "packages", "docs", "app", "globals.css"),
        "utf-8",
      )
      expect(globals).toContain("BEGIN visor-theme-imports")
      expect(globals).toContain("END visor-theme-imports")
      // Only blackout should be present now (neutral and entr were removed)
      expect(globals).toContain("@import './blackout-theme.css';")
      expect(globals).not.toContain("@import './neutral-theme.css';")
      expect(globals).not.toContain("@import './entr-theme.css';")
    })
  })

  describe("gitignore management", () => {
    it("adds custom theme CSS to gitignore block", () => {
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR)

      themeSyncCommand(testDir, {})

      const gitignore = readFileSync(join(testDir, ".gitignore"), "utf-8")
      expect(gitignore).toContain("BEGIN visor-custom-theme-css")
      expect(gitignore).toContain("packages/docs/app/entr-theme.css")
      expect(gitignore).toContain("END visor-custom-theme-css")
    })

    it("updates existing gitignore block on re-sync", () => {
      writeFileSync(join(testDir, ".gitignore"), GITIGNORE_WITH_BLOCK, "utf-8")
      writeCustomYaml("reference-app.visor.yaml", CUSTOM_YAML_REFERENCE)

      themeSyncCommand(testDir, {})

      const gitignore = readFileSync(join(testDir, ".gitignore"), "utf-8")
      expect(gitignore).toContain("packages/docs/app/reference-app-theme.css")
      // Old entry (entr) should be replaced with new content
      expect(gitignore).not.toContain("packages/docs/app/entr-theme.css")
    })
  })

  describe("theme-config.ts output", () => {
    it("includes auto-generation header", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      expect(config).toContain("auto-generated by `visor theme sync`")
    })

    it("includes yamlFile field for public/themes reference", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      expect(config).toContain('yamlFile: "blackout"')
    })

    it("exports THEME_GROUPS and ALL_THEMES", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      expect(config).toContain("export const THEME_GROUPS")
      expect(config).toContain("export const ALL_THEMES")
    })
  })

  describe("dry run", () => {
    it("does not write any files in dry-run mode", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      const originalConfig = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      const originalGlobals = readFileSync(
        join(testDir, "packages", "docs", "app", "globals.css"),
        "utf-8",
      )

      themeSyncCommand(testDir, { dryRun: true })

      expect(readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )).toBe(originalConfig)
      expect(readFileSync(
        join(testDir, "packages", "docs", "app", "globals.css"),
        "utf-8",
      )).toBe(originalGlobals)
      expect(existsSync(join(testDir, "packages", "docs", "app", "blackout-theme.css"))).toBe(false)
    })
  })

  describe("json output", () => {
    it("outputs structured JSON on success", () => {
      const logs: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg))

      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR)

      themeSyncCommand(testDir, { json: true })

      expect(logs.length).toBe(1)
      const result = JSON.parse(logs[0])
      expect(result.success).toBe(true)
      expect(result.themes).toBe(2)
      expect(result.stock).toBe(1)
      expect(result.custom).toBe(1)
      expect(result.slugs).toContain("blackout")
      expect(result.slugs).toContain("entr")
    })

    it("outputs structured JSON for dry run", () => {
      const logs: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg))

      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, { dryRun: true, json: true })

      expect(logs.length).toBe(1)
      const result = JSON.parse(logs[0])
      expect(result.success).toBe(true)
      expect(result.dryRun).toBe(true)
      expect(result.changes.themesDiscovered).toHaveLength(1)
    })
  })

  describe("error handling", () => {
    it("warns and returns when no YAMLs found", () => {
      // themes/ dir exists but is empty — should not throw, just warn
      expect(() => themeSyncCommand(testDir, {})).not.toThrow()

      // No CSS should be generated
      const docsApp = join(testDir, "packages", "docs", "app")
      const cssFiles = readdirSync(docsApp).filter((f) => f.endsWith("-theme.css"))
      expect(cssFiles).toHaveLength(0)
    })

    it("reports error for invalid YAML via JSON", () => {
      const logs: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg))

      writeStockYaml("bad.visor.yaml", "name: bad\nversion: 1\n# missing colors")

      expect(() => themeSyncCommand(testDir, { json: true })).toThrow("process.exit(1)")

      expect(logs.length).toBeGreaterThan(0)
      const result = JSON.parse(logs[0])
      expect(result.success).toBe(false)
    })
  })
})
