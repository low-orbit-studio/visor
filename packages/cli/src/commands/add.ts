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
}

export function addCommand(
  components: string[],
  cwd: string,
  options: AddOptions = {}
): void {
  const config = loadConfig(cwd)
  const registry = loadRegistry()

  // Resolve all items including transitive registry dependencies
  const items = resolveTransitiveDeps(registry, components)

  logger.info(
    `Resolving ${components.length} item(s) → ${items.length} total (with dependencies)`
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
