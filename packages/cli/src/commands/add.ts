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
  block?: boolean
  json?: boolean
}

export function addCommand(
  components: string[],
  cwd: string,
  options: AddOptions = {}
): void {
  const json = options.json ?? false
  const config = loadConfig(cwd)
  const registry = loadRegistry()

  // When --block is used, validate that requested items are blocks
  if (options.block && components.length > 0) {
    for (const name of components) {
      const item = registry.items.find((i) => i.name === name)
      if (item && item.type !== "registry:block") {
        if (json) {
          console.log(
            JSON.stringify(
              { success: false, error: `"${name}" is not a block. Remove the --block flag to install it as a component.` },
              null,
              2
            )
          )
        } else {
          logger.error(
            `"${name}" is not a block. Remove the --block flag to install it as a component.`
          )
        }
        process.exit(1)
      }
    }
  }

  // Resolve component names from --category flag
  let itemNames = components

  if (options.category) {
    if (components.length > 0) {
      if (json) {
        console.log(
          JSON.stringify(
            { success: false, error: "Cannot use --category with individual component names. Use one or the other." },
            null,
            2
          )
        )
      } else {
        logger.error(
          "Cannot use --category with individual component names. Use one or the other."
        )
      }
      process.exit(1)
    }

    const categoryItems = registry.items.filter(
      (item) => item.category === options.category
    )

    if (categoryItems.length === 0) {
      if (json) {
        console.log(
          JSON.stringify(
            { success: false, error: `No items found in category "${options.category}".` },
            null,
            2
          )
        )
      } else {
        logger.error(`No items found in category "${options.category}".`)
      }
      process.exit(1)
    }

    itemNames = categoryItems.map((item) => item.name)
    if (!json) {
      logger.info(
        `Category "${options.category}": ${itemNames.length} item(s) found`
      )
    }
  }

  if (itemNames.length === 0) {
    if (options.block) {
      // List all available blocks
      const blockItems = registry.items.filter(
        (item) => item.type === "registry:block"
      )
      if (json) {
        console.log(
          JSON.stringify(
            {
              success: false,
              error: blockItems.length === 0
                ? "No blocks available in the registry."
                : `No block name specified. Available blocks: ${blockItems.map((i) => i.name).join(", ")}`,
            },
            null,
            2
          )
        )
      } else {
        if (blockItems.length === 0) {
          logger.error("No blocks available in the registry.")
        } else {
          logger.error("No block name specified. Available blocks:")
          for (const item of blockItems) {
            logger.info(`  ${item.name}`)
          }
        }
      }
      process.exit(1)
    }
    if (json) {
      console.log(
        JSON.stringify(
          { success: false, error: "No items specified. Provide item names or use --category." },
          null,
          2
        )
      )
    } else {
      logger.error("No items specified. Provide item names or use --category.")
    }
    process.exit(1)
  }

  // Resolve all items including transitive registry dependencies
  const items = resolveTransitiveDeps(registry, itemNames)

  if (!json) {
    logger.info(
      `Resolving ${itemNames.length} item(s) → ${items.length} total (with dependencies)`
    )
    logger.blank()
  }

  // Write files
  const writtenFiles: string[] = []
  const skippedFiles: string[] = []

  for (const item of items) {
    for (const file of item.files) {
      const outputPath = resolveOutputPath(
        file.path,
        file.type,
        config,
        cwd
      )

      if (fileExists(outputPath) && !options.overwrite) {
        if (!json) {
          logger.item(`skip ${file.path} (already exists)`)
        }
        skippedFiles.push(file.path)
        continue
      }

      writeFile(outputPath, file.content)
      if (!json) {
        logger.success(file.path)
      }
      writtenFiles.push(file.path)
    }
  }

  if (!json) {
    logger.blank()
    logger.info(
      `Files: ${writtenFiles.length} written, ${skippedFiles.length} skipped`
    )
  }

  // Collect and install npm dependencies
  const { dependencies, devDependencies } = collectDependencies(items)

  const uninstalledDeps = getUninstalledDeps(dependencies, cwd)
  const uninstalledDevDeps = getUninstalledDeps(devDependencies, cwd)

  const installedDeps: string[] = []
  const failedDeps: string[] = []

  if (uninstalledDeps.length > 0) {
    if (!json) {
      logger.blank()
      logger.info("Installing dependencies...")
    }
    if (installPackages(uninstalledDeps, cwd)) {
      installedDeps.push(...uninstalledDeps)
    } else {
      failedDeps.push(...uninstalledDeps)
      if (!json) {
        logger.warn("Some dependencies failed to install. Install them manually:")
        logger.info(`  npm install ${uninstalledDeps.join(" ")}`)
      }
    }
  }

  if (uninstalledDevDeps.length > 0) {
    if (!json) {
      logger.blank()
      logger.info("Installing dev dependencies...")
    }
    if (installPackages(uninstalledDevDeps, cwd, true)) {
      installedDeps.push(...uninstalledDevDeps)
    } else {
      failedDeps.push(...uninstalledDevDeps)
      if (!json) {
        logger.warn("Some dev dependencies failed to install. Install them manually:")
        logger.info(`  npm install --save-dev ${uninstalledDevDeps.join(" ")}`)
      }
    }
  }

  const warnings: string[] = []

  if (!hasVisorTokens(cwd)) {
    const warning = "@loworbitstudio/visor-core is not installed. Components require it for styling."
    warnings.push(warning)
    if (!json) {
      logger.blank()
      logger.warn(warning)
      logger.info("  npm install @loworbitstudio/visor-core")
    }
  }

  if (json) {
    console.log(
      JSON.stringify(
        {
          success: true,
          requested: itemNames,
          resolved: items.map((i) => i.name),
          files: { written: writtenFiles, skipped: skippedFiles },
          dependencies: { installed: installedDeps, failed: failedDeps },
          warnings,
        },
        null,
        2
      )
    )
    process.exit(0)
  }
}
