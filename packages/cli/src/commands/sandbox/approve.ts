import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "fs"
import { basename, join } from "path"
import * as childProcess from "child_process"
import { logger } from "../../utils/logger.js"
import { captureScriptTemplate } from "./templates.js"

export interface SandboxApproveOptions {
  name: string
  /**
   * Promote `captures/pending/` → `captures/approved/`. Skips the capture
   * run entirely; the assumption is that a prior `visor sandbox approve`
   * (without this flag) populated pending and the operator has reviewed it.
   */
  approve?: boolean
  /**
   * Deprecated. Default behavior is now pending + diff already; the flag is
   * accepted for backwards compatibility and is a no-op.
   */
  diff?: boolean
  json?: boolean
}

interface SandboxConfig {
  port: number
}

export function sandboxApproveCommand(cwd: string, options: SandboxApproveOptions): void {
  const json = options.json ?? false
  const sandboxDir = join(cwd, ".lo", "sandbox", options.name)
  const configPath = join(sandboxDir, "sandbox.json")

  if (!existsSync(configPath)) {
    fail(
      json,
      `Sandbox '${options.name}' not found at ${sandboxDir}. Run 'visor sandbox init' first.`
    )
    return
  }

  if (options.approve) {
    runPromotion(sandboxDir, options.name, json)
    return
  }

  runCapture(sandboxDir, configPath, options.name, json)
}

function runCapture(
  sandboxDir: string,
  configPath: string,
  sandboxName: string,
  json: boolean
): void {
  const config = JSON.parse(readFileSync(configPath, "utf-8")) as SandboxConfig

  // Rewrite the capture script each run so script updates ship without
  // requiring sandbox re-init.
  const captureScriptPath = join(sandboxDir, "playwright.capture.mjs")
  writeFileSync(captureScriptPath, captureScriptTemplate(), "utf-8")

  ensurePlaywrightInstalled(sandboxDir, json)

  const result = childProcess.spawnSync(
    "npx",
    ["--no-install", "node", "playwright.capture.mjs"],
    {
      cwd: sandboxDir,
      stdio: "pipe",
      env: { ...process.env, SANDBOX_PORT: String(config.port) },
      encoding: "utf-8",
    }
  )

  if (result.error) {
    fail(json, `Capture failed to start: ${result.error.message}`)
    return
  }
  if (typeof result.status === "number" && result.status !== 0) {
    fail(json, `Capture script exited with code ${result.status}\n${result.stderr}`)
    return
  }

  const pendingDir = join(sandboxDir, "captures", "pending")
  const diffsDir = join(sandboxDir, "captures", "diffs")
  const approvedDir = join(sandboxDir, "captures", "approved")
  const pendingFiles = safeListPngs(pendingDir)
  const diffFiles = safeListPngs(diffsDir)
  const hasBaseline = safeListPngs(approvedDir).length > 0

  if (json) {
    console.log(
      JSON.stringify(
        {
          success: true,
          mode: "pending",
          pendingDir,
          diffsDir,
          approvedDir,
          pending: pendingFiles,
          diffs: diffFiles,
          hasBaseline,
          captureOutput: tryParseJson(result.stdout),
        },
        null,
        2
      )
    )
  } else {
    logger.success(
      `Captured ${pendingFiles.length} PNGs in ${pendingDir}` +
        (hasBaseline
          ? ` (${diffFiles.length} differ from approved baseline)`
          : " (no prior baseline — first capture)")
    )
    logger.blank()
    if (diffFiles.length > 0) {
      logger.info("Changed routes:")
      for (const f of diffFiles) logger.item(f)
      logger.blank()
    }
    logger.info("Review captures/pending/ (and captures/diffs/), then promote with:")
    logger.item(`npx visor sandbox approve --name ${sandboxName} --approve`)
  }
}

/**
 * Promote `captures/pending/` → `captures/approved/`. Clears pending and
 * diffs after promotion. Pure (no Playwright/child-process dependency)
 * so it can be unit-tested directly without spawning a browser.
 */
export function runPromotion(sandboxDir: string, sandboxName: string, json: boolean): void {
  const pendingDir = join(sandboxDir, "captures", "pending")
  const approvedDir = join(sandboxDir, "captures", "approved")
  const diffsDir = join(sandboxDir, "captures", "diffs")

  const pendingFiles = safeListPngs(pendingDir)
  if (pendingFiles.length === 0) {
    fail(
      json,
      `No pending captures found at ${pendingDir}. Run 'visor sandbox approve --name ${sandboxName}' (without --approve) first to capture and review.`
    )
    return
  }

  mkdirSync(approvedDir, { recursive: true })
  const promoted: string[] = []
  for (const src of pendingFiles) {
    const dest = join(approvedDir, basename(src))
    copyFileSync(src, dest)
    promoted.push(dest)
  }
  rmSync(pendingDir, { recursive: true, force: true })
  rmSync(diffsDir, { recursive: true, force: true })

  if (json) {
    console.log(
      JSON.stringify(
        { success: true, mode: "approve", approvedDir, promoted },
        null,
        2
      )
    )
  } else {
    logger.success(`Promoted ${promoted.length} pending captures → ${approvedDir}`)
    logger.info("Pending and diff directories cleared.")
  }
}

function ensurePlaywrightInstalled(sandboxDir: string, json: boolean): void {
  const markerPath = join(sandboxDir, ".playwright-installed")
  if (existsSync(markerPath)) return

  if (!json) logger.info("Installing Playwright Chromium (one-time)...")
  const result = childProcess.spawnSync(
    "npx",
    ["--no-install", "playwright", "install", "chromium"],
    {
      cwd: sandboxDir,
      stdio: json ? "ignore" : "inherit",
    }
  )
  if (result.error) {
    throw new Error(`playwright install failed to start: ${result.error.message}`)
  }
  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(`playwright install exited with code ${result.status}`)
  }
  writeFileSync(markerPath, new Date().toISOString(), "utf-8")
}

function safeListPngs(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith(".png"))
    .map((f) => join(dir, f))
}

function tryParseJson(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    return s.trim()
  }
}

function fail(json: boolean, message: string): void {
  if (json) {
    console.log(JSON.stringify({ success: false, error: message }, null, 2))
  } else {
    logger.error(message)
  }
  process.exit(1)
}
