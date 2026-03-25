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

const CATEGORY_LABELS: Record<string, string> = {
  deck: "Deck Components",
}

interface ItemGroup {
  type: string
  category?: string
  items: BundledRegistryItem[]
}

export function listCommand(cwd: string): void {
  const registry = loadRegistry()
  const hasConfig = configExists(cwd)

  // Group items by type, then sub-group by category
  const groupMap = new Map<string, ItemGroup>()
  for (const item of registry.items) {
    // Use a separator that won't conflict with type format
    const groupKey = item.category
      ? `${item.type}||${item.category}`
      : item.type
    const existing = groupMap.get(groupKey)
    if (existing) {
      existing.items.push(item)
    } else {
      groupMap.set(groupKey, {
        type: item.type,
        category: item.category,
        items: [item],
      })
    }
  }

  // Try to load config for installed detection
  const config = hasConfig ? loadConfig(cwd) : null

  for (const group of groupMap.values()) {
    const label = group.category
      ? CATEGORY_LABELS[group.category] ?? `${TYPE_LABELS[group.type] ?? group.type} (${group.category})`
      : TYPE_LABELS[group.type] ?? group.type
    logger.heading(`${label} (${group.items.length})`)
    logger.blank()

    for (const item of group.items) {
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
