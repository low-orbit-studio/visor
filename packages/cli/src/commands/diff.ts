import { loadConfig } from "../config/config.js"
import { loadRegistry, findItem } from "../registry/resolve.js"
import { resolveOutputPath, readFile } from "../utils/fs.js"
import { computeDiff, hasDifferences } from "../utils/diff.js"
import { logger } from "../utils/logger.js"

export interface DiffOptions {
  json?: boolean
}

export function diffCommand(
  componentName: string | undefined,
  cwd: string,
  options: DiffOptions = {}
): void {
  const json = options.json ?? false
  const config = loadConfig(cwd)
  const registry = loadRegistry()

  // If no component specified, diff all installed items
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
