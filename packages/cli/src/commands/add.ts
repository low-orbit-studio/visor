import { loadConfig, configExists, writeConfig } from "../config/config.js"
import {
  loadRegistry,
  resolveTransitiveDeps,
  collectDependencies,
  filterItemsByTarget,
  findItemForTarget,
} from "../registry/resolve.js"
import { resolveOutputPath, writeFile, fileExists } from "../utils/fs.js"
import {
  getUninstalledDeps,
  installPackages,
  hasVisorTokens,
} from "../utils/packages.js"
import {
  addPubDependencies,
  getUninstalledPubDeps,
  pubspecExists,
} from "../utils/pubspec.js"
import { findFlutterBin, runFlutterPubGet } from "../utils/flutter.js"
import { logger } from "../utils/logger.js"
import { DEFAULT_CONFIG } from "../config/defaults.js"
import type { RegistryTarget } from "../registry/types.js"

export interface AddOptions {
  overwrite?: boolean
  category?: string
  block?: boolean
  json?: boolean
  dryRun?: boolean
  target?: RegistryTarget
}

export function addCommand(
  components: string[],
  cwd: string,
  options: AddOptions = {}
): void {
  const json = options.json ?? false
  const dryRun = options.dryRun ?? false
  const target: RegistryTarget = options.target ?? "react"
  const prefix = dryRun ? "[dry-run] " : ""

  let autoInitialized = false

  // Auto-init: create visor.json with defaults if it doesn't exist
  if (!configExists(cwd)) {
    writeConfig(cwd, DEFAULT_CONFIG)
    autoInitialized = true
    if (!json) {
      logger.info("No visor.json found — created one with default paths.")
      logger.blank()
    }
  }

  let config: ReturnType<typeof loadConfig>
  let registry: ReturnType<typeof loadRegistry>

  try {
    config = loadConfig(cwd)
    registry = loadRegistry()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (json) {
      console.log(JSON.stringify({ success: false, error: message }, null, 2))
    } else {
      logger.error(message)
    }
    process.exit(1)
  }

  // Flutter target uses a narrower registry view — Flutter-targeted items
  // plus any untargeted shared items (utilities, themes). React target uses
  // the same filter but with "react" as the preferred match; this is
  // effectively the full registry minus Flutter-only items, which preserves
  // byte-identical behavior for the existing React path.
  const targetRegistry = {
    items: filterItemsByTarget(registry.items, target),
  }

  // When --block is used, validate that requested items are blocks
  if (options.block && components.length > 0) {
    for (const name of components) {
      const item = targetRegistry.items.find((i) => i.name === name)
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

    const categoryItems = targetRegistry.items.filter(
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
      const blockItems = targetRegistry.items.filter(
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

  // Normalize user input against the target registry so callers can type
  // `visor add button --target flutter` even though the Flutter manifest
  // declares `name: Button` (PascalCase).
  const canonicalNames: string[] = []
  for (const name of itemNames) {
    const resolved = findItemForTarget(targetRegistry, name, target)
    if (!resolved) {
      const message = `Registry item "${name}" not found for target "${target}".`
      if (json) {
        console.log(JSON.stringify({ success: false, error: message }, null, 2))
      } else {
        logger.error(message)
      }
      process.exit(1)
    }
    canonicalNames.push(resolved.name)
  }

  // Resolve all items including transitive registry dependencies
  const circularWarnings: string[] = []
  let items: ReturnType<typeof resolveTransitiveDeps>
  try {
    items = resolveTransitiveDeps(targetRegistry, canonicalNames, (msg) => {
      circularWarnings.push(msg)
    })
  } catch (error) {
    if (json) {
      const message = error instanceof Error ? error.message : String(error)
      console.log(JSON.stringify({ success: false, error: message }, null, 2))
      process.exit(1)
    }
    throw error
  }

  if (circularWarnings.length > 0 && !json) {
    for (const warning of circularWarnings) {
      logger.warn(warning)
    }
  }

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

      if (!dryRun && fileExists(outputPath) && !options.overwrite) {
        if (!json) {
          logger.item(`${prefix}skip ${file.path} (already exists)`)
        }
        skippedFiles.push(file.path)
        continue
      }

      if (!dryRun) {
        writeFile(outputPath, file.content)
      }
      if (!json) {
        logger.success(`${prefix}${file.path}`)
      }
      writtenFiles.push(file.path)
    }
  }

  if (!json) {
    logger.blank()
    logger.info(
      `${prefix}Files: ${writtenFiles.length} written, ${skippedFiles.length} skipped`
    )
  }

  // Collect and install dependencies
  const { dependencies, devDependencies, pubDependencies } =
    collectDependencies(items)

  const installedDeps: string[] = []
  const failedDeps: string[] = []
  const warnings: string[] = []

  if (target === "flutter") {
    // Flutter path: merge pub.dev deps into pubspec.yaml; skip npm entirely.
    const uninstalledPubDeps = dryRun
      ? pubDependencies
      : pubspecExists(cwd)
        ? getUninstalledPubDeps(pubDependencies, cwd)
        : pubDependencies

    if (uninstalledPubDeps.length > 0) {
      if (dryRun) {
        if (!json) {
          logger.blank()
          logger.info(
            `${prefix}Would add pub dependencies: ${uninstalledPubDeps
              .map((d) => `${d.pub}@${d.version}`)
              .join(", ")}`
          )
        }
        installedDeps.push(...uninstalledPubDeps.map((d) => d.pub))
      } else if (!pubspecExists(cwd)) {
        const message =
          "No pubspec.yaml found. Run this from a Flutter project root, or add " +
          uninstalledPubDeps.map((d) => `${d.pub}: ${d.version}`).join(", ") +
          " to pubspec.yaml manually."
        warnings.push(message)
        if (!json) {
          logger.blank()
          logger.warn(message)
        }
      } else {
        if (!json) {
          logger.blank()
          logger.info("Updating pubspec.yaml...")
        }
        const result = addPubDependencies(uninstalledPubDeps, cwd)
        installedDeps.push(...result.added)

        const flutterBin = findFlutterBin()
        if (flutterBin) {
          if (!json) {
            logger.info("Running flutter pub get...")
          }
          if (!runFlutterPubGet(cwd, flutterBin)) {
            const warning =
              "flutter pub get failed. Run it manually to refresh dependencies."
            warnings.push(warning)
            if (!json) logger.warn(warning)
          }
        } else {
          const warning =
            "flutter CLI not found. Run `flutter pub get` manually after setting up Flutter (or FVM)."
          warnings.push(warning)
          if (!json) logger.warn(warning)
        }
      }
    }
  } else {
    // React path — unchanged.
    const uninstalledDeps = dryRun
      ? dependencies
      : getUninstalledDeps(dependencies, cwd)
    const uninstalledDevDeps = dryRun
      ? devDependencies
      : getUninstalledDeps(devDependencies, cwd)

    if (uninstalledDeps.length > 0) {
      if (dryRun) {
        if (!json) {
          logger.blank()
          logger.info(
            `${prefix}Would install dependencies: ${uninstalledDeps.join(", ")}`
          )
        }
        installedDeps.push(...uninstalledDeps)
      } else {
        if (!json) {
          logger.blank()
          logger.info("Installing dependencies...")
        }
        if (installPackages(uninstalledDeps, cwd)) {
          installedDeps.push(...uninstalledDeps)
        } else {
          failedDeps.push(...uninstalledDeps)
          if (!json) {
            logger.warn(
              "Some dependencies failed to install. Install them manually:"
            )
            logger.info(`  npm install ${uninstalledDeps.join(" ")}`)
          }
        }
      }
    }

    if (uninstalledDevDeps.length > 0) {
      if (dryRun) {
        if (!json) {
          logger.blank()
          logger.info(
            `${prefix}Would install dev dependencies: ${uninstalledDevDeps.join(", ")}`
          )
        }
        installedDeps.push(...uninstalledDevDeps)
      } else {
        if (!json) {
          logger.blank()
          logger.info("Installing dev dependencies...")
        }
        if (installPackages(uninstalledDevDeps, cwd, true)) {
          installedDeps.push(...uninstalledDevDeps)
        } else {
          failedDeps.push(...uninstalledDevDeps)
          if (!json) {
            logger.warn(
              "Some dev dependencies failed to install. Install them manually:"
            )
            logger.info(
              `  npm install --save-dev ${uninstalledDevDeps.join(" ")}`
            )
          }
        }
      }
    }

    if (!hasVisorTokens(cwd)) {
      const warning =
        "@loworbitstudio/visor-core is not installed. Components require it for styling."
      warnings.push(warning)
      if (!json) {
        logger.blank()
        logger.warn(warning)
        logger.info(
          "  For Next.js: npx @loworbitstudio/visor init --template nextjs"
        )
        logger.info(
          "  This generates all tokens inline — no npm package needed."
        )
      }
    }
  }

  if (json) {
    console.log(
      JSON.stringify(
        {
          success: failedDeps.length === 0,
          ...(dryRun ? { dryRun: true } : {}),
          autoInitialized,
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
    process.exit(failedDeps.length > 0 ? 1 : 0)
  }

  if (failedDeps.length > 0) {
    process.exit(1)
  }
}
