import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "fs"
import { basename, isAbsolute, join, resolve } from "path"
import { homedir } from "os"
import * as childProcess from "child_process"
import { parse as parseYaml } from "yaml"
import { generateThemeData } from "@loworbitstudio/visor-theme-engine"
import { nextjsAdapter } from "@loworbitstudio/visor-theme-engine/adapters"
import { validate } from "@loworbitstudio/visor-theme-engine"
import type { ThemeValidationResult } from "@loworbitstudio/visor-theme-engine"
import { logger } from "../utils/logger.js"
import {
  discoverBlessedBuilds,
  resolveBlessedBuild,
  type DiscoveredBuild,
} from "../lib/blessed-discovery.js"
import type { BlessedManifest } from "../lib/blessed-manifest.js"
import { applyThemeToBuild } from "../lib/theme-apply-targets/index.js"

/**
 * Default blessed-build root (VI-597 D2). Overridable with `--blessed-dir` or
 * the `VISOR_BLESSED_DIR` env var. Computed from the OS home dir so `~` is
 * never left unexpanded.
 */
export const DEFAULT_BLESSED_DIR = join(
  homedir(),
  "Code",
  "low-orbit",
  "low-orbit-playbook",
  "design-prototypes"
)

/**
 * Directories and files excluded from the fork (VI-597 D3). Excludes are
 * matched by basename, so a nested `node_modules` anywhere in the tree is
 * skipped too.
 */
const FORK_EXCLUDE = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  ".turbo",
  ".cache",
  "coverage",
  ".DS_Store",
  "tsconfig.tsbuildinfo",
])

export interface SpawnOptions {
  from?: string
  theme?: string
  output?: string
  blessedDir?: string
  themeFile?: string
  install?: boolean
  validate?: boolean
  listBlessed?: boolean
  json?: boolean
}

export interface SpawnResult {
  success: true
  build: {
    shape: string
    pattern: string
    requiresVisor: string
    source: string
  }
  output: string
  themeApplied: string
  themeFile: string
  installed: boolean
  validated: boolean
}

/** Parse `blessed:{shape}:{pattern}` into its parts. Throws on malformed input. */
export function parseBlessedIdentifier(from: string): { shape: string; pattern: string } {
  const PREFIX = "blessed:"
  if (!from.startsWith(PREFIX)) {
    throw new Error(
      `Invalid --from '${from}'. Expected the form blessed:{shape}:{pattern} (e.g. blessed:admin-ui:organization-management).`
    )
  }
  const rest = from.slice(PREFIX.length)
  const parts = rest.split(":")
  if (parts.length !== 2 || parts[0].length === 0 || parts[1].length === 0) {
    throw new Error(
      `Invalid --from '${from}'. Expected the form blessed:{shape}:{pattern} (e.g. blessed:admin-ui:organization-management).`
    )
  }
  return { shape: parts[0], pattern: parts[1] }
}

/** Resolve the blessed-dir per precedence: --blessed-dir > VISOR_BLESSED_DIR > default. */
function resolveBlessedDir(cwd: string, options: SpawnOptions): string {
  const raw =
    options.blessedDir ??
    (process.env.VISOR_BLESSED_DIR && process.env.VISOR_BLESSED_DIR.length > 0
      ? process.env.VISOR_BLESSED_DIR
      : undefined) ??
    DEFAULT_BLESSED_DIR
  return isAbsolute(raw) ? raw : resolve(cwd, raw)
}

/**
 * Resolve a `--theme` value to a `.visor.yaml` path. Mirrors the sandbox init
 * resolution order so operators use one convention across commands:
 *   1. explicit --theme-file
 *   2. the value as a direct path
 *   3. ${VISOR_THEMES_PRIVATE_PATH}/themes/{theme}/theme.visor.yaml
 *   4. {cwd}/themes/{theme}.visor.yaml, {cwd}/custom-themes/{theme}.visor.yaml
 */
function resolveThemeFile(
  theme: string,
  cwd: string,
  themeFile: string | undefined
): { path: string; searched: string[] } {
  const candidates: string[] = []
  if (themeFile) {
    candidates.push(isAbsolute(themeFile) ? themeFile : resolve(cwd, themeFile))
  }
  candidates.push(isAbsolute(theme) ? theme : resolve(cwd, theme))
  const privateRoot = process.env.VISOR_THEMES_PRIVATE_PATH
  if (privateRoot && privateRoot.length > 0) {
    candidates.push(join(privateRoot, "themes", theme, "theme.visor.yaml"))
  }
  candidates.push(
    join(cwd, "themes", `${theme}.visor.yaml`),
    join(cwd, "custom-themes", `${theme}.visor.yaml`)
  )

  const found = candidates.find((candidate) => existsSync(candidate))
  if (!found) {
    throw new Error(
      `Theme '${theme}' not found (searched: ${candidates.join(", ")}). ` +
        `Pass --theme-file <path>, use a direct path, or set VISOR_THEMES_PRIVATE_PATH.`
    )
  }
  return { path: found, searched: candidates }
}

/**
 * Apply `themeFile` to the forked project using the same nextjs adapter that
 * backs `visor theme apply --adapter nextjs`. Dispatches through the build's
 * `theme_apply_target` (VI-601): missing → `globals-css` at `app/globals.css`;
 * declared → the handler under `lib/theme-apply-targets/`. Called directly
 * (not via the CLI command) so failures throw and can be rolled back
 * atomically rather than calling `process.exit`.
 *
 * The theme id used to name per-theme files (e.g. `themes-css-dir` writes
 * `<path>/<themeId>.css`) is taken from the theme's authoritative
 * `config.name` — the same source `visor theme apply --target-path` uses, and
 * safer than `options.theme`, which may be a file path rather than an id.
 */
function applyThemeToFork(
  themeFile: string,
  outputDir: string,
  manifest: BlessedManifest
): void {
  const yaml = readFileSync(themeFile, "utf-8")
  const data = generateThemeData(yaml)
  const themeId = data.config.name
  if (!themeId || themeId.length === 0) {
    throw new Error(
      `Theme file '${themeFile}' is missing a config.name; required to derive the theme id for spawn's theme-apply dispatch. See docs/blessed-builds.md.`
    )
  }
  const css = nextjsAdapter(
    { primitives: data.primitives, tokens: data.tokens, config: data.config },
    {}
  )
  applyThemeToBuild({
    manifest,
    buildDir: outputDir,
    themeId,
    adapterCss: css,
  })
}

function runNpmInstall(outputDir: string, json: boolean): void {
  const result = childProcess.spawnSync("npm", ["install", "--no-audit", "--no-fund"], {
    cwd: outputDir,
    stdio: json ? "ignore" : "inherit",
  })
  if (result.error) {
    throw new Error(`npm install failed to start: ${result.error.message}`)
  }
  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(`npm install exited with code ${result.status}`)
  }
}

/**
 * Core spawn logic. Throws on any failure; on theme-apply/validate failure the
 * partially-created output dir is deleted so the operation is atomic (D4).
 * Returns a structured result on success.
 */
export function runSpawn(cwd: string, options: SpawnOptions): SpawnResult {
  if (!options.from) throw new Error("Missing required --from blessed:{shape}:{pattern}.")
  if (!options.theme) throw new Error("Missing required --theme <id>.")
  if (!options.output) throw new Error("Missing required --output <path>.")

  const { shape, pattern } = parseBlessedIdentifier(options.from)
  const blessedDir = resolveBlessedDir(cwd, options)

  const { build, available } = resolveBlessedBuild(blessedDir, shape, pattern)
  if (!build) {
    const list =
      available.length > 0
        ? available.map((b) => `  - blessed:${b.manifest.shape}:${b.manifest.pattern}`).join("\n")
        : "  (none found)"
    throw new Error(
      `No blessed build found for blessed:${shape}:${pattern} under ${blessedDir}.\nAvailable builds:\n${list}`
    )
  }

  const outputDir = isAbsolute(options.output)
    ? options.output
    : resolve(cwd, options.output)

  if (existsSync(outputDir) && readdirSync(outputDir).length > 0) {
    throw new Error(`Output directory already exists and is not empty: ${outputDir}`)
  }

  // Resolve the theme file BEFORE forking so a bad theme id fails fast with no
  // partial fork on disk.
  const { path: themeFile } = resolveThemeFile(options.theme, cwd, options.themeFile)

  // Fork the tree (D3).
  cpSync(build.dir, outputDir, {
    recursive: true,
    filter: (src) => !FORK_EXCLUDE.has(basename(src)),
  })

  // Everything past the fork is atomic — on failure, delete the output dir.
  let validated = false
  let installed = false
  try {
    applyThemeToFork(themeFile, outputDir, build.manifest)

    if (options.validate) {
      const parsed: unknown = parseYaml(readFileSync(themeFile, "utf-8"))
      const result: ThemeValidationResult = validate(parsed)
      if (!result.valid) {
        const messages = result.errors.map((e) => e.message).join("; ")
        throw new Error(`Theme validation failed: ${messages}`)
      }
      validated = true
    }

    if (options.install) {
      runNpmInstall(outputDir, options.json ?? false)
      installed = true
    }
  } catch (err) {
    rmSync(outputDir, { recursive: true, force: true })
    throw err
  }

  return {
    success: true,
    build: {
      shape: build.manifest.shape,
      pattern: build.manifest.pattern,
      requiresVisor: build.manifest.requires_visor,
      source: build.dir,
    },
    output: outputDir,
    themeApplied: options.theme,
    themeFile,
    installed,
    validated,
  }
}

/** `--list-blessed` handler. */
function listBlessed(cwd: string, options: SpawnOptions): void {
  const blessedDir = resolveBlessedDir(cwd, options)
  const { builds, errors } = discoverBlessedBuilds(blessedDir)

  if (options.json) {
    console.log(
      JSON.stringify({
        success: true,
        blessedDir,
        builds: builds.map((b) => ({
          from: `blessed:${b.manifest.shape}:${b.manifest.pattern}`,
          shape: b.manifest.shape,
          pattern: b.manifest.pattern,
          base_theme: b.manifest.base_theme,
          requires_visor: b.manifest.requires_visor,
          three_gates_status: b.manifest.three_gates_status,
          dir: b.dir,
        })),
        errors,
      })
    )
    return
  }

  logger.heading(`Blessed builds under ${blessedDir}`)
  if (builds.length === 0) {
    logger.info("  (none found)")
  }
  for (const b of builds) {
    logger.success(`blessed:${b.manifest.shape}:${b.manifest.pattern}`)
    logger.item(`base theme: ${b.manifest.base_theme}  ·  requires visor ${b.manifest.requires_visor}  ·  gates: ${b.manifest.three_gates_status}`)
  }
  for (const e of errors) {
    logger.warn(`Skipped ${e.dir}: ${e.error}`)
  }
}

/**
 * `visor spawn` — fork a blessed reference build, re-skin it with a theme, and
 * (optionally) install deps + validate. See docs/blessed-builds.md.
 */
export function spawnCommand(cwd: string, options: SpawnOptions): void {
  const json = options.json ?? false

  if (options.listBlessed) {
    try {
      listBlessed(cwd, options)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (json) console.log(JSON.stringify({ success: false, error: message }))
      else logger.error(message)
      process.exit(1)
    }
    return
  }

  try {
    const result = runSpawn(cwd, options)
    if (json) {
      console.log(JSON.stringify(result))
      return
    }
    logger.success(
      `Discovered blessed build: ${result.build.shape}/${result.build.pattern} (requires visor ${result.build.requiresVisor})`
    )
    logger.success(`Forked to ${result.output} (excluded node_modules, .next, .git)`)
    logger.success(`Theme applied: ${result.themeApplied} → ${result.output}`)
    if (result.validated) logger.success("Theme validated")
    if (result.installed) logger.success("Installed dependencies")
    logger.blank()
    logger.info(`Next: cd ${result.output} && npm run dev`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (json) console.log(JSON.stringify({ success: false, error: message }))
    else logger.error(message)
    process.exit(1)
  }
}
