import { existsSync, writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { configExists, writeConfig } from "../config/config.js"
import { DEFAULT_CONFIG } from "../config/defaults.js"
import { hasVisorTokens } from "../utils/packages.js"
import { logger } from "../utils/logger.js"
import { NEXTJS_STARTER_YAML } from "./templates/nextjs.js"
import { generateThemeData } from "@loworbitstudio/visor-theme-engine"
import { nextjsAdapter } from "@loworbitstudio/visor-theme-engine/adapters"

export interface InitOptions {
  template?: string
}

export function initCommand(cwd: string, options?: InitOptions): void {
  // Always create visor.json if it doesn't exist
  if (configExists(cwd)) {
    logger.warn("visor.json already exists. Skipping config creation.")
  } else {
    writeConfig(cwd, DEFAULT_CONFIG)
    logger.success("Created visor.json")
    logger.blank()
    logger.info("Default paths:")
    logger.item(`components      → ${DEFAULT_CONFIG.paths.components}`)
    logger.item(`deck components → ${DEFAULT_CONFIG.paths.deckComponents}`)
    logger.item(`blocks          → ${DEFAULT_CONFIG.paths.blocks}`)
    logger.item(`hooks           → ${DEFAULT_CONFIG.paths.hooks}`)
    logger.item(`lib             → ${DEFAULT_CONFIG.paths.lib}`)
  }

  // Template scaffolding
  if (options?.template) {
    if (options.template !== "nextjs") {
      logger.error(`Unknown template: ${options.template}`)
      logger.info("Available templates: nextjs")
      process.exit(1)
    }

    scaffoldNextjs(cwd)
  }

  if (!hasVisorTokens(cwd)) {
    logger.blank()
    logger.warn(
      "@loworbitstudio/visor-core is not installed. Components require it for styling."
    )
    logger.info("  npm install @loworbitstudio/visor-core")
  }
}

function scaffoldNextjs(cwd: string): void {
  logger.blank()
  logger.info("Scaffolding NextJS theme...")

  // Write .visor.yaml
  const yamlPath = join(cwd, ".visor.yaml")
  if (existsSync(yamlPath)) {
    logger.warn(".visor.yaml already exists. Skipping.")
  } else {
    writeFileSync(yamlPath, NEXTJS_STARTER_YAML, "utf-8")
    logger.success("Created .visor.yaml")
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

  if (existsSync(globalsPath)) {
    logger.warn("app/globals.css already exists. Skipping.")
  } else {
    mkdirSync(globalsDir, { recursive: true })
    writeFileSync(globalsPath, css, "utf-8")
    logger.success("Created app/globals.css with theme tokens")
  }

  logger.blank()
  logger.info("Next steps:")
  logger.item("Customize colors in .visor.yaml")
  logger.item("Add FOWT prevention script to your layout.tsx <head>")
  logger.item("Run: npx visor add button — to add your first component")
}
