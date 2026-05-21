import { existsSync, mkdirSync, readFileSync, rmSync } from "fs"
import { isAbsolute, join, resolve, dirname } from "path"
import { fileURLToPath } from "url"
import * as childProcess from "child_process"
import { logger } from "../../utils/logger.js"
import { parseHandoff } from "./parse-handoff.js"
import type { HandoffManifest, PrimitiveEntry } from "./parse-handoff.js"
import { findOpenPort } from "./ports.js"
import { sandboxIsEmpty, writeSandboxConfig, writeScaffold } from "./scaffold.js"
import { copyHtmlPrototype, type PrototypeImport } from "./html-prototype.js"
import { addCommand } from "../add.js"
import { themeApplyCommand } from "../theme-apply.js"
import { loadRegistry, filterItemsByTarget } from "../../registry/resolve.js"

export interface SandboxInitOptions {
  handoff: string
  theme: string
  themeFile?: string
  fromHtmlPrototype?: string
  overwrite?: boolean
  skipInstall?: boolean
  json?: boolean
}

export interface SandboxInitJsonResult {
  success: boolean
  sandboxDir?: string
  port?: number
  primitives?: { shipped: string[]; gaps: string[] }
  prototypeImport?: PrototypeImport
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

  let prototypeImport: PrototypeImport | undefined
  if (options.fromHtmlPrototype) {
    const prototypeDir = isAbsolute(options.fromHtmlPrototype)
      ? options.fromHtmlPrototype
      : resolve(cwd, options.fromHtmlPrototype)
    if (!existsSync(prototypeDir)) {
      throw new Error(`HTML prototype directory not found: ${prototypeDir}`)
    }
    prototypeImport = copyHtmlPrototype(prototypeDir, sandboxDir, manifest)
    for (const w of prototypeImport.warnings) manifest.warnings.push(w)
  }

  // Gate 3 reclassification: any handoff entry declared `shipped` or
  // `gap-inflight` that the registry doesn't know about is a consumer-side
  // composition of existing primitives, not a net-new Visor artifact. Reclassify
  // before we scaffold so `lib/sandbox-manifest.ts` and `sandbox.json` both
  // surface the correct `compose-recipe` kind. See VI-444 and PL-1570 finding #8.
  const known = loadKnownPrimitives()
  for (const p of manifest.primitives) {
    if (p.status !== "shipped" && p.status !== "gap-inflight") continue
    if (known.has(p.name)) continue
    p.status = "compose-recipe"
    p.viTicket = undefined
    manifest.warnings.push(
      `'${p.name}' declared shipped in the handoff but absent from the registry — reclassified as compose-recipe`
    )
  }

  writeScaffold(sandboxDir, manifest, port, { prototypeImport })

  if (!options.skipInstall) {
    runNpmInstall(sandboxDir, options.json ?? false)
  }

  applyThemeIfPossible(
    sandboxDir,
    manifest,
    options.theme,
    cwd,
    options.json ?? false,
    options.themeFile
  )

  const shipped: string[] = []
  for (const p of manifest.primitives) {
    if (p.status !== "shipped" && p.status !== "gap-inflight") continue
    const ok = tryAddPrimitive(p, sandboxDir, options.json ?? false)
    if (ok) shipped.push(p.name)
  }
  const gaps = manifest.primitives.filter((p) => p.status === "gap-new").map((p) => p.name)

  writeSandboxConfig(sandboxDir, manifest, port, {
    handoffPath,
    theme: options.theme,
    visorVersion: readCliVersion(),
    prototypeImport,
  })

  return {
    success: true,
    sandboxDir,
    port,
    primitives: { shipped, gaps },
    prototypeImport,
    warnings: manifest.warnings,
  }
}

function applyThemeIfPossible(
  sandboxDir: string,
  manifest: HandoffManifest,
  theme: string,
  cwd: string,
  json: boolean,
  themeFile?: string
): void {
  // Resolve the theme yaml in this order:
  //   1. Explicit --theme-file <path> (absolute or relative to cwd).
  //   2. `theme` arg as a direct path that exists on disk.
  //   3. ${VISOR_THEMES_PRIVATE_PATH}/themes/${theme}/theme.visor.yaml — for
  //      operators who keep brand themes in a private repo (e.g.
  //      ~/Code/low-orbit/visor-themes-private).
  //   4. Fallback: cwd/themes/${theme}.visor.yaml and cwd/custom-themes/${theme}.visor.yaml.
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

  const yamlPath = candidates.find((p) => existsSync(p))
  if (!yamlPath) {
    const searched = candidates.join(", ")
    manifest.warnings.push(
      `Theme '${theme}' not found (searched: ${searched}) — sandbox uses placeholder globals.css. ` +
        `Run 'npx visor theme apply <path-to-theme.visor.yaml> --adapter nextjs -o ${join(sandboxDir, "app", "globals.css")}' manually, ` +
        `or re-run with --theme-file <path>, or set VISOR_THEMES_PRIVATE_PATH to a directory containing themes/${theme}/theme.visor.yaml.`
    )
    if (!json) {
      logger.warn(`Theme '${theme}' not found — leaving placeholder globals.css.`)
      logger.item(
        `Re-run with --theme-file <path>, or set VISOR_THEMES_PRIVATE_PATH=<dir-containing-themes/${theme}/theme.visor.yaml>.`
      )
      logger.item(
        `Or apply manually: npx visor theme apply <path> --adapter nextjs -o ${join(sandboxDir, "app", "globals.css")}`
      )
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

