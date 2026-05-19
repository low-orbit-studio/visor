import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync, symlinkSync } from "fs"
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

/**
 * Hand-authored theme-config.ts shape — mirrors what the repo tracks after VI-168.
 * Sync will replace only the STOCK_GROUPS marker block.
 */
const THEME_CONFIG_HAND_AUTHORED = `// Hand-authored. Edit STOCK_GROUPS only by running \`visor theme sync\`.
import { customThemeGroups } from "./theme-config.custom.generated";

export interface ThemeEntry {
  value: string;
  label: string;
  yamlFile?: string;
  defaultMode?: "dark" | "light";
}

export interface ThemeGroup {
  label: string;
  themes: ThemeEntry[];
}

/* BEGIN visor-stock-themes — managed by \`visor theme sync\` */
const STOCK_GROUPS: ThemeGroup[] = [
  {
    label: "Visor",
    themes: [
      { value: "blackout", label: "Blackout", yamlFile: "blackout" },
    ],
  },
];
/* END visor-stock-themes */

export const THEME_GROUPS: ThemeGroup[] = [...STOCK_GROUPS, ...customThemeGroups];
export const ALL_THEMES = THEME_GROUPS.flatMap((g) => g.themes.map((t) => t.value));
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
  writeFileSync(join(docsLib, "theme-config.ts"), THEME_CONFIG_HAND_AUTHORED, "utf-8")
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

    it("updates STOCK_GROUPS marker block in theme-config.ts with stock themes", () => {
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

    it("preserves hand-authored code outside marker block", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      // Hand-authored import and exports must be preserved
      expect(config).toContain('import { customThemeGroups }')
      expect(config).toContain('export const THEME_GROUPS')
      expect(config).toContain('export const ALL_THEMES')
    })

    it("does NOT include Custom or Low Orbit groups in theme-config.ts STOCK_GROUPS", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      // Custom groups belong only in the overlay, not the tracked file
      const stockBegin = config.indexOf("BEGIN visor-stock-themes")
      const stockEnd = config.indexOf("END visor-stock-themes")
      const managedRegion = config.slice(stockBegin, stockEnd)
      expect(managedRegion).not.toContain('"Client"')
      expect(managedRegion).not.toContain('"Low Orbit"')
    })

    it("updates globals.css with stock-only theme imports wrapped in marker comments", () => {
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

    it("Visor group appears before Client group in STOCK_GROUPS region of theme-config.ts", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR)

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      // "Visor" should be in stock block; "Client" should NOT be in stock block
      const stockBegin = config.indexOf("BEGIN visor-stock-themes")
      const stockEnd = config.indexOf("END visor-stock-themes")
      const stockRegion = config.slice(stockBegin, stockEnd)
      expect(stockRegion).toContain('"Visor"')
      expect(stockRegion).not.toContain('"Client"')
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
  })

  describe("idempotency", () => {
    it("produces identical tracked file output on second run", () => {
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

    it("does not duplicate globals.css stock imports on second run", () => {
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

    it("does not duplicate overlay @import line on second run", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})
      themeSyncCommand(testDir, {})

      const globals = readFileSync(
        join(testDir, "packages", "docs", "app", "globals.css"),
        "utf-8",
      )
      const matches = globals.match(/@import '\.\/custom-themes\.generated\.css';/g)
      expect(matches).toHaveLength(1)
    })
  })

  describe("overlay file generation", () => {
    it("writes custom overlay CSS when custom-themes/ is populated", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR)

      themeSyncCommand(testDir, {})

      const overlayCss = readFileSync(
        join(testDir, "packages", "docs", "app", "custom-themes.generated.css"),
        "utf-8",
      )
      expect(overlayCss).toContain("@import './entr-theme.css';")
      expect(overlayCss).not.toContain("@import './blackout-theme.css';")
    })

    it("writes custom overlay TS when custom-themes/ is populated", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR)
      writeCustomYaml("reference-app.visor.yaml", CUSTOM_YAML_REFERENCE)

      themeSyncCommand(testDir, {})

      const overlayTs = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.custom.generated.ts"),
        "utf-8",
      )
      expect(overlayTs).toContain('value: "entr"')
      expect(overlayTs).toContain('"Client"')
      expect(overlayTs).toContain('value: "reference-app"')
      expect(overlayTs).toContain('"Low Orbit"')
    })

    it("tracked files are unchanged (stock-only) when custom-themes/ is populated", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      // First sync with stock only — snapshot tracked files
      themeSyncCommand(testDir, {})
      const configAfterStockSync = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      const globalsAfterStockSync = readFileSync(
        join(testDir, "packages", "docs", "app", "globals.css"),
        "utf-8",
      )

      // Now add custom themes and re-sync
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR)
      themeSyncCommand(testDir, {})

      // Tracked files must be byte-identical — custom themes must not appear
      expect(readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )).toBe(configAfterStockSync)
      expect(readFileSync(
        join(testDir, "packages", "docs", "app", "globals.css"),
        "utf-8",
      )).toBe(globalsAfterStockSync)
    })

    it("writes empty placeholder overlay CSS when custom-themes/ is missing", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      // No custom-themes dir

      themeSyncCommand(testDir, {})

      const overlayCss = readFileSync(
        join(testDir, "packages", "docs", "app", "custom-themes.generated.css"),
        "utf-8",
      )
      // Empty placeholder — no @import lines, just a comment
      expect(overlayCss).toContain("empty when no custom themes")
      expect(overlayCss).not.toMatch(/@import '\.\/\w/)
    })

    it("writes empty array overlay TS when custom-themes/ is missing", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})

      const overlayTs = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.custom.generated.ts"),
        "utf-8",
      )
      expect(overlayTs).toContain("customThemeGroups: ThemeGroup[] = []")
    })

    it("globals.css has overlay @import immediately after END visor-theme-imports marker", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})

      const globals = readFileSync(
        join(testDir, "packages", "docs", "app", "globals.css"),
        "utf-8",
      )
      const endMarker = "/* END visor-theme-imports */"
      const endIdx = globals.indexOf(endMarker)
      expect(endIdx).toBeGreaterThan(-1)

      const afterMarker = globals.slice(endIdx + endMarker.length)
      // The next non-whitespace content should be the overlay @import
      expect(afterMarker.trimStart()).toMatch(/^@import '\.\/custom-themes\.generated\.css';/)
    })

    it("stock YAML edit updates only the STOCK_GROUPS marker region, not hand-authored code", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      themeSyncCommand(testDir, {})

      const configV1 = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )

      // Extract the portions outside the managed region
      const getOutsideMarkers = (content: string) => {
        const beginIdx = content.indexOf("BEGIN visor-stock-themes")
        const endIdx = content.indexOf("END visor-stock-themes") + "END visor-stock-themes */".length
        return content.slice(0, beginIdx) + content.slice(endIdx)
      }

      writeStockYaml("neutral.visor.yaml", STOCK_YAML_NEUTRAL)
      themeSyncCommand(testDir, {})

      const configV2 = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )

      // STOCK_GROUPS block changed (neutral added)
      expect(configV2).toContain('value: "neutral"')
      // Hand-authored code outside the markers is byte-identical
      expect(getOutsideMarkers(configV1)).toBe(getOutsideMarkers(configV2))
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

    it("removes unregistered theme from STOCK_GROUPS in theme-config.ts", () => {
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

    it("does not delete the overlay CSS file during stale cleanup", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      themeSyncCommand(testDir, {})

      // Run again — overlay file must survive stale cleanup
      themeSyncCommand(testDir, {})

      expect(existsSync(
        join(testDir, "packages", "docs", "app", "custom-themes.generated.css")
      )).toBe(true)
    })
  })

  describe("handles existing theme imports in globals.css", () => {
    it("replaces existing theme import block with marked block (stock-only)", () => {
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
      // Only blackout should be in the managed block (neutral and entr were removed)
      expect(globals).toContain("@import './blackout-theme.css';")
      expect(globals).not.toContain("@import './neutral-theme.css';")
      // entr is custom — should not appear in the stock block
      expect(globals).not.toContain("@import './entr-theme.css';")
    })
  })

  describe("gitignore (no-op assertion — D7)", () => {
    it("does not modify .gitignore when custom themes are added (D7)", () => {
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR)

      const before = readFileSync(join(testDir, ".gitignore"), "utf-8")
      themeSyncCommand(testDir, {})
      const after = readFileSync(join(testDir, ".gitignore"), "utf-8")

      // .gitignore must be byte-identical — sync no longer touches it (per BO-29 D7)
      expect(after).toBe(before)
    })

    it("preserves a legacy managed block exactly when present (D7)", () => {
      // Legacy managed block from before BO-29 — sync must NOT touch it
      writeFileSync(join(testDir, ".gitignore"), GITIGNORE_WITH_BLOCK, "utf-8")
      writeCustomYaml("reference-app.visor.yaml", CUSTOM_YAML_REFERENCE)

      themeSyncCommand(testDir, {})

      const gitignore = readFileSync(join(testDir, ".gitignore"), "utf-8")
      // Legacy block content survives unchanged — sync no longer manages it
      expect(gitignore).toBe(GITIGNORE_WITH_BLOCK)
    })
  })

  describe("theme-config.ts output", () => {
    it("does NOT include auto-generation header (file is now hand-authored)", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      themeSyncCommand(testDir, {})

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      // Old "auto-generated" header should not be present
      expect(config).not.toContain("auto-generated by `visor theme sync`. Do not edit manually")
      // The STOCK_GROUPS marker confirms sync still manages the block
      expect(config).toContain("BEGIN visor-stock-themes")
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
      // Overlay files should not be created in dry-run
      expect(existsSync(join(testDir, "packages", "docs", "app", "custom-themes.generated.css"))).toBe(false)
    })

    it("reports customOverlayCss and customOverlayTs in dry-run JSON changes", () => {
      const logs: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg))

      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      themeSyncCommand(testDir, { dryRun: true, json: true })

      const result = JSON.parse(logs[0])
      expect(result.success).toBe(true)
      expect(result.dryRun).toBe(true)
      expect(result.changes.customOverlayCss).toBeDefined()
      expect(result.changes.customOverlayTs).toBeDefined()
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
    it("hard-fails with actionable D5 message when no theme sources discovered", () => {
      // themes/ exists but is empty, no env var, no sibling, no custom-themes/
      expect(() => themeSyncCommand(testDir, {})).toThrow("process.exit(1)")

      // No CSS should be generated and any pre-existing CSS must survive (D6)
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

  describe("group field handling", () => {
    it("uses YAML group field to assign to correct group", () => {
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR) // group: Client

      themeSyncCommand(testDir, {})

      // Custom group should appear in the overlay TS, NOT in tracked theme-config.ts STOCK_GROUPS
      const overlayTs = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.custom.generated.ts"),
        "utf-8",
      )
      expect(overlayTs).toContain('"Client"')
      expect(overlayTs).toContain('"entr"')
    })

    it("defaults to 'Custom' group for custom themes without a group field", () => {
      writeCustomYaml("mystery.visor.yaml", CUSTOM_YAML_NO_GROUP)

      themeSyncCommand(testDir, {})

      const overlayTs = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.custom.generated.ts"),
        "utf-8",
      )
      expect(overlayTs).toContain('"Custom"')
      expect(overlayTs).toContain('value: "mystery-theme"')
    })

    it("creates groups that do not exist in any current config", () => {
      writeCustomYaml("reference-app.visor.yaml", CUSTOM_YAML_REFERENCE) // group: Low Orbit

      themeSyncCommand(testDir, {})

      const overlayTs = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.custom.generated.ts"),
        "utf-8",
      )
      expect(overlayTs).toContain('"Low Orbit"')
      expect(overlayTs).toContain('value: "reference-app"')
    })
  })

  // ============================================================
  // VI-321 — external visor-themes-private discovery
  // ============================================================

  describe("D1 — external source discovery", () => {
    function writeNestedTheme(rootDir: string, slug: string, yaml: string): string {
      const themeDir = join(rootDir, slug)
      mkdirSync(themeDir, { recursive: true })
      const filePath = join(themeDir, "theme.visor.yaml")
      writeFileSync(filePath, yaml, "utf-8")
      return filePath
    }

    it("VISOR_THEMES_PRIVATE_PATH env var: discovers nested-layout themes", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      const externalDir = join(testDir, "external-themes")
      mkdirSync(externalDir, { recursive: true })
      writeNestedTheme(externalDir, "entr", CUSTOM_YAML_ENTR)

      const previousEnv = process.env.VISOR_THEMES_PRIVATE_PATH
      process.env.VISOR_THEMES_PRIVATE_PATH = externalDir
      try {
        themeSyncCommand(testDir, {})
      } finally {
        if (previousEnv === undefined) delete process.env.VISOR_THEMES_PRIVATE_PATH
        else process.env.VISOR_THEMES_PRIVATE_PATH = previousEnv
      }

      const docsApp = join(testDir, "packages", "docs", "app")
      expect(existsSync(join(docsApp, "entr-theme.css"))).toBe(true)
    })

    it("nested layout uses parent dirname as slug, ignoring legacy filename", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      const externalDir = join(testDir, "external-themes")
      mkdirSync(externalDir, { recursive: true })
      // The yaml's `name` field is "entr" but the dir name is "strata"
      writeNestedTheme(externalDir, "strata", CUSTOM_YAML_ENTR)

      const previousEnv = process.env.VISOR_THEMES_PRIVATE_PATH
      process.env.VISOR_THEMES_PRIVATE_PATH = externalDir
      try {
        themeSyncCommand(testDir, {})
      } finally {
        if (previousEnv === undefined) delete process.env.VISOR_THEMES_PRIVATE_PATH
        else process.env.VISOR_THEMES_PRIVATE_PATH = previousEnv
      }

      const overlayTs = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.custom.generated.ts"),
        "utf-8",
      )
      // Slug must come from the dirname, not the YAML name field
      expect(overlayTs).toContain('value: "strata"')
      expect(overlayTs).not.toContain('value: "entr"')

      // Public YAML copy uses the slug as filename (avoids `theme.visor.yaml` collisions)
      const publicYaml = join(testDir, "packages", "docs", "public", "themes", "strata.visor.yaml")
      expect(existsSync(publicYaml)).toBe(true)
    })

    it("env var pointing at non-existent path: hard-fail with actionable error", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      const previousEnv = process.env.VISOR_THEMES_PRIVATE_PATH
      process.env.VISOR_THEMES_PRIVATE_PATH = join(testDir, "does-not-exist")

      const errors: string[] = []
      vi.spyOn(console, "error").mockImplementation((msg) => errors.push(String(msg)))

      try {
        expect(() => themeSyncCommand(testDir, {})).toThrow("process.exit(1)")
      } finally {
        if (previousEnv === undefined) delete process.env.VISOR_THEMES_PRIVATE_PATH
        else process.env.VISOR_THEMES_PRIVATE_PATH = previousEnv
      }

      expect(errors.join("\n")).toContain("VISOR_THEMES_PRIVATE_PATH")
      expect(errors.join("\n")).toContain("does not exist")
    })

    it("legacy custom-themes/ still works and emits a deprecation warning", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR)

      const warnings: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => warnings.push(String(msg)))

      themeSyncCommand(testDir, {})

      const docsApp = join(testDir, "packages", "docs", "app")
      expect(existsSync(join(docsApp, "entr-theme.css"))).toBe(true)
      expect(warnings.join("\n")).toMatch(/Deprecated legacy custom-themes\//)
    })

    it("env var wins over legacy custom-themes/ for the same slug (D8)", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      // Legacy entry
      writeCustomYaml("entr.visor.yaml", CUSTOM_YAML_ENTR)
      // External entry with the SAME slug, different content (different group label)
      const externalDir = join(testDir, "external-themes")
      mkdirSync(externalDir, { recursive: true })
      writeNestedTheme(
        externalDir,
        "entr",
        `name: entr\nversion: 1\ngroup: Sibling-Wins\ncolors:\n  primary: "#22C56D"\n`,
      )

      const warnings: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => warnings.push(String(msg)))

      const previousEnv = process.env.VISOR_THEMES_PRIVATE_PATH
      process.env.VISOR_THEMES_PRIVATE_PATH = externalDir
      try {
        themeSyncCommand(testDir, {})
      } finally {
        if (previousEnv === undefined) delete process.env.VISOR_THEMES_PRIVATE_PATH
        else process.env.VISOR_THEMES_PRIVATE_PATH = previousEnv
      }

      // Sibling-Wins group must appear in overlay (env source won)
      const overlayTs = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.custom.generated.ts"),
        "utf-8",
      )
      expect(overlayTs).toContain('"Sibling-Wins"')
      expect(overlayTs).not.toContain('"Client"')

      // Duplicate-slug warning must name the suppressed legacy file
      expect(warnings.join("\n")).toMatch(/Duplicate theme slug "entr"/)
      expect(warnings.join("\n")).toContain("ignoring legacy")
    })
  })

  // ============================================================
  // BO-29 — parent-glob discovery (one-level-deeper)
  // ============================================================

  describe("BO-29 D1/D2 — parent-glob discovery (one-level-deeper)", () => {
    /**
     * Build an isolated parent tree containing a Visor checkout at
     * `<parent>/visor/`. The parent dir is the scope the parent-glob scan
     * walks — keeping it scoped to a unique tmpdir avoids picking up real
     * `visor-themes-private/` directories on the developer's machine.
     */
    function setupIsolatedParent(): { parentDir: string; visorRoot: string } {
      const parentDir = join(tmpdir(), `visor-test-parentglob-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      const visorRoot = join(parentDir, "visor")
      mkdirSync(visorRoot, { recursive: true })
      setupFakeRepo(visorRoot)
      // Stock theme so empty-manifest hard-fail doesn't trigger
      writeFileSync(join(visorRoot, "themes", "blackout.visor.yaml"), STOCK_YAML_BLACKOUT, "utf-8")
      return { parentDir, visorRoot }
    }

    function writeNestedTheme(rootDir: string, slug: string, yaml: string): string {
      const themeDir = join(rootDir, slug)
      mkdirSync(themeDir, { recursive: true })
      const filePath = join(themeDir, "theme.visor.yaml")
      writeFileSync(filePath, yaml, "utf-8")
      return filePath
    }

    function writeParentGlobSource(parentDir: string, parentName: string, slug: string, yaml: string): string {
      const themesDir = join(parentDir, parentName, "visor-themes-private", "themes")
      mkdirSync(themesDir, { recursive: true })
      writeNestedTheme(themesDir, slug, yaml)
      return themesDir
    }

    function writeSiblingSource(parentDir: string, slug: string, yaml: string): string {
      const themesDir = join(parentDir, "visor-themes-private", "themes")
      mkdirSync(themesDir, { recursive: true })
      writeNestedTheme(themesDir, slug, yaml)
      return themesDir
    }

    let parentDir: string
    let visorRoot: string

    beforeEach(() => {
      const setup = setupIsolatedParent()
      parentDir = setup.parentDir
      visorRoot = setup.visorRoot
    })

    afterEach(() => {
      rmSync(parentDir, { recursive: true, force: true })
    })

    it("only one-level-deeper exists → discovery uses it (LO convention)", () => {
      writeParentGlobSource(parentDir, "low-orbit", "entr", CUSTOM_YAML_ENTR)

      themeSyncCommand(visorRoot, {})

      const docsApp = join(visorRoot, "packages", "docs", "app")
      expect(existsSync(join(docsApp, "entr-theme.css"))).toBe(true)
    })

    it("only true-sibling exists → discovery uses it (regression cover)", () => {
      writeSiblingSource(parentDir, "entr", CUSTOM_YAML_ENTR)

      themeSyncCommand(visorRoot, {})

      const docsApp = join(visorRoot, "packages", "docs", "app")
      expect(existsSync(join(docsApp, "entr-theme.css"))).toBe(true)
    })

    it("both true-sibling and one-level-deeper exist → prefers true-sibling and warns naming the suppressed path (D2)", () => {
      const siblingDir = writeSiblingSource(
        parentDir,
        "entr",
        `name: entr\nversion: 1\ngroup: SiblingWins\ncolors:\n  primary: "#22C56D"\n`,
      )
      const parentGlobDir = writeParentGlobSource(
        parentDir,
        "low-orbit",
        "entr",
        `name: entr\nversion: 1\ngroup: ParentGlobLoses\ncolors:\n  primary: "#22C56D"\n`,
      )

      const warnings: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => warnings.push(String(msg)))

      themeSyncCommand(visorRoot, {})

      const overlayTs = readFileSync(
        join(visorRoot, "packages", "docs", "lib", "theme-config.custom.generated.ts"),
        "utf-8",
      )
      // True-sibling group wins
      expect(overlayTs).toContain('"SiblingWins"')
      expect(overlayTs).not.toContain('"ParentGlobLoses"')

      // Warning names the suppressed parent-glob path
      const combined = warnings.join("\n")
      expect(combined).toContain("one-level-deeper")
      expect(combined).toContain(parentGlobDir)
      expect(combined).toContain(siblingDir)
    })

    it("multiple one-level-deeper candidates → picks alphabetically first and warns naming the rest (D2)", () => {
      // Create three candidates — alphabetical order: alpha-org, low-orbit, zulu-org
      const alphaDir = writeParentGlobSource(parentDir, "alpha-org", "entr", CUSTOM_YAML_ENTR)
      const loDir = writeParentGlobSource(
        parentDir,
        "low-orbit",
        "entr",
        `name: entr\nversion: 1\ngroup: LoLoses\ncolors:\n  primary: "#22C56D"\n`,
      )
      const zuluDir = writeParentGlobSource(
        parentDir,
        "zulu-org",
        "entr",
        `name: entr\nversion: 1\ngroup: ZuluLoses\ncolors:\n  primary: "#22C56D"\n`,
      )

      const warnings: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => warnings.push(String(msg)))

      themeSyncCommand(visorRoot, {})

      const overlayTs = readFileSync(
        join(visorRoot, "packages", "docs", "lib", "theme-config.custom.generated.ts"),
        "utf-8",
      )
      // alpha-org is first alphabetically — its CUSTOM_YAML_ENTR has group: Client
      expect(overlayTs).toContain('"Client"')
      expect(overlayTs).not.toContain('"LoLoses"')
      expect(overlayTs).not.toContain('"ZuluLoses"')

      // Warnings name the suppressed candidates and reference the chosen one
      const combined = warnings.join("\n")
      expect(combined).toContain("Multiple one-level-deeper")
      expect(combined).toContain(alphaDir)
      expect(combined).toContain(loDir)
      expect(combined).toContain(zuluDir)
    })

    it("D2 warning surfaces in JSON mode result.warnings array when sibling suppresses parent-glob", () => {
      const siblingDir = writeSiblingSource(
        parentDir,
        "entr",
        `name: entr\nversion: 1\ngroup: SiblingWins\ncolors:\n  primary: "#22C56D"\n`,
      )
      const parentGlobDir = writeParentGlobSource(
        parentDir,
        "low-orbit",
        "entr",
        `name: entr\nversion: 1\ngroup: ParentGlobLoses\ncolors:\n  primary: "#22C56D"\n`,
      )

      const logs: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => logs.push(String(msg)))

      themeSyncCommand(visorRoot, { json: true })

      expect(logs.length).toBe(1)
      const result = JSON.parse(logs[0])
      expect(result.success).toBe(true)
      expect(result.warnings).toBeDefined()
      const warningsText = (result.warnings as string[]).join("\n")
      expect(warningsText).toContain("one-level-deeper")
      expect(warningsText).toContain(parentGlobDir)
      expect(warningsText).toContain(siblingDir)
    })

    it("scanNestedThemeDir picks up symlinked theme subdirectories (consistency with parent-glob)", () => {
      // Real theme directory at <parent>/source-themes/entr/theme.visor.yaml
      const sourceDir = join(parentDir, "source-themes")
      mkdirSync(sourceDir, { recursive: true })
      writeNestedTheme(sourceDir, "entr", CUSTOM_YAML_ENTR)

      // Sibling layout, but the entr slug dir is a symlink to source-themes/entr/
      const siblingThemes = join(parentDir, "visor-themes-private", "themes")
      mkdirSync(siblingThemes, { recursive: true })
      symlinkSync(join(sourceDir, "entr"), join(siblingThemes, "entr"))

      themeSyncCommand(visorRoot, {})

      const docsApp = join(visorRoot, "packages", "docs", "app")
      // The symlinked theme should be picked up — silent skip would mean no entr-theme.css
      expect(existsSync(join(docsApp, "entr-theme.css"))).toBe(true)
    })

    it("defensive: a stray visor-themes-private/ inside the Visor checkout is NOT picked up", () => {
      // Place a visor-themes-private dir inside the Visor checkout itself —
      // this would match the parent-glob pattern but should be filtered out.
      const insideVisorDir = join(visorRoot, "visor-themes-private", "themes")
      mkdirSync(insideVisorDir, { recursive: true })
      writeNestedTheme(insideVisorDir, "entr", CUSTOM_YAML_ENTR)

      // No real sibling and no real parent-glob source — should hard-fail
      // (proving the inside-visor candidate was filtered, not used as a fallback).
      // Strip the stock YAML so empty-manifest D5 hard-fail triggers.
      rmSync(join(visorRoot, "themes", "blackout.visor.yaml"))

      expect(() => themeSyncCommand(visorRoot, {})).toThrow("process.exit(1)")
    })

    it("env var overrides both true-sibling and one-level-deeper (regression cover)", () => {
      const externalDir = join(parentDir, "external-themes")
      mkdirSync(externalDir, { recursive: true })
      writeNestedTheme(
        externalDir,
        "entr",
        `name: entr\nversion: 1\ngroup: EnvWins\ncolors:\n  primary: "#22C56D"\n`,
      )

      writeSiblingSource(
        parentDir,
        "entr",
        `name: entr\nversion: 1\ngroup: SiblingLoses\ncolors:\n  primary: "#22C56D"\n`,
      )
      writeParentGlobSource(
        parentDir,
        "low-orbit",
        "entr",
        `name: entr\nversion: 1\ngroup: ParentGlobLoses\ncolors:\n  primary: "#22C56D"\n`,
      )

      const previousEnv = process.env.VISOR_THEMES_PRIVATE_PATH
      process.env.VISOR_THEMES_PRIVATE_PATH = externalDir
      try {
        themeSyncCommand(visorRoot, {})
      } finally {
        if (previousEnv === undefined) delete process.env.VISOR_THEMES_PRIVATE_PATH
        else process.env.VISOR_THEMES_PRIVATE_PATH = previousEnv
      }

      const overlayTs = readFileSync(
        join(visorRoot, "packages", "docs", "lib", "theme-config.custom.generated.ts"),
        "utf-8",
      )
      expect(overlayTs).toContain('"EnvWins"')
      expect(overlayTs).not.toContain('"SiblingLoses"')
      expect(overlayTs).not.toContain('"ParentGlobLoses"')
    })

    it("neither sibling nor parent-glob present + no env var → hard-fails per D5 (no regression)", () => {
      const errors: string[] = []
      vi.spyOn(console, "error").mockImplementation((msg) => errors.push(String(msg)))

      // Strip the stock blackout YAML so empty-manifest D5 hard-fail triggers.
      // The isolated parent has no sibling, no parent-glob, no env var, no legacy.
      rmSync(join(visorRoot, "themes", "blackout.visor.yaml"))

      expect(() => themeSyncCommand(visorRoot, {})).toThrow("process.exit(1)")

      const combined = errors.join("\n")
      expect(combined).toContain("VISOR_THEMES_PRIVATE_PATH")
      expect(combined).toContain("One-level-deeper")
    })
  })

  describe("D6 — guarded stale CSS removal", () => {
    it("never removes CSS files when total manifest is empty", () => {
      const docsApp = join(testDir, "packages", "docs", "app")
      // Pre-existing custom CSS that would be wiped by a naive empty-manifest sync
      writeFileSync(join(docsApp, "private-theme-theme.css"), ".private {}", "utf-8")
      writeFileSync(join(docsApp, "another-theme.css"), ".another {}", "utf-8")

      // No themes/, no custom-themes/, no env var, no sibling
      expect(() => themeSyncCommand(testDir, {})).toThrow("process.exit(1)")

      // Both pre-existing CSS files must survive the failed run
      expect(existsSync(join(docsApp, "private-theme-theme.css"))).toBe(true)
      expect(existsSync(join(docsApp, "another-theme.css"))).toBe(true)
    })

    it("with one theme present, removes only stale slugs (does not wipe everything)", () => {
      const docsApp = join(testDir, "packages", "docs", "app")
      writeFileSync(join(docsApp, "old-theme-theme.css"), ".old-theme {}", "utf-8")

      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      themeSyncCommand(testDir, {})

      // Stale slug removed; current slug present
      expect(existsSync(join(docsApp, "old-theme-theme.css"))).toBe(false)
      expect(existsSync(join(docsApp, "blackout-theme.css"))).toBe(true)
    })
  })

  describe("D7 — broken symlink detection", () => {
    it("hard-fails with the symlink path AND target reported", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)

      // Create a dangling symlink inside themes/ pointing at a non-existent target
      const themesDir = join(testDir, "themes")
      const linkPath = join(themesDir, "dangling.visor.yaml")
      const linkTarget = join(testDir, "this-target-does-not-exist", "phantom.visor.yaml")
      symlinkSync(linkTarget, linkPath)

      const errors: string[] = []
      vi.spyOn(console, "error").mockImplementation((msg) => errors.push(String(msg)))

      expect(() => themeSyncCommand(testDir, {})).toThrow("process.exit(1)")

      const combined = errors.join("\n")
      expect(combined).toContain("Broken symlink")
      expect(combined).toContain(linkPath)
      expect(combined).toContain(linkTarget)
    })

    it("dangling symlink in custom-themes/ also fails loudly", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      const customDir = join(testDir, "custom-themes")
      mkdirSync(customDir, { recursive: true })
      const linkPath = join(customDir, "ghost.visor.yaml")
      const linkTarget = join(testDir, "phantom-target.visor.yaml")
      symlinkSync(linkTarget, linkPath)

      expect(() => themeSyncCommand(testDir, {})).toThrow("process.exit(1)")
    })
  })

  // ============================================================
  // VI-422 — per-theme error isolation (continue past broken themes)
  // ============================================================

  describe("VI-422 — per-theme error isolation", () => {
    const BROKEN_YAML = "name: broken\nversion: 1\n# missing colors\n"

    it("syncs healthy themes when one stock theme has malformed YAML (exit non-zero)", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeStockYaml("broken.visor.yaml", BROKEN_YAML)

      expect(() => themeSyncCommand(testDir, {})).toThrow("process.exit(1)")

      const docsApp = join(testDir, "packages", "docs", "app")
      expect(existsSync(join(docsApp, "blackout-theme.css"))).toBe(true)
      expect(existsSync(join(docsApp, "broken-theme.css"))).toBe(false)
    })

    it("JSON mode reports failures alongside succeeded themes with success:false", () => {
      const logs: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => logs.push(String(msg)))

      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeStockYaml("broken.visor.yaml", BROKEN_YAML)

      expect(() => themeSyncCommand(testDir, { json: true })).toThrow("process.exit(1)")

      expect(logs.length).toBe(1)
      const result = JSON.parse(logs[0])
      expect(result.success).toBe(false)
      expect(result.themes).toBe(1)
      expect(result.slugs).toContain("blackout")
      expect(result.failures).toBeDefined()
      expect(result.failures.length).toBeGreaterThanOrEqual(1)
      expect(result.failures[0].filePath).toContain("broken.visor.yaml")
      expect(result.failures[0].error).toBeTruthy()
    })

    it("text mode emits structured summary with succeeded/failed counts and file path", () => {
      const errors: string[] = []
      vi.spyOn(console, "error").mockImplementation((msg) => errors.push(String(msg)))

      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeStockYaml("broken.visor.yaml", BROKEN_YAML)

      expect(() => themeSyncCommand(testDir, {})).toThrow("process.exit(1)")

      const combined = errors.join("\n")
      expect(combined).toMatch(/1 succeeded, 1 failed/)
      expect(combined).toContain("broken.visor.yaml")
      expect(combined).toContain("Failed:")
    })

    it("registers only successful themes in theme-config.ts when one fails", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeStockYaml("broken.visor.yaml", BROKEN_YAML)

      expect(() => themeSyncCommand(testDir, {})).toThrow("process.exit(1)")

      const config = readFileSync(
        join(testDir, "packages", "docs", "lib", "theme-config.ts"),
        "utf-8",
      )
      expect(config).toContain('value: "blackout"')
      expect(config).not.toContain('value: "broken"')
    })

    it("registers only successful themes in globals.css when one fails", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeStockYaml("broken.visor.yaml", BROKEN_YAML)

      expect(() => themeSyncCommand(testDir, {})).toThrow("process.exit(1)")

      const globals = readFileSync(
        join(testDir, "packages", "docs", "app", "globals.css"),
        "utf-8",
      )
      expect(globals).toContain("@import './blackout-theme.css';")
      expect(globals).not.toContain("@import './broken-theme.css';")
    })

    it("isolates a broken custom theme; healthy stock theme still syncs", () => {
      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeCustomYaml("broken.visor.yaml", BROKEN_YAML)

      expect(() => themeSyncCommand(testDir, {})).toThrow("process.exit(1)")

      const docsApp = join(testDir, "packages", "docs", "app")
      expect(existsSync(join(docsApp, "blackout-theme.css"))).toBe(true)
      expect(existsSync(join(docsApp, "broken-theme.css"))).toBe(false)
    })

    it("manifest-empty guard: when every theme fails, exits non-zero and preserves pre-existing CSS (D6)", () => {
      const docsApp = join(testDir, "packages", "docs", "app")
      // Pre-existing CSS that must survive a fully failed run
      writeFileSync(join(docsApp, "survivor-theme.css"), ".survivor {}", "utf-8")

      writeStockYaml("broken.visor.yaml", BROKEN_YAML)

      expect(() => themeSyncCommand(testDir, {})).toThrow("process.exit(1)")

      expect(existsSync(join(docsApp, "survivor-theme.css"))).toBe(true)
    })

    it("dry-run with partial failures reports failures in JSON and exits non-zero", () => {
      const logs: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => logs.push(String(msg)))

      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeStockYaml("broken.visor.yaml", BROKEN_YAML)

      expect(() => themeSyncCommand(testDir, { dryRun: true, json: true })).toThrow("process.exit(1)")

      const result = JSON.parse(logs[0])
      expect(result.success).toBe(false)
      expect(result.dryRun).toBe(true)
      expect(result.failures).toBeDefined()
      expect(result.failures.length).toBeGreaterThanOrEqual(1)
    })

    it("all-healthy run is unchanged: exit 0, no failure summary", () => {
      const errors: string[] = []
      vi.spyOn(console, "error").mockImplementation((msg) => errors.push(String(msg)))

      writeStockYaml("blackout.visor.yaml", STOCK_YAML_BLACKOUT)
      writeStockYaml("neutral.visor.yaml", STOCK_YAML_NEUTRAL)

      // Should not throw — exit 0 path is the default no-op for the spy
      expect(() => themeSyncCommand(testDir, {})).not.toThrow()
      expect(errors.join("\n")).not.toMatch(/succeeded, \d+ failed/)
    })
  })

  describe("D5 — empty-source actionable message", () => {
    it("error message includes env var name, sibling path, and clone command", () => {
      const errors: string[] = []
      vi.spyOn(console, "error").mockImplementation((msg) => errors.push(String(msg)))

      expect(() => themeSyncCommand(testDir, {})).toThrow("process.exit(1)")

      const combined = errors.join("\n")
      expect(combined).toContain("VISOR_THEMES_PRIVATE_PATH")
      expect(combined).toContain("visor-themes-private")
      expect(combined).toContain("git clone git@github.com:low-orbit-studio/visor-themes-private.git")
    })

    it("JSON mode emits the actionable error in success:false envelope", () => {
      const logs: string[] = []
      vi.spyOn(console, "log").mockImplementation((msg) => logs.push(String(msg)))

      expect(() => themeSyncCommand(testDir, { json: true })).toThrow("process.exit(1)")

      const result = JSON.parse(logs[0])
      expect(result.success).toBe(false)
      expect(result.error).toContain("VISOR_THEMES_PRIVATE_PATH")
    })
  })
})
