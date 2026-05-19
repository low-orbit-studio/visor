import { existsSync, readFileSync } from "fs"
import { join } from "path"
import * as childProcess from "child_process"
import { logger } from "../../utils/logger.js"

export interface SandboxDevOptions {
  name: string
  json?: boolean
}

interface SandboxConfig {
  pattern: string
  port: number
  primitives: Array<{ name: string }>
  screens: Array<{ name: string; title: string }>
}

export function sandboxDevCommand(cwd: string, options: SandboxDevOptions): void {
  const json = options.json ?? false
  const sandboxDir = join(cwd, ".lo", "sandbox", options.name)
  const configPath = join(sandboxDir, "sandbox.json")

  if (!existsSync(configPath)) {
    fail(
      json,
      `Sandbox '${options.name}' not found at ${sandboxDir}. Run 'visor sandbox init ${options.name} --handoff ... --theme ...' first.`
    )
    return
  }

  let config: SandboxConfig
  try {
    config = JSON.parse(readFileSync(configPath, "utf-8")) as SandboxConfig
  } catch (err) {
    fail(json, `Invalid sandbox.json at ${configPath}: ${(err as Error).message}`)
    return
  }

  const baseUrl = `http://localhost:${config.port}`
  const routes = [
    "/",
    ...config.primitives.map((p) => `/primitives/${p.name}`),
    ...config.screens.map((s) => `/screens/${s.name}`),
  ]

  if (json) {
    console.log(
      JSON.stringify({ success: true, baseUrl, port: config.port, routes }, null, 2)
    )
  } else {
    logger.info(`Sandbox: ${config.pattern}`)
    logger.info(`Dev server on port ${config.port}`)
    logger.info(`Base URL: ${baseUrl}`)
    logger.blank()
    logger.info("Routes:")
    for (const r of routes) logger.item(`${baseUrl}${r}`)
    logger.blank()
  }

  spawnNextDev(sandboxDir, config.port, json)
}

function spawnNextDev(sandboxDir: string, port: number, json: boolean): void {
  const child = childProcess.spawn(
    "npx",
    ["--no-install", "next", "dev", "--port", String(port)],
    {
      cwd: sandboxDir,
      stdio: json ? "ignore" : "inherit",
    }
  )

  child.on("exit", (code) => {
    if (typeof code === "number" && code !== 0 && !json) {
      logger.warn(`next dev exited with code ${code}`)
    }
  })

  // Forward Ctrl-C to the child process so consumers can stop the server.
  const stop = (): void => {
    if (!child.killed) child.kill("SIGINT")
  }
  process.on("SIGINT", stop)
  process.on("SIGTERM", stop)
}

function fail(json: boolean, message: string): void {
  if (json) {
    console.log(JSON.stringify({ success: false, error: message }, null, 2))
  } else {
    logger.error(message)
  }
  process.exit(1)
}
