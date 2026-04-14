import { loadConfig, configExists } from "../config/config.js"
import { DEFAULT_CONFIG } from "../config/defaults.js"
import { loadRegistry, findItem } from "../registry/resolve.js"
import { resolveOutputPath, readFile } from "../utils/fs.js"
import { computeDiff, hasDifferences } from "../utils/diff.js"
import { logger } from "../utils/logger.js"

export interface DiffOptions {
  json?: boolean
  all?: boolean
}

export function diffCommand(
  componentName: string | undefined,
  cwd: string,
  options: DiffOptions = {}
): void {
  const json = options.json ?? false
  const all = options.all ?? false

  let config: ReturnType<typeof loadConfig>
  let registry: ReturnType<typeof loadRegistry>

  try {
    // For --all mode, fall back to default config if no visor.json exists
    if (all && !configExists(cwd)) {
      config = DEFAULT_CONFIG
    } else {
      config = loadConfig(cwd)
    }
    registry = loadRegistry()
  } catch (error) {
    if (json) {
      const message = error instanceof Error ? error.message : String(error)
      console.log(JSON.stringify({ success: false, error: message }, null, 2))
      process.exit(1)
    }
    throw error
  }

  // --all mode: return per-component changeType summary for every registry item
  if (all) {
    interface ComponentResult {
      component: string
      changeType: "modified" | "added" | "removed" | "unchanged"
      files: string[]
      breakingChange: boolean
      migrationNote: string | null
    }

    const results: ComponentResult[] = []

    for (const item of registry.items) {
      const changedFiles: string[] = []
      let hasModified = false
      let hasAdded = false

      for (const file of item.files) {
        const outputPath = resolveOutputPath(
          file.path,
          file.type,
          config,
          cwd
        )

        const localContent = readFile(outputPath)

        if (localContent === null) {
          // File exists in registry but not locally — "added" from registry's perspective
          hasAdded = true
          changedFiles.push(file.path)
          continue
        }

        if (hasDifferences(localContent, file.content)) {
          hasModified = true
          changedFiles.push(file.path)
        }
      }

      let changeType: ComponentResult["changeType"]
      if (hasModified) {
        changeType = "modified"
      } else if (hasAdded && changedFiles.length === item.files.length) {
        // All files missing locally — component not installed
        changeType = "added"
      } else if (hasAdded) {
        // Some files missing, some differ
        changeType = "modified"
      } else {
        changeType = "unchanged"
      }

      results.push({
        component: item.name,
        changeType,
        files: changedFiles,
        breakingChange: false,
        migrationNote: null,
      })
    }

    const total = results.length
    const changed = results.filter((r) => r.changeType !== "unchanged").length
    const unchanged = total - changed

    if (json) {
      console.log(
        JSON.stringify(
          {
            success: true,
            results,
            summary: { total, changed, unchanged },
          },
          null,
          2
        )
      )
      process.exit(0)
      return
    }

    // Human-readable output for --all without --json
    const changedItems = results.filter((r) => r.changeType !== "unchanged")
    if (changedItems.length === 0) {
      logger.success(`All ${total} components match the registry.`)
    } else {
      logger.heading(`${changed} component(s) with upstream changes`)
      for (const r of changedItems) {
        logger.info(`  ${r.component} [${r.changeType}]: ${r.files.join(", ")}`)
      }
      logger.blank()
      logger.info(`Total: ${total} | Changed: ${changed} | Unchanged: ${unchanged}`)
    }
    return
  }

  // If no component specified, diff all installed items (original behavior)
  const itemsToDiff = componentName
    ? (() => {
        const item = findItem(registry, componentName)
        if (!item) {
          if (json) {
            console.log(
              JSON.stringify(
                { success: false, error: `Component "${componentName}" not found in registry.` },
                null,
                2
              )
            )
          } else {
            logger.error(`Component "${componentName}" not found in registry.`)
          }
          process.exit(1)
        }
        return [item]
      })()
    : registry.items

  let totalDiffs = 0
  let totalFiles = 0

  interface DiffEntry {
    file: string
    component: string
    hasDifferences: boolean
    diff: string
  }

  const diffs: DiffEntry[] = []

  for (const item of itemsToDiff) {
    let itemHasDiff = false

    for (const file of item.files) {
      const outputPath = resolveOutputPath(
        file.path,
        file.type,
        config,
        cwd
      )

      const localContent = readFile(outputPath)
      if (localContent === null) continue // Not installed, skip

      totalFiles++

      const fileHasDiff = hasDifferences(localContent, file.content)

      if (json) {
        const diffText = fileHasDiff
          ? computeDiff(file.path, localContent, file.content)
          : ""
        diffs.push({
          file: file.path,
          component: item.name,
          hasDifferences: fileHasDiff,
          diff: diffText,
        })
        if (fileHasDiff) {
          totalDiffs++
        }
        continue
      }

      if (!fileHasDiff) continue

      if (!itemHasDiff) {
        logger.heading(item.name)
        itemHasDiff = true
      }

      const diff = computeDiff(file.path, localContent, file.content)
      console.log(diff)
      totalDiffs++
    }
  }

  if (json) {
    console.log(
      JSON.stringify(
        {
          success: true,
          diffs,
          summary: {
            totalFiles,
            filesWithDiffs: totalDiffs,
          },
        },
        null,
        2
      )
    )
    process.exit(0)
    return
  }

  if (totalDiffs === 0) {
    if (totalFiles === 0) {
      logger.info("No installed components found.")
    } else {
      logger.success("All files match the registry. No differences found.")
    }
  } else {
    logger.blank()
    logger.info(`${totalDiffs} file(s) with differences`)
  }
}
