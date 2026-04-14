import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"
import { CONFIG_FILE, DEFAULT_CONFIG, type VisorConfig } from "./defaults.js"

export function getConfigPath(cwd: string): string {
  return join(cwd, CONFIG_FILE)
}

export function configExists(cwd: string): boolean {
  return existsSync(getConfigPath(cwd))
}

export function loadConfig(cwd: string): VisorConfig {
  const configPath = getConfigPath(cwd)
  if (!existsSync(configPath)) {
    throw new Error(
      `No ${CONFIG_FILE} found. Run "visor init" first.`
    )
  }
  const raw = readFileSync(configPath, "utf-8")
  const parsed = JSON.parse(raw) as Record<string, unknown>

  // Warn on unknown top-level keys
  const knownKeys = new Set(["paths"])
  for (const key of Object.keys(parsed)) {
    if (!knownKeys.has(key)) {
      console.warn(`Warning: unknown key "${key}" in visor.json`)
    }
  }

  // Validate paths
  if (parsed.paths !== undefined) {
    if (
      typeof parsed.paths !== "object" ||
      parsed.paths === null ||
      Array.isArray(parsed.paths)
    ) {
      throw new Error(
        `Invalid visor.json: paths must be an object, got ${Array.isArray(parsed.paths) ? "array" : typeof parsed.paths}`
      )
    }
    const paths = parsed.paths as Record<string, unknown>
    for (const [key, value] of Object.entries(paths)) {
      if (typeof value !== "string") {
        throw new Error(
          `Invalid visor.json: paths.${key} must be a string, got ${typeof value}`
        )
      }
    }
  }

  // Merge with defaults so existing visor.json files get new fields
  return {
    paths: {
      ...DEFAULT_CONFIG.paths,
      ...(parsed.paths as Partial<VisorConfig["paths"]>),
    },
  }
}

export function writeConfig(cwd: string, config: VisorConfig): void {
  const configPath = getConfigPath(cwd)
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8")
}
