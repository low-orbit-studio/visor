import { existsSync, writeFileSync, mkdirSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import * as childProcess from "child_process"
import type { SpawnSyncReturns } from "child_process"
import { configExists, writeConfig } from "../config/config.js"
import { DEFAULT_CONFIG } from "../config/defaults.js"
import { hasVisorTokens } from "../utils/packages.js"
import { logger } from "../utils/logger.js"
import {
  NEXTJS_STARTER_YAML,
  NEXTJS_PINNED_VERSION,
  CREATE_NEXT_APP_FLAGS,
  generateNextjsLayout,
} from "./templates/nextjs.js"
import { generateThemeData } from "@loworbitstudio/visor-theme-engine"
import { nextjsAdapter } from "@loworbitstudio/visor-theme-engine/adapters"

export interface InitOptions {
  template?: string
  json?: boolean
}

interface JsonInitResult {
  success: boolean
  config?: typeof DEFAULT_CONFIG
  files?: { created: string[]; skipped: string[] }
  warnings?: string[]
  nextSteps?: string[]
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

  // Refusal gate for --template nextjs: never destructively scaffold over an
  // in-flight project. Retrofit flow lives in borealis.md §3.2.
  if (options?.template === "nextjs" && existsSync(join(cwd, "package.json"))) {
    emitError(
      json,
      "package.json already exists in this directory. visor init --template nextjs only scaffolds into empty directories. For an existing app, see the retrofit flow: https://visor.loworbit.studio/docs/guides/migration"
    )
    process.exit(1)
  }

  // Always create visor.json if it doesn't exist
  if (configExists(cwd)) {
    filesSkipped.push("visor.json")
    if (!json) {
      logger.warn("visor.json already exists. Skipping config creation.")
    }
  } else {
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

  // Template scaffolding
  if (options?.template === "nextjs") {
    scaffoldNextjs(cwd, json, filesCreated, filesSkipped, warnings)
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

  if (json) {
    const nextSteps = buildNextSteps(options, warnings)
    const result: JsonInitResult = {
      success: true,
      config: DEFAULT_CONFIG,
      files: { created: filesCreated, skipped: filesSkipped },
      warnings,
      nextSteps,
    }
    console.log(JSON.stringify(result, null, 2))
    process.exit(0)
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
 * Scaffolds a complete runnable Borealis-native Next.js App Router app.
 *
 * Order of operations:
 *   1. Shell out to create-next-app (pinned version) — produces package.json,
 *      app/page.tsx, app/layout.tsx, tsconfig.json, next.config.*, .gitignore.
 *   2. Install @loworbitstudio/visor-core and @loworbitstudio/visor-theme-engine.
 *   3. Write .visor.yaml.
 *   4. Generate app/globals.css via the existing nextjs adapter.
 *   5. Overwrite app/layout.tsx with a Visor layout that imports globals.css
 *      and injects FOWT_SCRIPT inline in <head> before first paint.
 *   6. Write .lo/borealis.json stamp with visor version + ISO timestamp.
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

  // Overwrite app/layout.tsx with the Visor layout (FOWT + globals).
  const layoutPath = join(cwd, "app", "layout.tsx")
  writeFileSync(layoutPath, generateNextjsLayout(), "utf-8")
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
