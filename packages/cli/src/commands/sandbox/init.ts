import { existsSync, mkdirSync, readFileSync, rmSync } from "fs"
import { isAbsolute, join, resolve, dirname } from "path"
import { fileURLToPath } from "url"
import * as childProcess from "child_process"
import { logger } from "../../utils/logger.js"
import { parseHandoff } from "./parse-handoff.js"
import type { HandoffManifest, PrimitiveEntry } from "./parse-handoff.js"
import { findOpenPort } from "./ports.js"
import { sandboxIsEmpty, writeSandboxConfig, writeScaffold } from "./scaffold.js"
import { addCommand } from "../add.js"
import { themeApplyCommand } from "../theme-apply.js"
import { loadRegistry, filterItemsByTarget } from "../../registry/resolve.js"

export interface SandboxInitOptions {
  handoff: string
  theme: string
  overwrite?: boolean
  skipInstall?: boolean
  json?: boolean
}

export interface SandboxInitJsonResult {
  success: boolean
  sandboxDir?: string
  port?: number
  primitives?: { shipped: string[]; gaps: string[] }
  warnings?: string[]
  error?: string
}

export async function sandboxInitCommand(
  name: string,
  cwd: string,
  options: SandboxInitOptions
): Promise<void> {
  const json = options.json ?? false
  try {
    const result = await runInit(name, cwd, options)
    if (json) {
      console.log(JSON.stringify(result, null, 2))
      return
    }
    logger.blank()
    logger.success(`Sandbox ready at ${result.sandboxDir}`)
    logger.info(`Port: ${result.port} (port 3000 reserved)`)
    logger.info(`Shipped primitives added: ${result.primitives?.shipped.length ?? 0}`)
    logger.info(`Gap stubs generated: ${result.primitives?.gaps.length ?? 0}`)
    if (result.warnings && result.warnings.length > 0) {
      logger.blank()
      logger.warn("Warnings:")
      for (const w of result.warnings) logger.item(w)
    }
    logger.blank()
    logger.info("Next:")
    logger.item(`npx visor sandbox dev --name ${name}`)
    logger.item(`npx visor sandbox approve --name ${name}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (json) {
      console.log(JSON.stringify({ success: false, error: message }, null, 2))
    } else {
      logger.error(message)
    }
    process.exit(1)
  }
}

async function runInit(
  name: string,
  cwd: string,
  options: SandboxInitOptions
): Promise<SandboxInitJsonResult> {
  if (!name || !/^[a-z0-9][a-z0-9-_]*$/i.test(name)) {
    throw new Error(`Invalid sandbox name '${name}'. Use letters, digits, '-' or '_'.`)
  }

  const handoffPath = isAbsolute(options.handoff)
    ? options.handoff
    : resolve(cwd, options.handoff)
  if (!existsSync(handoffPath)) {
    throw new Error(`Handoff manifest not found: ${handoffPath}`)
  }

  const manifest = parseHandoff(handoffPath)
  if (manifest.primitives.length === 0) {
    throw new Error(
      `Handoff has no primitives — refusing to scaffold an empty sandbox. Check the manifest at ${handoffPath}`
    )
  }

  const sandboxDir = join(cwd, ".lo", "sandbox", name)
  if (!sandboxIsEmpty(sandboxDir)) {
    if (!options.overwrite) {
      throw new Error(
        `Sandbox directory not empty: ${sandboxDir}. Pass --overwrite to replace it.`
      )
    }
    rmSync(sandboxDir, { recursive: true, force: true })
  }
  mkdirSync(sandboxDir, { recursive: true })

  const port = await findOpenPort()

  writeScaffold(sandboxDir, manifest, port)

  if (!options.skipInstall) {
    runNpmInstall(sandboxDir, options.json ?? false)
  }

  applyThemeIfPossible(sandboxDir, manifest, options.theme, cwd, options.json ?? false)

  const known = loadKnownPrimitives()
  const shipped: string[] = []
  for (const p of manifest.primitives) {
    if (p.status !== "shipped" && p.status !== "gap-inflight") continue
    if (!known.has(p.name)) {
      manifest.warnings.push(
        `'${p.name}' is declared shipped in the handoff but is not in the registry — skipped`
      )
      continue
    }
    const ok = tryAddPrimitive(p, sandboxDir, options.json ?? false)
    if (ok) shipped.push(p.name)
  }
  const gaps = manifest.primitives.filter((p) => p.status === "gap-new").map((p) => p.name)

  writeSandboxConfig(sandboxDir, manifest, port, {
    handoffPath,
    theme: options.theme,
    visorVersion: readCliVersion(),
  })

  return {
    success: true,
    sandboxDir,
    port,
    primitives: { shipped, gaps },
    warnings: manifest.warnings,
  }
}

function applyThemeIfPossible(
  sandboxDir: string,
  manifest: HandoffManifest,
  theme: string,
  cwd: string,
  json: boolean
): void {
  // Resolve the theme yaml. If `theme` is a path that exists, use it directly.
  // Otherwise lookup by name in cwd/themes/ and cwd/custom-themes/.
  const directPath = isAbsolute(theme) ? theme : resolve(cwd, theme)
  const candidates = [
    directPath,
    join(cwd, "themes", `${theme}.visor.yaml`),
    join(cwd, "custom-themes", `${theme}.visor.yaml`),
  ]
  const yamlPath = candidates.find((p) => existsSync(p))
  if (!yamlPath) {
    manifest.warnings.push(
      `Theme '${theme}' not found in themes/ or custom-themes/ — sandbox uses placeholder globals.css. Run 'visor theme apply <path> --adapter nextjs -o app/globals.css' manually.`
    )
    if (!json) {
      logger.warn(`Theme '${theme}' not found — leaving placeholder globals.css.`)
    }
    return
  }

  const globalsOut = join(sandboxDir, "app", "globals.css")
  try {
    themeApplyCommand(yamlPath, sandboxDir, {
      output: globalsOut,
      adapter: "nextjs",
      json: false,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    manifest.warnings.push(`Theme apply failed: ${msg}`)
    if (!json) logger.warn(`Theme apply failed: ${msg}`)
  }
}

function tryAddPrimitive(
  primitive: PrimitiveEntry,
  sandboxDir: string,
  json: boolean
): boolean {
  try {
    addCommand([primitive.name], sandboxDir, {
      overwrite: true,
      target: "react",
      json: false,
    })
    return true
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (!json) {
      logger.warn(`Skipped '${primitive.name}': ${msg}`)
    }
    return false
  }
}

function runNpmInstall(sandboxDir: string, json: boolean): void {
  if (!json) logger.info("Installing sandbox dependencies...")
  const result = childProcess.spawnSync("npm", ["install", "--no-audit", "--no-fund"], {
    cwd: sandboxDir,
    stdio: json ? "ignore" : "inherit",
  })
  if (result.error) {
    throw new Error(`npm install failed to start: ${result.error.message}`)
  }
  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(`npm install exited with code ${result.status}`)
  }
}

function loadKnownPrimitives(): Set<string> {
  try {
    const reg = loadRegistry()
    const items = filterItemsByTarget(reg.items, "react")
    return new Set(items.map((i) => i.name))
  } catch {
    return new Set()
  }
}

function readCliVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    for (let i = 0; i < 6; i++) {
      const segments = new Array(i).fill("..") as string[]
      const candidate = join(here, ...segments, "package.json")
      try {
        const pkg = JSON.parse(readFileSync(candidate, "utf-8")) as {
          name?: string
          version?: string
        }
        if (pkg.name === "@loworbitstudio/visor" && pkg.version) return pkg.version
      } catch {
        // try next level up
      }
    }
  } catch {
    // fall through
  }
  return "0.0.0-dev"
}

