import { existsSync, writeFileSync, mkdirSync, readFileSync } from "fs"
import { join, dirname, basename } from "path"
import { fileURLToPath } from "url"
import * as childProcess from "child_process"
import type { SpawnSyncReturns } from "child_process"
import { configExists, writeConfig } from "../config/config.js"
import { DEFAULT_CONFIG } from "../config/defaults.js"
import { hasVisorTokens } from "../utils/packages.js"
import { logger } from "../utils/logger.js"
import {
  extractColorScheme,
  NEXTJS_STARTER_YAML,
  NEXTJS_PINNED_VERSION,
  CREATE_NEXT_APP_FLAGS,
  generateNextjsLayout,
} from "./templates/nextjs.js"
import {
  getPlay,
  knownPlayIds,
  playStatePaths,
  readPlayState,
  writePlayState,
  type PlayDefinition,
  type PlayState,
} from "./init-plays/registry.js"
import { allocatePort, type PortSource } from "../lib/lo-ports-bridge.js"
import { readEntryChecklist } from "../lib/lo-play-checklist.js"
import { generateThemeData } from "@loworbitstudio/visor-theme-engine"
import { nextjsAdapter } from "@loworbitstudio/visor-theme-engine/adapters"

export interface InitOptions {
  template?: string
  json?: boolean
  /** Bootstrap a Playbook play (D2): pattern-build, new-web-app, feature-addition. */
  for?: string
  /** Name for the play instance (defaults to the current directory name). */
  playName?: string
  /** Theme id to record in the play's state metadata. */
  theme?: string
  /** Brief source for the play (e.g. a PL-N Linear ticket). */
  from?: string
}

interface PlayInitResult {
  play: string
  name: string
  statePath: string
  phase: number
  devPort?: number
  portSource?: PortSource
  theme?: string
  from?: string
  alreadyInitialized: boolean
  checklist: { found: boolean; path: string }
}

interface JsonInitResult {
  success: boolean
  config?: typeof DEFAULT_CONFIG
  files?: { created: string[]; skipped: string[] }
  warnings?: string[]
  nextSteps?: string[]
  play?: PlayInitResult
  error?: string
}

export function initCommand(cwd: string, options?: InitOptions): void {
  const json = options?.json ?? false
  const filesCreated: string[] = []
  const filesSkipped: string[] = []
  const warnings: string[] = []

  if (options?.template && options.template !== "nextjs") {
    emitError(json, `Unknown template: ${options.template}. Available templates: nextjs`)
    process.exit(1)
  }

  // Resolve --for up front so an unknown play errors cleanly before any writes
  // (D2). The known-plays table is static — Visor does not discover plays from a
  // Playbook install.
  let playDef: PlayDefinition | undefined
  let playName = ""
  if (options?.for) {
    playDef = getPlay(options.for)
    if (!playDef) {
      emitError(
        json,
        `Unknown play: ${options.for}. Known plays: ${knownPlayIds().join(", ")}`
      )
      process.exit(1)
    }
    playName = options.playName ?? basename(cwd)
    if (!/^[a-z0-9][a-z0-9-_]*$/i.test(playName)) {
      emitError(
        json,
        `Invalid play name '${playName}'. Use letters, digits, '-' or '_' (e.g. --play-name organization-management).`
      )
      process.exit(1)
    }
  }

  // Refusal gate for --template nextjs: never destructively scaffold over an
  // in-flight project. Retrofit flow lives in borealis.md §3.2.
  if (options?.template === "nextjs" && existsSync(join(cwd, "package.json"))) {
    emitError(
      json,
      "package.json already exists in this directory. visor init --template nextjs only scaffolds into empty directories. For an existing app, see the retrofit flow: https://visor.loworbit.studio/docs/guides/migration"
    )
    process.exit(1)
  }

  // visor.json write vs. create-next-app ordering (VI-619). create-next-app
  // refuses to scaffold into a directory that already contains conflicting
  // files, and visor.json — which visor itself writes — is exactly such a
  // conflict. So for the nextjs template path, visor.json MUST be written AFTER
  // create-next-app runs; scaffoldNextjs performs that write itself, right after
  // the scaffolder succeeds. The non-template path has nothing that shells out,
  // so it keeps writing visor.json first (its historical order).
  if (options?.template === "nextjs") {
    scaffoldNextjs(cwd, json, filesCreated, filesSkipped, warnings)
  } else {
    writeVisorConfig(cwd, json, filesCreated, filesSkipped)
  }

  // Tokens warning is irrelevant after nextjs scaffold (we install the dep
  // ourselves). Only check it for the non-template flow.
  if (options?.template !== "nextjs") {
    const missingTokens = !hasVisorTokens(cwd)
    if (missingTokens) {
      const warning = "@loworbitstudio/visor-core is not installed. Components require it for styling."
      warnings.push(warning)
      if (!json) {
        logger.blank()
        logger.warn(warning)
        logger.info("  For a complete one-command setup: run `npx @loworbitstudio/visor init --template nextjs` in an empty directory.")
      }
    }
  }

  // Play bootstrap (D1): additive to the scaffold. Writes only the
  // play-specific .lo/ subdirectory, allocates a dev port, and prints the
  // play's entry checklist.
  let playResult: PlayInitResult | undefined
  if (playDef) {
    playResult = runPlayInit(cwd, playDef, playName, options ?? {}, json, warnings)
  }

  if (json) {
    const nextSteps = buildNextSteps(options, warnings)
    const result: JsonInitResult = {
      success: true,
      config: DEFAULT_CONFIG,
      files: { created: filesCreated, skipped: filesSkipped },
      warnings,
      nextSteps,
      ...(playResult ? { play: playResult } : {}),
    }
    console.log(JSON.stringify(result, null, 2))
    process.exit(0)
  }
}

/**
 * Bootstrap a Playbook play: write `.lo/{subdir}/{name}/state.json` at phase 0
 * (D5), allocate a dev port via /lo-ports with a heuristic fallback (D4), and
 * print the play's entry checklist (D6). Idempotent (D7): a second run with the
 * same play + name is a no-op that reports the existing state.
 */
function runPlayInit(
  cwd: string,
  def: PlayDefinition,
  name: string,
  options: InitOptions,
  json: boolean,
  warnings: string[]
): PlayInitResult {
  const { statePath, relStatePath } = playStatePaths(cwd, def, name)
  const existing = readPlayState(statePath)
  const checklist = readEntryChecklist(def.id)

  if (existing) {
    // Idempotent no-op — do not re-allocate a port or overwrite state.
    if (!json) {
      logger.blank()
      logger.warn(
        `Play '${def.id}' / '${name}' already initialized at ${relStatePath} ` +
          `(phase ${existing.phase}${existing.devPort ? `, port ${existing.devPort}` : ""}). Nothing to do.`
      )
      printChecklist(def.id, checklist)
    }
    return {
      play: def.id,
      name,
      statePath: relStatePath,
      phase: existing.phase,
      devPort: existing.devPort,
      portSource: existing.portSource,
      theme: existing.theme,
      from: existing.from,
      alreadyInitialized: true,
      checklist: { found: checklist.found, path: checklist.path },
    }
  }

  const port = allocatePort(name)
  if (port.warning) warnings.push(port.warning)

  const state: PlayState = {
    play: def.id,
    name,
    phase: 0,
    ...(options.theme ? { theme: options.theme } : {}),
    ...(options.from ? { from: options.from } : {}),
    devPort: port.port,
    portSource: port.source,
    createdWith: `@loworbitstudio/visor@${readVisorCliVersion()}`,
    createdAt: new Date().toISOString(),
  }
  writePlayState(statePath, state)

  if (!json) {
    logger.blank()
    if (options.template === "nextjs") {
      logger.success("Visor scaffold: NextJS + tokens + FOWT layout")
    }
    logger.success(`Playbook state: ${relStatePath} (phase 0)`)
    if (port.source === "lo-ports") {
      logger.success(`Dev port allocated: ${port.port} (via /lo-ports)`)
    } else {
      logger.warn(port.warning ?? `Dev port ${port.port} (heuristic fallback)`)
      logger.success(`Dev port: ${port.port} (heuristic fallback)`)
    }
    if (options.theme) logger.success(`Theme recorded: ${options.theme}`)
    printChecklist(def.id, checklist)
  }

  return {
    play: def.id,
    name,
    statePath: relStatePath,
    phase: 0,
    devPort: port.port,
    portSource: port.source,
    theme: options.theme,
    from: options.from,
    alreadyInitialized: false,
    checklist: { found: checklist.found, path: checklist.path },
  }
}

function printChecklist(
  playId: string,
  checklist: ReturnType<typeof readEntryChecklist>
): void {
  logger.blank()
  if (checklist.found) {
    logger.info(`Next steps (from ${checklist.path}):`)
    for (const line of checklist.content.split("\n")) {
      logger.item(line)
    }
  } else {
    logger.warn(checklist.fallbackMessage)
  }
}

function buildNextSteps(options: InitOptions | undefined, warnings: string[]): string[] {
  const steps: string[] = []
  if (options?.template === "nextjs") {
    steps.push("Run: npm run dev — start the development server")
    steps.push("Customize colors in .visor.yaml, then re-run `npx visor theme apply .visor.yaml --adapter nextjs`")
    steps.push("Run: npx visor add button — add your first component")
  } else {
    steps.push("Run: npx visor add button — add your first component")
  }
  if (warnings.some((w) => w.includes("visor-core"))) {
    steps.push("For a complete one-command setup: re-run with --template nextjs in an empty directory")
  }
  return steps
}

function emitError(json: boolean, message: string): void {
  if (json) {
    const result: JsonInitResult = { success: false, error: message }
    console.log(JSON.stringify(result, null, 2))
  } else {
    logger.error(message)
  }
}

/**
 * Write visor.json with the default config, or skip + warn if it already exists.
 * Extracted so the write can be ordered correctly relative to create-next-app in
 * the nextjs template path (VI-619): the scaffolder refuses to run in a directory
 * containing conflicting files, so visor.json must land AFTER it, not before.
 */
function writeVisorConfig(
  cwd: string,
  json: boolean,
  filesCreated: string[],
  filesSkipped: string[]
): void {
  if (configExists(cwd)) {
    filesSkipped.push("visor.json")
    if (!json) {
      logger.warn("visor.json already exists. Skipping config creation.")
    }
    return
  }

  writeConfig(cwd, DEFAULT_CONFIG)
  filesCreated.push("visor.json")
  if (!json) {
    logger.success("Created visor.json")
    logger.blank()
    logger.info("Default paths:")
    logger.item(`components      → ${DEFAULT_CONFIG.paths.components}`)
    logger.item(`deck components → ${DEFAULT_CONFIG.paths.deckComponents}`)
    logger.item(`blocks          → ${DEFAULT_CONFIG.paths.blocks}`)
    logger.item(`hooks           → ${DEFAULT_CONFIG.paths.hooks}`)
    logger.item(`lib             → ${DEFAULT_CONFIG.paths.lib}`)
  }
}

/**
 * Scaffolds a complete runnable Borealis-native Next.js App Router app.
 *
 * Order of operations:
 *   1. Shell out to create-next-app (pinned version) — produces package.json,
 *      app/page.tsx, app/layout.tsx, tsconfig.json, next.config.*, .gitignore.
 *   2. Write visor.json (VI-619: only now, once create-next-app has run — it
 *      would otherwise be flagged as a conflicting file in the empty directory).
 *   3. Install @loworbitstudio/visor-core and @loworbitstudio/visor-theme-engine.
 *   4. Write .visor.yaml.
 *   5. Generate app/globals.css via the existing nextjs adapter.
 *   6. Overwrite app/layout.tsx with a Visor layout that imports globals.css
 *      and injects FOWT_SCRIPT inline in <head> before first paint.
 *   7. Write .lo/borealis.json stamp with visor version + ISO timestamp.
 *
 * Idempotency: this function assumes refusal-on-existing-package.json has
 * already gated execution (handled in initCommand). Inside this function,
 * existing .visor.yaml / globals.css / .lo/borealis.json are left alone and
 * tracked as skipped. The layout.tsx is always overwritten because
 * create-next-app always writes a default we need to replace.
 */
function scaffoldNextjs(
  cwd: string,
  json: boolean,
  filesCreated: string[],
  filesSkipped: string[],
  warnings: string[]
): void {
  if (!json) {
    logger.blank()
    logger.info("Scaffolding a Borealis-native Next.js app...")
  }

  runCreateNextApp(cwd, json)
  // Write visor.json only now — create-next-app has run, so it can no longer be
  // seen as a conflicting file in the (formerly empty) target directory (VI-619).
  writeVisorConfig(cwd, json, filesCreated, filesSkipped)
  runInstallVisorDeps(cwd, json)

  // Write .visor.yaml
  const yamlPath = join(cwd, ".visor.yaml")
  if (existsSync(yamlPath)) {
    filesSkipped.push(".visor.yaml")
    if (!json) {
      logger.warn(".visor.yaml already exists. Skipping.")
    }
  } else {
    writeFileSync(yamlPath, NEXTJS_STARTER_YAML, "utf-8")
    filesCreated.push(".visor.yaml")
    if (!json) {
      logger.success("Created .visor.yaml")
    }
  }

  // Generate globals.css via NextJS adapter
  const data = generateThemeData(NEXTJS_STARTER_YAML)
  const css = nextjsAdapter({
    primitives: data.primitives,
    tokens: data.tokens,
    config: data.config,
  })

  const globalsPath = join(cwd, "app", "globals.css")
  const globalsDir = dirname(globalsPath)
  mkdirSync(globalsDir, { recursive: true })

  if (existsSync(globalsPath)) {
    // Overwrite create-next-app's default globals.css — its Tailwind defaults
    // are not what a Visor app wants. We track this as created (the file the
    // user ends up with is ours, not the scaffolder's).
    writeFileSync(globalsPath, css, "utf-8")
    filesCreated.push("app/globals.css")
  } else {
    writeFileSync(globalsPath, css, "utf-8")
    filesCreated.push("app/globals.css")
  }
  if (!json) {
    logger.success("Created app/globals.css with theme tokens")
  }

  // Overwrite app/layout.tsx with the Visor layout (FOWT + globals). The
  // theme's declared `color-scheme` drives the mode applied at the root, keyed
  // off the same starter yaml globals.css is generated from so the two stay in
  // sync.
  const layoutPath = join(cwd, "app", "layout.tsx")
  const colorScheme = extractColorScheme(NEXTJS_STARTER_YAML)
  writeFileSync(layoutPath, generateNextjsLayout(colorScheme), "utf-8")
  filesCreated.push("app/layout.tsx")
  if (!json) {
    logger.success("Wired app/layout.tsx with FOWT prevention and theme tokens")
  }

  // Write .lo/borealis.json stamp.
  const stampDir = join(cwd, ".lo")
  const stampPath = join(stampDir, "borealis.json")
  if (existsSync(stampPath)) {
    filesSkipped.push(".lo/borealis.json")
    if (!json) {
      logger.warn(".lo/borealis.json already exists. Skipping.")
    }
  } else {
    mkdirSync(stampDir, { recursive: true })
    const stamp = {
      visorVersion: readVisorCliVersion(),
      initializedAt: new Date().toISOString(),
    }
    writeFileSync(stampPath, JSON.stringify(stamp, null, 2) + "\n", "utf-8")
    filesCreated.push(".lo/borealis.json")
    if (!json) {
      logger.success("Stamped .lo/borealis.json")
    }
  }

  if (!json) {
    logger.blank()
    logger.success("Your Borealis-native Next.js app is ready.")
    logger.blank()
    logger.info("Next steps:")
    logger.item("npm run dev                           # start the dev server")
    logger.item("Edit .visor.yaml to customize tokens, then re-run theme apply")
    logger.item("npx visor add button                  # add your first component")
  }

  // Suppress the unused parameter warning — warnings array is reserved for
  // future scaffolder failures we want to surface without aborting.
  void warnings
}

function runCreateNextApp(cwd: string, json: boolean): void {
  if (!json) {
    logger.info(`Running create-next-app@${NEXTJS_PINNED_VERSION}...`)
  }
  const result = childProcess.spawnSync(
    "npx",
    [`create-next-app@${NEXTJS_PINNED_VERSION}`, ".", ...CREATE_NEXT_APP_FLAGS],
    { cwd, stdio: json ? "ignore" : "inherit" }
  )
  assertSpawnSuccess(result, "create-next-app")
}

function runInstallVisorDeps(cwd: string, json: boolean): void {
  if (!json) {
    logger.info("Installing @loworbitstudio/visor-core and visor-theme-engine...")
  }
  const result = childProcess.spawnSync(
    "npm",
    [
      "install",
      "@loworbitstudio/visor-core",
      "@loworbitstudio/visor-theme-engine",
    ],
    { cwd, stdio: json ? "ignore" : "inherit" }
  )
  assertSpawnSuccess(result, "npm install")
}

function assertSpawnSuccess(result: SpawnSyncReturns<Buffer>, label: string): void {
  if (result.error) {
    throw new Error(`${label} failed to start: ${result.error.message}`)
  }
  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(`${label} exited with code ${result.status}`)
  }
}

/**
 * Reads the visor CLI's own version from package.json. Walks up from the
 * current source/dist file looking for the @loworbitstudio/visor manifest so
 * it works in both source (vitest) and bundled (production) execution.
 */
function readVisorCliVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    for (let i = 0; i < 5; i++) {
      const segments = new Array(i).fill("..") as string[]
      const candidate = join(here, ...segments, "package.json")
      try {
        const pkg = JSON.parse(readFileSync(candidate, "utf-8")) as {
          name?: string
          version?: string
        }
        if (pkg.name === "@loworbitstudio/visor" && pkg.version) {
          return pkg.version
        }
      } catch {
        // try next level up
      }
    }
  } catch {
    // fall through to default
  }
  return "0.0.0-dev"
}
