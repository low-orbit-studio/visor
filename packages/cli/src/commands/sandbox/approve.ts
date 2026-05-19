import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs"
import { join } from "path"
import * as childProcess from "child_process"
import { logger } from "../../utils/logger.js"
import { captureScriptTemplate } from "./templates.js"

export interface SandboxApproveOptions {
  name: string
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
  const config = JSON.parse(readFileSync(configPath, "utf-8")) as SandboxConfig

  // Rewrite the capture script each run so script updates ship without
  // requiring sandbox re-init.
  const captureScriptPath = join(sandboxDir, "playwright.capture.mjs")
  writeFileSync(captureScriptPath, captureScriptTemplate(), "utf-8")

  ensurePlaywrightInstalled(sandboxDir, json)

  const args = ["--no-install", "node", "playwright.capture.mjs"]
  if (options.diff) args.push("--diff")

  const result = childProcess.spawnSync("npx", args, {
    cwd: sandboxDir,
    stdio: "pipe",
    env: { ...process.env, SANDBOX_PORT: String(config.port) },
    encoding: "utf-8",
  })

  if (result.error) {
    fail(json, `Capture failed to start: ${result.error.message}`)
    return
  }
  if (typeof result.status === "number" && result.status !== 0) {
    fail(json, `Capture script exited with code ${result.status}\n${result.stderr}`)
    return
  }

  const approvedDir = join(sandboxDir, "captures", "approved")
  const diffsDir = join(sandboxDir, "captures", "diffs")
  const approvedFiles = safeListPngs(approvedDir)
  const diffFiles = options.diff ? safeListPngs(diffsDir) : []

  if (json) {
    console.log(
      JSON.stringify(
        {
          success: true,
          mode: options.diff ? "diff" : "approve",
          approvedDir,
          diffsDir: options.diff ? diffsDir : null,
          approved: approvedFiles,
          diffs: diffFiles,
          captureOutput: tryParseJson(result.stdout),
        },
        null,
        2
      )
    )
  } else {
    logger.success(
      options.diff
        ? `Pixel-diff complete. ${diffFiles.length} diff PNGs in ${diffsDir}`
        : `Captured ${approvedFiles.length} PNGs in ${approvedDir}`
    )
    if (options.diff && diffFiles.length > 0) {
      logger.blank()
      logger.info("Changed routes:")
      for (const f of diffFiles) logger.item(f)
    }
  }
}

function ensurePlaywrightInstalled(sandboxDir: string, json: boolean): void {
  const markerPath = join(sandboxDir, ".playwright-installed")
  if (existsSync(markerPath)) return

  if (!json) logger.info("Installing Playwright Chromium (one-time)...")
  const result = childProcess.spawnSync("npx", ["--no-install", "playwright", "install", "chromium"], {
    cwd: sandboxDir,
    stdio: json ? "ignore" : "inherit",
  })
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
