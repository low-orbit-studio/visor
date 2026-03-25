import { loadConfig } from "../config/config.js"
import {
  loadRegistry,
  resolveTransitiveDeps,
  collectDependencies,
} from "../registry/resolve.js"
import { resolveOutputPath, writeFile, fileExists } from "../utils/fs.js"
import {
  getUninstalledDeps,
  installPackages,
  hasVisorTokens,
} from "../utils/packages.js"
import { logger } from "../utils/logger.js"

export interface AddOptions {
  overwrite?: boolean
  category?: string
}

export function addCommand(
  components: string[],
  cwd: string,
  options: AddOptions = {}
): void {
  const config = loadConfig(cwd)
  const registry = loadRegistry()

  // Resolve component names from --category flag
  let itemNames = components

  if (options.category) {
    if (components.length > 0) {
      logger.error(
        "Cannot use --category with individual component names. Use one or the other."
      )
      process.exit(1)
    }

    const categoryItems = registry.items.filter(
      (item) => item.category === options.category
    )

    if (categoryItems.length === 0) {
      logger.error(`No items found in category "${options.category}".`)
      process.exit(1)
    }

    itemNames = categoryItems.map((item) => item.name)
    logger.info(
      `Category "${options.category}": ${itemNames.length} item(s) found`
    )
  }

  if (itemNames.length === 0) {
    logger.error("No items specified. Provide item names or use --category.")
    process.exit(1)
  }

  // Resolve all items including transitive registry dependencies
  const items = resolveTransitiveDeps(registry, itemNames)

  logger.info(
    `Resolving ${itemNames.length} item(s) → ${items.length} total (with dependencies)`
  )
  logger.blank()

  // Write files
  let filesWritten = 0
  let filesSkipped = 0

  for (const item of items) {
    for (const file of item.files) {
      const outputPath = resolveOutputPath(
        file.path,
        file.type,
        config,
        cwd
      )

      if (fileExists(outputPath) && !options.overwrite) {
        logger.item(`skip ${file.path} (already exists)`)
        filesSkipped++
        continue
      }

      writeFile(outputPath, file.content)
      logger.success(file.path)
      filesWritten++
    }
  }

  logger.blank()
  logger.info(
    `Files: ${filesWritten} written, ${filesSkipped} skipped`
  )

  // Collect and install npm dependencies
  const { dependencies, devDependencies } = collectDependencies(items)

  const uninstalledDeps = getUninstalledDeps(dependencies, cwd)
  const uninstalledDevDeps = getUninstalledDeps(devDependencies, cwd)

  if (uninstalledDeps.length > 0) {
    logger.blank()
    logger.info("Installing dependencies...")
    if (!installPackages(uninstalledDeps, cwd)) {
      logger.warn("Some dependencies failed to install. Install them manually:")
      logger.info(`  npm install ${uninstalledDeps.join(" ")}`)
    }
  }

  if (uninstalledDevDeps.length > 0) {
    logger.blank()
    logger.info("Installing dev dependencies...")
    if (!installPackages(uninstalledDevDeps, cwd, true)) {
      logger.warn("Some dev dependencies failed to install. Install them manually:")
      logger.info(`  npm install --save-dev ${uninstalledDevDeps.join(" ")}`)
    }
  }

  if (!hasVisorTokens(cwd)) {
    logger.blank()
    logger.warn(
      "@loworbitstudio/visor-core is not installed. Components require it for styling."
    )
    logger.info("  npm install @loworbitstudio/visor-core")
  }
}
