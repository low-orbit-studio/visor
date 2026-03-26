/**
 * Build Registry Script
 *
 * Reads all registry definitions from ../../registry/index.ts,
 * reads every referenced source file, and produces dist/registry.json
 * with inlined file contents.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import type { BundledRegistry, BundledRegistryItem } from "../registry/types.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "../../../..")
const DIST_DIR = join(__dirname, "../../dist")

async function main(): Promise<void> {
  console.log("Building registry JSON...\n")

  // Import the registry definitions
  const { ui } = await import(join(REPO_ROOT, "registry/registry-ui.ts"))
  const { hooks } = await import(join(REPO_ROOT, "registry/registry-hooks.ts"))
  const { lib } = await import(join(REPO_ROOT, "registry/registry-lib.ts"))
  const { deck } = await import(join(REPO_ROOT, "registry/registry-deck.ts"))
  const { blocks } = await import(join(REPO_ROOT, "registry/registry-blocks.ts"))
  const { visual } = await import(join(REPO_ROOT, "registry/registry-visual.ts"))

  const allItems = [...ui, ...hooks, ...lib, ...deck, ...blocks, ...visual]
  const bundledItems: BundledRegistryItem[] = []

  for (const item of allItems) {
    const bundledFiles = item.files.map(
      (file: { path: string; type: string; target?: string }) => {
        const filePath = join(REPO_ROOT, file.path)
        let content: string
        try {
          content = readFileSync(filePath, "utf-8")
        } catch {
          console.warn(`  Warning: Could not read ${file.path}`)
          content = ""
        }
        return {
          path: file.path,
          type: file.type,
          content,
          ...(file.target ? { target: file.target } : {}),
        }
      }
    )

    bundledItems.push({
      name: item.name,
      type: item.type,
      ...(item.description ? { description: item.description } : {}),
      ...(item.category ? { category: item.category } : {}),
      ...(item.dependencies ? { dependencies: item.dependencies } : {}),
      ...(item.devDependencies
        ? { devDependencies: item.devDependencies }
        : {}),
      ...(item.registryDependencies
        ? { registryDependencies: item.registryDependencies }
        : {}),
      files: bundledFiles,
    })

    console.log(`  ✓ ${item.name} (${item.files.length} files)`)
  }

  const registry: BundledRegistry = { items: bundledItems }

  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true })
  }

  const outputPath = join(DIST_DIR, "registry.json")
  writeFileSync(outputPath, JSON.stringify(registry, null, 2), "utf-8")

  console.log(`\n✓ Built registry with ${bundledItems.length} items`)
  console.log(`✓ Written to ${outputPath}`)
}

main().catch((err) => {
  console.error("Failed to build registry:", err)
  process.exit(1)
})
