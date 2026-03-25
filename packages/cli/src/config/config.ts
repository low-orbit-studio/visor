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
  const parsed = JSON.parse(raw) as Partial<VisorConfig>
  // Merge with defaults so existing visor.json files get new fields
  return {
    paths: {
      ...DEFAULT_CONFIG.paths,
      ...parsed.paths,
    },
  }
}

export function writeConfig(cwd: string, config: VisorConfig): void {
  const configPath = getConfigPath(cwd)
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8")
}
