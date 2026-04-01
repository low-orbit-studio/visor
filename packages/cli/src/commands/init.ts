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
  json?: boolean
}

export function initCommand(cwd: string, options?: InitOptions): void {
  const json = options?.json ?? false
  const filesCreated: string[] = []
  const filesSkipped: string[] = []
  const warnings: string[] = []

  // Validate template option early so we can report in JSON mode too
  if (options?.template && options.template !== "nextjs") {
    if (json) {
      console.log(
        JSON.stringify(
          { success: false, error: `Unknown template: ${options.template}. Available templates: nextjs` },
          null,
          2
        )
      )
    } else {
      logger.error(`Unknown template: ${options.template}`)
      logger.info("Available templates: nextjs")
    }
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
    scaffoldNextjs(cwd, json, filesCreated, filesSkipped)
  }

  const missingTokens = !hasVisorTokens(cwd)
  if (missingTokens) {
    const warning = "@loworbitstudio/visor-core is not installed. Components require it for styling."
    warnings.push(warning)
    if (!json) {
      logger.blank()
      logger.warn(warning)
      logger.info("  npm install @loworbitstudio/visor-core")
    }
  }

  if (json) {
    const nextSteps: string[] = []
    if (options?.template === "nextjs") {
      nextSteps.push("Customize colors in .visor.yaml")
      nextSteps.push("Add FOWT prevention script to your layout.tsx <head>")
      nextSteps.push("Run: npx visor add button — to add your first component")
    } else {
      nextSteps.push("Run: npx visor add button — to add your first component")
    }
    if (missingTokens) {
      nextSteps.push("npm install @loworbitstudio/visor-core")
    }
    console.log(
      JSON.stringify(
        {
          success: true,
          config: DEFAULT_CONFIG,
          files: { created: filesCreated, skipped: filesSkipped },
          warnings,
          nextSteps,
        },
        null,
        2
      )
    )
    process.exit(0)
  }
}

function scaffoldNextjs(
  cwd: string,
  json: boolean,
  filesCreated: string[],
  filesSkipped: string[]
): void {
  if (!json) {
    logger.blank()
    logger.info("Scaffolding NextJS theme...")
  }

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

  if (existsSync(globalsPath)) {
    filesSkipped.push("app/globals.css")
    if (!json) {
      logger.warn("app/globals.css already exists. Skipping.")
    }
  } else {
    mkdirSync(globalsDir, { recursive: true })
    writeFileSync(globalsPath, css, "utf-8")
    filesCreated.push("app/globals.css")
    if (!json) {
      logger.success("Created app/globals.css with theme tokens")
    }
  }

  if (!json) {
    logger.blank()
    logger.info("Next steps:")
    logger.item("Customize colors in .visor.yaml")
    logger.item("Add FOWT prevention script to your layout.tsx <head>")
    logger.item("Run: npx visor add button — to add your first component")
  }
}
