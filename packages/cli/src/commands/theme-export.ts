import { readFileSync } from "fs"
import { resolve } from "path"
import { stringify as stringifyYaml } from "yaml"
import {
  parseConfig,
  resolveConfig,
  generatePrimitives,
  exportTheme,
} from "@loworbitstudio/visor-theme-engine"
import { logger } from "../utils/logger.js"

export interface ThemeExportOptions {
  format?: "yaml" | "json"
  json?: boolean
}

export function themeExportCommand(
  file: string | undefined,
  cwd: string,
  options: ThemeExportOptions
): void {
  // Default to .visor.yaml in cwd
  const filePath = resolve(cwd, file ?? ".visor.yaml")
  let yamlContent: string

  try {
    yamlContent = readFileSync(filePath, "utf-8")
  } catch {
    if (options.json) {
      console.log(
        JSON.stringify({
          success: false,
          error: `Could not read file: ${filePath}`,
        })
      )
    } else {
      logger.error(`Could not read file: ${filePath}`)
      logger.info(
        "Make sure a .visor.yaml file exists in the current directory, or specify a path."
      )
    }
    process.exit(2)
  }

  // Parse the config
  let config: ReturnType<typeof parseConfig>
  try {
    config = parseConfig(yamlContent)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error parsing config"
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: message }))
    } else {
      logger.error("Failed to parse theme config.")
      logger.info(message)
    }
    process.exit(1)
  }

  // Resolve and generate primitives for export
  const resolved = resolveConfig(config)
  const primitives = generatePrimitives(resolved)
  const exportedYaml = exportTheme(primitives, resolved)

  const format = options.format ?? "yaml"

  if (options.json) {
    // Structured JSON output for AI agents
    if (format === "json") {
      // Parse the YAML back to object for JSON output
      const parsed = parseConfig(exportedYaml)
      console.log(JSON.stringify({ success: true, theme: parsed }))
    } else {
      console.log(JSON.stringify({ success: true, yaml: exportedYaml }))
    }
  } else {
    if (format === "json") {
      const parsed = parseConfig(exportedYaml)
      console.log(JSON.stringify(parsed, null, 2))
    } else {
      console.log(exportedYaml)
    }
  }
}
