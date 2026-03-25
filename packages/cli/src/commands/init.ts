import { configExists, writeConfig } from "../config/config.js"
import { DEFAULT_CONFIG } from "../config/defaults.js"
import { hasVisorTokens } from "../utils/packages.js"
import { logger } from "../utils/logger.js"

export function initCommand(cwd: string): void {
  if (configExists(cwd)) {
    logger.warn("visor.json already exists. Skipping init.")
    return
  }

  writeConfig(cwd, DEFAULT_CONFIG)
  logger.success("Created visor.json")
  logger.blank()
  logger.info("Default paths:")
  logger.item(`components      → ${DEFAULT_CONFIG.paths.components}`)
  logger.item(`deck components → ${DEFAULT_CONFIG.paths.deckComponents}`)
  logger.item(`hooks           → ${DEFAULT_CONFIG.paths.hooks}`)
  logger.item(`lib             → ${DEFAULT_CONFIG.paths.lib}`)

  if (!hasVisorTokens(cwd)) {
    logger.blank()
    logger.warn(
      "@loworbitstudio/visor-core is not installed. Components require it for styling."
    )
    logger.info("  npm install @loworbitstudio/visor-core")
  }
}
