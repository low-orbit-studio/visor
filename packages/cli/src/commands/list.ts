import { loadRegistry } from "../registry/resolve.js"
import { loadConfig } from "../config/config.js"
import { configExists } from "../config/config.js"
import { resolveOutputPath } from "../utils/fs.js"
import { fileExists } from "../utils/fs.js"
import { logger } from "../utils/logger.js"
import type { BundledRegistryItem } from "../registry/types.js"

const TYPE_LABELS: Record<string, string> = {
  "registry:ui": "Components",
  "registry:hook": "Hooks",
  "registry:lib": "Utilities",
  "registry:block": "Blocks",
  "registry:page": "Pages",
  "registry:theme": "Themes",
  "registry:style": "Styles",
}

export function listCommand(cwd: string): void {
  const registry = loadRegistry()
  const hasConfig = configExists(cwd)

  // Group items by type
  const groups = new Map<string, BundledRegistryItem[]>()
  for (const item of registry.items) {
    const existing = groups.get(item.type) ?? []
    existing.push(item)
    groups.set(item.type, existing)
  }

  // Try to load config for installed detection
  const config = hasConfig ? loadConfig(cwd) : null

  for (const [type, items] of groups) {
    const label = TYPE_LABELS[type] ?? type
    logger.heading(`${label} (${items.length})`)
    logger.blank()

    for (const item of items) {
      let installed = false
      if (config) {
        // Check if the first file exists in the consumer project
        const firstFile = item.files[0]
        if (firstFile) {
          const outputPath = resolveOutputPath(
            firstFile.path,
            firstFile.type,
            config,
            cwd
          )
          installed = fileExists(outputPath)
        }
      }

      const status = installed ? " (installed)" : ""
      const name = item.name.padEnd(24)
      const desc = item.description ?? ""
      logger.info(`  ${name} ${desc}${status}`)
    }

    logger.blank()
  }
}
