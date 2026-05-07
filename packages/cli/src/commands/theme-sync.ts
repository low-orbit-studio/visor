import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  unlinkSync,
  copyFileSync,
} from "fs"
import { join, basename, resolve } from "path"
import { parse as parseYaml } from "yaml"
import { generateThemeData } from "@loworbitstudio/visor-theme-engine"
import { docsAdapter } from "@loworbitstudio/visor-theme-engine/adapters"
import { logger } from "../utils/logger.js"
import {
  toSlug,
  toLabel,
  findRepoRoot,
  findMainRepoRoot,
  scanNestedThemeDir,
  assertNoBrokenSymlinks,
  detectVisorWorkspace,
  isLocalVisorBinary,
  BrokenSymlinkError,
} from "../utils/theme-helpers.js"

const PRIVATE_THEMES_REPO_URL = "git@github.com:low-orbit-studio/visor-themes-private.git"
const PRIVATE_THEMES_ENV_VAR = "VISOR_THEMES_PRIVATE_PATH"

export interface ThemeSyncOptions {
  dryRun?: boolean
  json?: boolean
}

interface ThemeManifestEntry {
  slug: string
  label: string
  group: string
  defaultMode?: "dark" | "light"
  css: string
  yamlFilename: string
  isCustom: boolean
}

const GLOBALS_BEGIN_MARKER = "/* BEGIN visor-theme-imports — managed by `visor theme sync` */"
const GLOBALS_END_MARKER = "/* END visor-theme-imports */"
const STOCK_GROUPS_BEGIN_MARKER = "/* BEGIN visor-stock-themes — managed by `visor theme sync` */"
const STOCK_GROUPS_END_MARKER = "/* END visor-stock-themes */"
const GITIGNORE_BEGIN_MARKER = "# BEGIN visor-custom-theme-css (managed by `visor theme sync` — do not edit manually)"
const GITIGNORE_END_MARKER = "# END visor-custom-theme-css"

const CUSTOM_OVERLAY_CSS_PATH = "packages/docs/app/custom-themes.generated.css"
const CUSTOM_OVERLAY_TS_PATH = "packages/docs/lib/theme-config.custom.generated.ts"
const CUSTOM_OVERLAY_IMPORT_LINE = "@import './custom-themes.generated.css';"

/** Scan a directory for .visor.yaml files. Returns empty array if dir doesn't exist.
 *  Throws BrokenSymlinkError if a dangling symlink is encountered. */
function scanThemeDir(dir: string): string[] {
  if (!existsSync(dir)) return []
  assertNoBrokenSymlinks(dir)
  return readdirSync(dir)
    .filter((f) => f.endsWith(".visor.yaml"))
    .map((f) => join(dir, f))
}

interface CustomThemeFile {
  filePath: string
  /** Slug derived from layout (nested = parent dirname, flat = filename). */
  slug: string
  /** Origin of the file — drives merge precedence and warnings. */
  origin: "env" | "sibling" | "legacy"
}

/**
 * Resolve custom theme sources in priority order: env var → sibling checkout
 * → legacy `custom-themes/`. Each origin contributes only when the prior one
 * resolves zero files. Returns the merged file list with first-write-wins
 * precedence; same-slug duplicates from later sources are dropped (with a
 * warning logged) per D8.
 */
function resolveCustomSources(
  repoRoot: string,
  mainRepoRoot: string,
  warn: (msg: string) => void,
): { files: CustomThemeFile[]; deprecationWarnings: string[] } {
  const merged = new Map<string, CustomThemeFile>()
  const deprecationWarnings: string[] = []

  const addNested = (dir: string, origin: "env" | "sibling"): void => {
    const entries = scanNestedThemeDir(dir)
    for (const entry of entries) {
      const existing = merged.get(entry.slug)
      if (existing) {
        warn(
          `Duplicate theme slug "${entry.slug}" — keeping ${existing.origin} source (${existing.filePath}); ignoring ${origin} source (${entry.filePath}).`,
        )
        continue
      }
      merged.set(entry.slug, {
        filePath: entry.filePath,
        slug: entry.slug,
        origin,
      })
    }
  }

  // 1. Env var override
  const envPath = process.env[PRIVATE_THEMES_ENV_VAR]
  if (envPath && envPath.trim() !== "") {
    const resolved = resolve(envPath)
    if (!existsSync(resolved)) {
      throw new Error(
        `${PRIVATE_THEMES_ENV_VAR} is set to "${envPath}" but the path does not exist. ` +
          `Expected a directory containing {slug}/theme.visor.yaml entries.`,
      )
    }
    addNested(resolved, "env")
  }

  // 2. Sibling checkout — convention default
  const siblingPath = join(mainRepoRoot, "..", "visor-themes-private", "themes")
  if (existsSync(siblingPath)) {
    addNested(siblingPath, "sibling")
  }

  // 3. Legacy flat layout — backwards-compat with deprecation warning
  const legacyDir = join(repoRoot, "custom-themes")
  const legacyFiles = scanThemeDir(legacyDir)
  for (const legacyFile of legacyFiles) {
    const slug = basename(legacyFile).replace(/\.visor\.yaml$/, "")
    const existing = merged.get(slug)
    if (existing) {
      warn(
        `Duplicate theme slug "${slug}" — keeping ${existing.origin} source (${existing.filePath}); ignoring legacy source (${legacyFile}).`,
      )
      continue
    }
    deprecationWarnings.push(
      `Deprecated legacy custom-themes/ source: ${legacyFile} — migrate to visor-themes-private (see docs).`,
    )
    merged.set(slug, {
      filePath: legacyFile,
      slug,
      origin: "legacy",
    })
  }

  return { files: [...merged.values()], deprecationWarnings }
}

/** Print a broken-symlink error in the appropriate output format. */
function reportBrokenSymlink(err: BrokenSymlinkError, options: ThemeSyncOptions): void {
  const msg = `Broken symlink in theme source: ${err.path} → ${err.target}`
  if (options.json) {
    console.log(JSON.stringify({ success: false, error: msg, path: err.path, target: err.target }))
  } else {
    logger.error(msg)
  }
}

/** Build the actionable D5 message shown when no theme source produces any files. */
function buildEmptySourcesMessage(mainRepoRoot: string): string {
  const expectedSibling = join(mainRepoRoot, "..", "visor-themes-private")
  return [
    "No theme sources discovered. Cannot proceed — refusing to wipe generated CSS.",
    "",
    "Resolution order checked:",
    `  1. Env var ${PRIVATE_THEMES_ENV_VAR} (unset or empty)`,
    `  2. Sibling checkout at ${expectedSibling}/themes/ (not found)`,
    "  3. Legacy custom-themes/ (no .visor.yaml files)",
    "",
    "To fix, clone the private themes repo as a sibling:",
    `  git clone ${PRIVATE_THEMES_REPO_URL} ${expectedSibling}`,
    "",
    `Or set ${PRIVATE_THEMES_ENV_VAR} to a directory containing {slug}/theme.visor.yaml entries.`,
  ].join("\n")
}

/**
 * D10: refuse to run when invoked from inside a Visor workspace via a
 * non-workspace binary (e.g. the global `visor` CLI bundles a published
 * theme-engine that lags HEAD and can regress stock CSS).
 */
function enforceWorkspaceGuard(cwd: string): string | null {
  // Skip when running under vitest — tests drive themeSyncCommand directly via tmpdir
  if (process.env.VITEST) return null
  // Allow opt-out for advanced users
  if (process.env.VISOR_SKIP_WORKSPACE_GUARD) return null

  const workspaceRoot = detectVisorWorkspace(cwd)
  if (!workspaceRoot) return null

  if (isLocalVisorBinary(workspaceRoot, process.argv[1])) return null

  return [
    `Detected Visor workspace at ${workspaceRoot}.`,
    "The global `visor` CLI bundles a published theme-engine that lags HEAD and",
    "can regress stock theme CSS files. Run the workspace command instead:",
    "",
    "  npm run theme:sync",
    "",
    `(Override with VISOR_SKIP_WORKSPACE_GUARD=1 if you really know what you're doing.)`,
  ].join("\n")
}

/** Extract the raw `group` field from a YAML string without running the full theme pipeline. */
function extractGroup(yamlContent: string): string | undefined {
  const parsed = parseYaml(yamlContent) as Record<string, unknown>
  if (typeof parsed?.group === "string") return parsed.group
  return undefined
}

/** Extract the raw `label` field from a YAML string. */
function extractLabel(yamlContent: string): string | undefined {
  const parsed = parseYaml(yamlContent) as Record<string, unknown>
  if (typeof parsed?.label === "string") return parsed.label
  return undefined
}

/** Extract the raw `default-mode` field from a YAML string. */
function extractDefaultMode(yamlContent: string): "dark" | "light" | undefined {
  const parsed = parseYaml(yamlContent) as Record<string, unknown>
  const v = parsed?.["default-mode"]
  if (v === "dark" || v === "light") return v
  return undefined
}

/** Sort groups: "Visor" always first, then alphabetical. */
function sortGroups(groups: string[]): string[] {
  return [...groups].sort((a, b) => {
    if (a === "Visor") return -1
    if (b === "Visor") return 1
    return a.localeCompare(b)
  })
}

/** Replace or insert the theme imports block in globals.css using marker comments.
 *  Only stock slugs are written into the managed block.
 *  Idempotently ensures the custom overlay @import line sits immediately after the END marker.
 */
function updateGlobalsImports(content: string, stockSlugs: string[]): string {
  const importLines = [...stockSlugs]
    .sort()
    .map((slug) => `@import './${slug}-theme.css';`)
    .join("\n")
  const newBlock = `${GLOBALS_BEGIN_MARKER}\n${importLines}\n${GLOBALS_END_MARKER}`

  let updated: string

  const beginIdx = content.indexOf(GLOBALS_BEGIN_MARKER)
  const endIdx = content.indexOf(GLOBALS_END_MARKER)

  if (beginIdx !== -1 && endIdx !== -1) {
    // Replace the existing block
    updated =
      content.slice(0, beginIdx) +
      newBlock +
      content.slice(endIdx + GLOBALS_END_MARKER.length)
  } else {
    // No markers yet — find the existing theme import block and replace it
    const themeImportPattern = /^@import '\.\/[\w-]+-theme\.css';\n?/gm
    const lines = content.split("\n")
    let firstThemeIdx = -1
    let lastThemeIdx = -1
    for (let i = 0; i < lines.length; i++) {
      if (/^@import '\.\/[\w-]+-theme\.css';/.test(lines[i])) {
        if (firstThemeIdx === -1) firstThemeIdx = i
        lastThemeIdx = i
      }
    }

    if (firstThemeIdx !== -1) {
      // Replace the existing contiguous theme import block with our marked block
      const before = lines.slice(0, firstThemeIdx)
      const after = lines.slice(lastThemeIdx + 1)
      updated = [...before, newBlock, ...after].join("\n")
    } else {
      // No existing imports — insert after the last @import line
      void themeImportPattern // suppress unused warning
      const lastImportIdx = lines.reduce(
        (last, line, i) => (line.startsWith("@import") ? i : last),
        -1,
      )
      const insertAt = lastImportIdx + 1
      lines.splice(insertAt, 0, newBlock)
      updated = lines.join("\n")
    }
  }

  // Idempotently ensure the custom overlay @import sits immediately after the END marker
  updated = ensureCustomOverlayImport(updated)
  return updated
}

/** Ensure `@import './custom-themes.generated.css';` sits on the line immediately
 *  following `/* END visor-theme-imports *\/`. No-op if already present there.
 */
function ensureCustomOverlayImport(content: string): string {
  const endMarkerIdx = content.indexOf(GLOBALS_END_MARKER)
  if (endMarkerIdx === -1) return content

  const afterMarker = content.slice(endMarkerIdx + GLOBALS_END_MARKER.length)
  // If the import line is already the next non-empty content, skip
  if (afterMarker.trimStart().startsWith(CUSTOM_OVERLAY_IMPORT_LINE)) return content

  // Remove any existing stale copy of the overlay import line
  const withoutStale = content.replace(
    new RegExp(`\\n?${CUSTOM_OVERLAY_IMPORT_LINE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"),
    "",
  )

  // Re-find the END marker after removal
  const markerEnd = withoutStale.indexOf(GLOBALS_END_MARKER) + GLOBALS_END_MARKER.length
  return (
    withoutStale.slice(0, markerEnd) +
    "\n" +
    CUSTOM_OVERLAY_IMPORT_LINE +
    withoutStale.slice(markerEnd)
  )
}

/** Replace the marker-bounded STOCK_GROUPS block in theme-config.ts.
 *  Preserves all content outside the markers (interfaces, imports, exports).
 */
function updateStockThemeConfigBlock(content: string, stockEntries: ThemeManifestEntry[]): string {
  const groupMap = new Map<string, ThemeManifestEntry[]>()
  for (const entry of stockEntries) {
    if (!groupMap.has(entry.group)) groupMap.set(entry.group, [])
    groupMap.get(entry.group)!.push(entry)
  }

  const sortedGroupNames = sortGroups([...groupMap.keys()])
  for (const [, groupEntries] of groupMap) {
    groupEntries.sort((a, b) => a.slug.localeCompare(b.slug))
  }

  const groupsTs = sortedGroupNames
    .map((groupName) => {
      const groupEntries = groupMap.get(groupName)!
      const themesTs = groupEntries
        .map((e) => {
          const modePart = e.defaultMode ? `, defaultMode: "${e.defaultMode}"` : ""
          return `      { value: "${e.slug}", label: "${e.label}", yamlFile: "${e.yamlFilename}"${modePart} },`
        })
        .join("\n")
      return `  {\n    label: "${groupName}",\n    themes: [\n${themesTs}\n    ],\n  },`
    })
    .join("\n")

  const newBlock = `${STOCK_GROUPS_BEGIN_MARKER}\nconst STOCK_GROUPS: ThemeGroup[] = [\n${groupsTs}\n];\n${STOCK_GROUPS_END_MARKER}`

  const beginIdx = content.indexOf(STOCK_GROUPS_BEGIN_MARKER)
  const endIdx = content.indexOf(STOCK_GROUPS_END_MARKER)

  if (beginIdx !== -1 && endIdx !== -1) {
    return (
      content.slice(0, beginIdx) +
      newBlock +
      content.slice(endIdx + STOCK_GROUPS_END_MARKER.length)
    )
  }

  // Markers not present — initial conversion. Insert before THEME_GROUPS export.
  const themeGroupsExportIdx = content.indexOf("export const THEME_GROUPS")
  if (themeGroupsExportIdx !== -1) {
    return content.slice(0, themeGroupsExportIdx) + newBlock + "\n\n" + content.slice(themeGroupsExportIdx)
  }

  // Fallback: append at end
  return content + "\n\n" + newBlock
}

/** Generate the custom overlay CSS file content. Always written (empty placeholder when no customs). */
function generateCustomOverlayCss(customEntries: ThemeManifestEntry[]): string {
  if (customEntries.length === 0) {
    return "/* generated by `visor theme sync` — empty when no custom themes are present */\n"
  }
  const importLines = [...customEntries]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((e) => `@import './${e.slug}-theme.css';`)
    .join("\n")
  return `/* generated by \`visor theme sync\` — do not edit manually */\n${importLines}\n`
}

/** Generate the custom overlay TypeScript file content. Always written (empty array when no customs). */
function generateCustomOverlayTs(customEntries: ThemeManifestEntry[]): string {
  if (customEntries.length === 0) {
    return `import type { ThemeGroup } from "./theme-config";\nexport const customThemeGroups: ThemeGroup[] = [];\n`
  }

  // Group entries
  const groupMap = new Map<string, ThemeManifestEntry[]>()
  for (const entry of customEntries) {
    if (!groupMap.has(entry.group)) groupMap.set(entry.group, [])
    groupMap.get(entry.group)!.push(entry)
  }

  const sortedGroupNames = sortGroups([...groupMap.keys()])
  for (const [, groupEntries] of groupMap) {
    groupEntries.sort((a, b) => a.slug.localeCompare(b.slug))
  }

  const groupsTs = sortedGroupNames
    .map((groupName) => {
      const groupEntries = groupMap.get(groupName)!
      const themesTs = groupEntries
        .map((e) => {
          const modePart = e.defaultMode ? `, defaultMode: "${e.defaultMode}"` : ""
          return `      { value: "${e.slug}", label: "${e.label}", yamlFile: "${e.yamlFilename}"${modePart} },`
        })
        .join("\n")
      return `  {\n    label: "${groupName}",\n    themes: [\n${themesTs}\n    ],\n  },`
    })
    .join("\n")

  return `import type { ThemeGroup } from "./theme-config";\n// generated by \`visor theme sync\` — do not edit manually\nexport const customThemeGroups: ThemeGroup[] = [\n${groupsTs}\n];\n`
}

/** Update the visor-custom-theme-css block in .gitignore. */
function updateGitignoreBlock(content: string, customSlugs: string[]): string {
  const cssLines = customSlugs
    .sort()
    .map((slug) => `packages/docs/app/${slug}-theme.css`)
    .join("\n")
  const newBlock = `${GITIGNORE_BEGIN_MARKER}\n${cssLines}\n${GITIGNORE_END_MARKER}`

  const beginIdx = content.indexOf(GITIGNORE_BEGIN_MARKER)
  const endIdx = content.indexOf(GITIGNORE_END_MARKER)

  if (beginIdx !== -1 && endIdx !== -1) {
    return (
      content.slice(0, beginIdx) +
      newBlock +
      content.slice(endIdx + GITIGNORE_END_MARKER.length)
    )
  }

  // Block not present — append it
  return content.trimEnd() + "\n\n" + newBlock + "\n"
}

export function themeSyncCommand(cwd: string, options: ThemeSyncOptions): void {
  // D10: workspace guard — refuse to run global CLI from inside a Visor checkout
  const guardError = enforceWorkspaceGuard(cwd)
  if (guardError) {
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: guardError }))
    } else {
      logger.error(guardError)
    }
    process.exit(1)
    return
  }

  const repoRoot = findRepoRoot(cwd)
  if (!repoRoot) {
    const msg = "Could not locate repo root (packages/docs/ not found). Run from within the visor repo."
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: msg }))
    } else {
      logger.error(msg)
    }
    process.exit(1)
    return
  }

  const mainRepoRoot = findMainRepoRoot(cwd) ?? repoRoot

  const themesDir = join(repoRoot, "themes")
  const docsAppDir = join(repoRoot, "packages", "docs", "app")
  const docsLibDir = join(repoRoot, "packages", "docs", "lib")
  const docsPublicThemesDir = join(repoRoot, "packages", "docs", "public", "themes")
  const themeConfigPath = join(repoRoot, "packages", "docs", "lib", "theme-config.ts")
  const globalsPath = join(docsAppDir, "globals.css")
  const gitignorePath = join(repoRoot, ".gitignore")
  const customOverlayCssPath = join(repoRoot, CUSTOM_OVERLAY_CSS_PATH)
  const customOverlayTsPath = join(repoRoot, CUSTOM_OVERLAY_TS_PATH)

  // Discover stock theme YAMLs (unchanged: flat layout, in-repo)
  let stockFiles: string[]
  try {
    stockFiles = scanThemeDir(themesDir)
  } catch (err) {
    if (err instanceof BrokenSymlinkError) {
      reportBrokenSymlink(err, options)
      process.exit(1)
      return
    }
    throw err
  }

  // Discover custom themes via D1 fallback chain
  let customSources: CustomThemeFile[] = []
  let deprecationWarnings: string[] = []
  const discoveryWarnings: string[] = []
  try {
    const result = resolveCustomSources(repoRoot, mainRepoRoot, (msg) =>
      discoveryWarnings.push(msg),
    )
    customSources = result.files
    deprecationWarnings = result.deprecationWarnings
  } catch (err) {
    if (err instanceof BrokenSymlinkError) {
      reportBrokenSymlink(err, options)
      process.exit(1)
      return
    }
    const msg = err instanceof Error ? err.message : "Custom theme discovery failed"
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: msg }))
    } else {
      logger.error(msg)
    }
    process.exit(1)
    return
  }

  // D5/D6: empty manifest → hard fail with actionable message; remove zero files
  if (stockFiles.length === 0 && customSources.length === 0) {
    const msg = buildEmptySourcesMessage(mainRepoRoot)
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: msg }))
    } else {
      logger.error(msg)
    }
    process.exit(1)
    return
  }

  // Emit text-mode warnings now (JSON mode surfaces them in the result envelope)
  if (!options.json) {
    for (const w of deprecationWarnings) logger.warn(w)
    for (const w of discoveryWarnings) logger.warn(w)
  }

  // Build manifest
  const manifest: ThemeManifestEntry[] = []
  const errors: string[] = []

  const processFile = (filePath: string, isCustom: boolean, slugOverride?: string) => {
    let yamlContent: string
    try {
      yamlContent = readFileSync(filePath, "utf-8")
    } catch {
      errors.push(`Could not read: ${filePath}`)
      return
    }

    let data: ReturnType<typeof generateThemeData>
    try {
      data = generateThemeData(yamlContent)
    } catch (err) {
      errors.push(`Failed to parse ${basename(filePath)}: ${err instanceof Error ? err.message : "Unknown error"}`)
      return
    }

    const slug = slugOverride ?? toSlug(data.config.name)
    const label = extractLabel(yamlContent) ?? toLabel(data.config.name)
    const group = extractGroup(yamlContent) ?? (isCustom ? "Custom" : "Visor")
    const defaultMode = extractDefaultMode(yamlContent)
    const css = docsAdapter({ primitives: data.primitives, tokens: data.tokens, config: data.config })
    // Nested custom themes use the slug as the public yamlFilename so the
    // generated CSS/import path stays predictable. Flat layout keeps its
    // historical filename so existing public/themes/ entries don't churn.
    const yamlFilename = slugOverride ?? basename(filePath).replace(/\.visor\.yaml$/, "")

    manifest.push({ slug, label, group, defaultMode, css, yamlFilename, isCustom })
  }

  for (const f of stockFiles) processFile(f, false)
  for (const c of customSources) {
    const isNested = c.origin !== "legacy"
    processFile(c.filePath, true, isNested ? c.slug : undefined)
  }

  if (errors.length > 0) {
    if (options.json) {
      console.log(JSON.stringify({ success: false, errors }))
    } else {
      errors.forEach((e) => logger.error(e))
    }
    process.exit(1)
    return
  }

  // Partition manifest by stock vs custom
  const stockManifest = manifest.filter((e) => !e.isCustom)
  const customManifest = manifest.filter((e) => e.isCustom)
  const stockSlugs = stockManifest.map((e) => e.slug)
  const customSlugs = customManifest.map((e) => e.slug)
  const allSlugs = manifest.map((e) => e.slug)

  // Read existing tracked files
  let globalsContent: string
  let themeConfigContent: string
  let gitignoreContent: string
  try {
    globalsContent = readFileSync(globalsPath, "utf-8")
    themeConfigContent = readFileSync(themeConfigPath, "utf-8")
    gitignoreContent = existsSync(gitignorePath) ? readFileSync(gitignorePath, "utf-8") : ""
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not read docs files"
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: msg }))
    } else {
      logger.error(msg)
    }
    process.exit(1)
    return
  }

  // Compute updated tracked file content (stock-only changes)
  const newGlobals = updateGlobalsImports(globalsContent, stockSlugs)
  const newThemeConfig = updateStockThemeConfigBlock(themeConfigContent, stockManifest)
  const newGitignore = customSlugs.length > 0
    ? updateGitignoreBlock(gitignoreContent, customSlugs)
    : gitignoreContent

  // Compute overlay file content (always written)
  const newCustomOverlayCss = generateCustomOverlayCss(customManifest)
  const newCustomOverlayTs = generateCustomOverlayTs(customManifest)

  // Find stale CSS files in docs/app (excluding the overlay file itself)
  const existingCssFiles = existsSync(docsAppDir)
    ? readdirSync(docsAppDir).filter(
        (f) => f.endsWith("-theme.css") && f !== "custom-themes.generated.css",
      )
    : []
  const newCssSet = new Set(allSlugs.map((s) => `${s}-theme.css`))
  const staleCssFiles = existingCssFiles.filter((f) => !newCssSet.has(f))

  // Find stale public/themes copies
  const existingPublicYamls = existsSync(docsPublicThemesDir)
    ? readdirSync(docsPublicThemesDir).filter((f) => f.endsWith(".visor.yaml"))
    : []
  const newPublicYamlSet = new Set(manifest.map((e) => `${e.yamlFilename}.visor.yaml`))
  const stalePublicYamls = existingPublicYamls.filter((f) => !newPublicYamlSet.has(f))

  if (options.dryRun) {
    const changes = {
      themesDiscovered: manifest.map((e) => ({ slug: e.slug, group: e.group, isCustom: e.isCustom })),
      cssFilesGenerated: allSlugs.map((s) => `packages/docs/app/${s}-theme.css`),
      cssFilesDeleted: staleCssFiles.map((f) => `packages/docs/app/${f}`),
      themeConfig: themeConfigPath,
      globalsCSS: globalsPath,
      customOverlayCss: CUSTOM_OVERLAY_CSS_PATH,
      customOverlayTs: CUSTOM_OVERLAY_TS_PATH,
      gitignore: gitignorePath,
      publicYamlsCopied: manifest.map((e) => `packages/docs/public/themes/${e.yamlFilename}.visor.yaml`),
      publicYamlsDeleted: stalePublicYamls.map((f) => `packages/docs/public/themes/${f}`),
    }
    if (options.json) {
      console.log(JSON.stringify({ success: true, dryRun: true, changes }))
    } else {
      logger.info("Dry run — no files written")
      logger.item(`Themes discovered: ${manifest.length} (${stockManifest.length} stock, ${customManifest.length} custom)`)
      manifest.forEach((e) => logger.item(`  ${e.slug} — group: ${e.group}`))
      if (staleCssFiles.length > 0) logger.item(`CSS files to delete: ${staleCssFiles.join(", ")}`)
      if (stalePublicYamls.length > 0) logger.item(`Public YAMLs to delete: ${stalePublicYamls.join(", ")}`)
    }
    return
  }

  // Write all files
  try {
    mkdirSync(docsAppDir, { recursive: true })
    mkdirSync(docsLibDir, { recursive: true })
    mkdirSync(docsPublicThemesDir, { recursive: true })

    // Write per-theme CSS files
    for (const entry of manifest) {
      writeFileSync(join(docsAppDir, `${entry.slug}-theme.css`), entry.css, "utf-8")
    }

    // Delete stale CSS files
    for (const stale of staleCssFiles) {
      unlinkSync(join(docsAppDir, stale))
    }

    // Write overlay files (always — even if empty)
    writeFileSync(customOverlayCssPath, newCustomOverlayCss, "utf-8")
    writeFileSync(customOverlayTsPath, newCustomOverlayTs, "utf-8")

    // Update tracked files (stock-only; no-op if content unchanged)
    writeFileSync(themeConfigPath, newThemeConfig, "utf-8")
    writeFileSync(globalsPath, newGlobals, "utf-8")

    // Update .gitignore
    if (existsSync(gitignorePath)) {
      writeFileSync(gitignorePath, newGitignore, "utf-8")
    }

    // Copy YAMLs to public/themes/
    // Stock files use their on-disk filename. Custom files: nested layout
    // uses `<slug>.visor.yaml` (so `theme.visor.yaml` doesn't collide); legacy
    // flat layout uses the on-disk filename for backwards-compat.
    for (const srcFile of stockFiles) {
      copyFileSync(srcFile, join(docsPublicThemesDir, basename(srcFile)))
    }
    for (const c of customSources) {
      const targetName = c.origin === "legacy"
        ? basename(c.filePath)
        : `${c.slug}.visor.yaml`
      copyFileSync(c.filePath, join(docsPublicThemesDir, targetName))
    }

    // Delete stale public/themes/ copies
    for (const stale of stalePublicYamls) {
      unlinkSync(join(docsPublicThemesDir, stale))
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Write failed"
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: msg }))
    } else {
      logger.error(msg)
    }
    process.exit(2)
    return
  }

  if (options.json) {
    const warnings = [...deprecationWarnings, ...discoveryWarnings]
    console.log(JSON.stringify({
      success: true,
      themes: manifest.length,
      stock: stockManifest.length,
      custom: customManifest.length,
      staleCssDeleted: staleCssFiles.length,
      staleYamlsDeleted: stalePublicYamls.length,
      slugs: allSlugs,
      ...(warnings.length > 0 ? { warnings } : {}),
    }))
  } else {
    logger.success(`Theme sync complete — ${manifest.length} themes registered`)
    logger.item(`Stock: ${stockManifest.map((e) => e.slug).join(", ")}`)
    if (customManifest.length > 0) {
      logger.item(`Custom: ${customManifest.map((e) => e.slug).join(", ")}`)
    }
    if (staleCssFiles.length > 0) {
      logger.item(`Removed stale CSS: ${staleCssFiles.join(", ")}`)
    }
  }
}
