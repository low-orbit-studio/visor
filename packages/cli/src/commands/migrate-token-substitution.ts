import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs"
import { resolve, join, relative } from "path"
import { parse as parseYaml } from "yaml"
import { logger } from "../utils/logger.js"
import pc from "picocolors"

export interface MigrateTokenSubstitutionOptions {
  themeId?: string
  dryRun?: boolean
  apply?: boolean
  json?: boolean
}

// ---------------------------------------------------------------------------
// §3.1 V7-primitive → Visor-semantic substitution table
//
// Canonical mapping derived from the R1→R2 Borealis admin-ui prototype-to-Visor
// rounds (retro-r1.md §3.1, retro-r2.md §3.1, dev-log.md BO-13 surprise #4).
// Encodes the 10-entry mental model that made theme-portability mechanical.
//
// Key: V7 primitive CSS custom property name (no `var()` wrapper)
// Value: Visor semantic CSS custom property name (no `var()` wrapper)
//
// Notes:
//   - --panel-2 maps to --surface-interactive-default (interactive contexts)
//     and --surface-subtle (static section contexts). The codemod uses
//     --surface-interactive-default as the canonical mapping; reviewers should
//     adjust to --surface-subtle where the element is decorative/non-interactive.
//   - --panel-3 maps to --surface-interactive-active as canonical; adjust to
//     --surface-interactive-hover where hover (not active/pressed) is intended.
//   - --mint maps to --accent-primary for fills/accents; for `color:` (text)
//     properties, reviewers may prefer --text-success. The codemod uses
//     --accent-primary as the canonical mapping.
//   - --mint-soft maps to --surface-accent-subtle as canonical; --surface-selected
//     is the alternative for selected-row highlights.
//   - --text-4 has no dedicated Visor semantic; maps to --text-tertiary (same as
//     --text-3).
//   - Brand-local tokens (--screen, --font-marquee, discrete type scale --text-11
//     through --text-72) intentionally excluded — they have no Visor semantic
//     equivalent and must remain brand-local.
// ---------------------------------------------------------------------------
export const V7_ENTR_SUBSTITUTION_MAP: Record<string, string> = {
  "--panel": "--surface-card",
  "--panel-2": "--surface-interactive-default",
  "--panel-3": "--surface-interactive-active",
  "--text": "--text-primary",
  "--text-2": "--text-secondary",
  "--text-3": "--text-tertiary",
  "--text-4": "--text-tertiary",
  "--mint": "--accent-primary",
  "--mint-soft": "--surface-accent-subtle",
  "--warn": "--text-warning",
  "--warn-soft": "--surface-warning-subtle",
}

// Theme-to-substitution-map registry.
// Built-in maps for themes whose YAML files may be gitignored (e.g. client/internal themes).
// D2: substitution map ships with the theme — either via this registry or via the
// theme's YAML `migrate.token-substitution` field.
const BUILT_IN_SUBSTITUTION_MAPS: Record<string, Record<string, string>> = {
  "entr": V7_ENTR_SUBSTITUTION_MAP,
  // future themes: "kaiah": KAIAH_SUBSTITUTION_MAP, etc.
}

const DEFAULT_THEME_ID = "entr"

/**
 * Attempt to read a substitution map from a theme's .visor.yaml file.
 * D2: each Visor theme can declare its primitive→semantic table in metadata.
 * Looks in `{cwd}/themes/{id}.visor.yaml` and `{cwd}/custom-themes/{id}.visor.yaml`.
 * Returns undefined if no YAML file or no map declared.
 */
function readMapFromThemeFile(
  themeId: string,
  cwd: string
): Record<string, string> | undefined {
  const candidates = [
    join(cwd, "themes", `${themeId}.visor.yaml`),
    join(cwd, "custom-themes", `${themeId}.visor.yaml`),
    join(cwd, "packages", "docs", "public", "themes", `${themeId}.visor.yaml`),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      try {
        const raw = readFileSync(candidate, "utf-8")
        const parsed = parseYaml(raw) as { migrate?: { "token-substitution"?: Record<string, string> } }
        if (parsed?.migrate?.["token-substitution"]) {
          return parsed.migrate["token-substitution"]
        }
      } catch {
        // Ignore parse errors — fall through to built-in map
      }
    }
  }
  return undefined
}

/**
 * Resolve the substitution map for a given theme ID.
 * Priority: theme YAML file > built-in registry.
 */
function resolveSubstitutionMap(
  themeId: string,
  cwd: string
): Record<string, string> | undefined {
  // D2: prefer the theme's own YAML metadata
  const fromYaml = readMapFromThemeFile(themeId, cwd)
  if (fromYaml) return fromYaml
  // Fall back to built-in registry
  return BUILT_IN_SUBSTITUTION_MAPS[themeId]
}

/** File extensions scanned for substitutions. */
const SCANNABLE_EXTENSIONS = new Set([".css", ".module.css", ".scss"])

/** A single proposed substitution within a file. */
export interface Substitution {
  line: number
  column: number
  from: string
  to: string
  /** The full original line text (before substitution). */
  originalLine: string
  /** The full resulting line text (after substitution). */
  replacedLine: string
}

/** Per-file result. */
export interface FileResult {
  file: string
  substitutions: Substitution[]
  /** Original content (only populated in apply mode). */
  originalContent?: string
  /** Resulting content after all substitutions applied. */
  newContent: string
}

/** Overall command result. */
export interface MigrateTokenSubstitutionResult {
  themeId: string
  targetPath: string
  filesScanned: number
  filesChanged: number
  totalSubstitutions: number
  files: FileResult[]
}

// ---------------------------------------------------------------------------
// Core logic (pure — no I/O; unit-testable)
// ---------------------------------------------------------------------------

/**
 * Apply the substitution map to a single file's content.
 * Returns the new content and the list of substitutions made.
 * Idempotent: if no V7 primitives remain, returns empty substitutions.
 */
export function applySubstitutionsToContent(
  content: string,
  map: Record<string, string>
): { newContent: string; substitutions: Substitution[] } {
  const substitutions: Substitution[] = []
  const lines = content.split("\n")
  const newLines = lines.map((line, lineIndex) => {
    let newLine = line
    for (const [from, to] of Object.entries(map)) {
      // Match `var(--token)` with optional whitespace and fallback
      // e.g. var(--panel), var(--panel, #111)
      const pattern = new RegExp(`var\\(\\s*${escapeRegex(from)}\\s*(?:,[^)]*)?\\)`, "g")
      let match: RegExpExecArray | null
      while ((match = pattern.exec(newLine)) !== null) {
        const column = match.index
        const originalLine = line
        // Replace only the property name inside var(), preserve fallback if any
        const fullMatch = match[0]
        const replaced = fullMatch.replace(
          new RegExp(escapeRegex(from)),
          to
        )
        newLine = newLine.slice(0, match.index) + replaced + newLine.slice(match.index + fullMatch.length)
        substitutions.push({
          line: lineIndex + 1,
          column,
          from,
          to,
          originalLine,
          replacedLine: newLine,
        })
        // Re-run pattern from updated position to handle multiple matches on same line
        pattern.lastIndex = match.index + replaced.length
      }
    }
    return newLine
  })
  return { newContent: newLines.join("\n"), substitutions }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Collect all scannable CSS files under a directory (recursive).
 */
export function collectCssFiles(dirPath: string): string[] {
  const results: string[] = []
  function walk(current: string) {
    const entries = readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(current, entry.name)
      if (entry.isDirectory()) {
        // Skip common non-source directories
        if (["node_modules", ".git", ".next", "dist", "build", ".cache"].includes(entry.name)) {
          continue
        }
        walk(fullPath)
      } else if (entry.isFile()) {
        // Check extension — .module.css before generic .css
        const name = entry.name
        if (name.endsWith(".module.css") || name.endsWith(".scss") || name.endsWith(".css")) {
          results.push(fullPath)
        }
      }
    }
  }
  walk(dirPath)
  return results
}

/**
 * Run the substitution pass over an entire directory or single file.
 * Pure function — returns results without writing any files.
 */
export function runSubstitutionPass(
  targetPath: string,
  map: Record<string, string>,
  themeId: string
): MigrateTokenSubstitutionResult {
  let files: string[]
  const stat = statSync(targetPath)
  if (stat.isFile()) {
    files = [targetPath]
  } else {
    files = collectCssFiles(targetPath)
  }

  const fileResults: FileResult[] = []
  let totalSubstitutions = 0

  for (const file of files) {
    const content = readFileSync(file, "utf-8")
    const { newContent, substitutions } = applySubstitutionsToContent(content, map)
    if (substitutions.length > 0) {
      fileResults.push({ file, substitutions, originalContent: content, newContent })
      totalSubstitutions += substitutions.length
    }
  }

  return {
    themeId,
    targetPath,
    filesScanned: files.length,
    filesChanged: fileResults.length,
    totalSubstitutions,
    files: fileResults,
  }
}

// ---------------------------------------------------------------------------
// Command implementation
// ---------------------------------------------------------------------------

export function migrateTokenSubstitutionCommand(
  targetArg: string | undefined,
  cwd: string,
  options: MigrateTokenSubstitutionOptions
): void {
  const themeId = options.themeId ?? DEFAULT_THEME_ID
  const apply = options.apply ?? false
  const dryRun = !apply  // dry-run is the default unless --apply is passed

  const map = resolveSubstitutionMap(themeId, cwd)
  if (!map) {
    const available = Object.keys(BUILT_IN_SUBSTITUTION_MAPS).join(", ")
    if (options.json) {
      console.log(JSON.stringify({
        success: false,
        error: `Unknown theme-id: "${themeId}". Available: ${available}`,
      }))
      process.exit(1)
    }
    logger.error(`Unknown theme-id: "${themeId}". Available: ${available}`)
    process.exit(1)
    return
  }

  const targetPath = resolve(cwd, targetArg ?? ".")

  // Check path exists
  try {
    statSync(targetPath)
  } catch {
    if (options.json) {
      console.log(JSON.stringify({
        success: false,
        error: `Target path not found: ${targetPath}`,
      }))
      process.exit(1)
    }
    logger.error(`Target path not found: ${targetPath}`)
    process.exit(1)
    return
  }

  const result = runSubstitutionPass(targetPath, map, themeId)

  // --- No changes case ---
  if (result.filesChanged === 0) {
    if (options.json) {
      console.log(JSON.stringify({ success: true, ...result, message: "No V7 primitives found — already up to date." }))
      process.exit(0)
    }
    logger.success(`No V7 primitives found — ${result.filesScanned} file(s) scanned. Already up to date.`)
    process.exit(0)
    return
  }

  // --- JSON output mode ---
  if (options.json) {
    if (apply) {
      // Write files
      for (const f of result.files) {
        writeFileSync(f.file, f.newContent, "utf-8")
      }
      console.log(JSON.stringify({
        success: true,
        applied: true,
        ...result,
      }))
    } else {
      console.log(JSON.stringify({
        success: true,
        dryRun: true,
        ...result,
      }))
    }
    process.exit(0)
    return
  }

  // --- Human-readable output ---
  const relTarget = relative(cwd, targetPath) || "."

  if (dryRun) {
    logger.heading(`visor migrate token-substitution — dry run`)
    logger.blank()
    logger.info(`  Theme:   ${pc.bold(themeId)}`)
    logger.info(`  Target:  ${pc.dim(relTarget)}`)
    logger.info(`  Scanned: ${result.filesScanned} file(s)`)
    logger.blank()
    logger.heading(`Proposed changes (${result.filesChanged} file(s), ${result.totalSubstitutions} substitution(s)):`)
    logger.blank()

    for (const f of result.files) {
      const relFile = relative(cwd, f.file)
      logger.info(pc.bold(`  ${relFile}`))
      for (const sub of f.substitutions) {
        logger.info(
          `    line ${String(sub.line).padEnd(4)} ${pc.red(`var(${sub.from})`)} → ${pc.green(`var(${sub.to})`)}`
        )
      }
      logger.blank()
    }

    logger.warn(`Dry run — no files written. Re-run with ${pc.bold("--apply")} to commit changes.`)
  } else {
    // Apply mode
    for (const f of result.files) {
      writeFileSync(f.file, f.newContent, "utf-8")
    }

    logger.heading(`visor migrate token-substitution — applied`)
    logger.blank()
    logger.info(`  Theme:   ${pc.bold(themeId)}`)
    logger.info(`  Target:  ${pc.dim(relTarget)}`)
    logger.info(`  Scanned: ${result.filesScanned} file(s)`)
    logger.blank()

    for (const f of result.files) {
      const relFile = relative(cwd, f.file)
      logger.success(`  ${relFile} (${f.substitutions.length} substitution(s))`)
    }

    logger.blank()
    logger.success(
      `Done — ${result.filesChanged} file(s) updated, ${result.totalSubstitutions} substitution(s) applied.`
    )
  }

  process.exit(0)
}
