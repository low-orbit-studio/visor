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
import { parse as parseYAML } from "yaml"
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
  const { devtools } = await import(join(REPO_ROOT, "registry/registry-devtools.ts"))
  const { flutter } = await import(join(REPO_ROOT, "registry/registry-flutter.ts"))

  // Build a map of categories from .visor.yaml files
  const categoryMap = new Map<string, string>()
  const yamlDirs = [
    { base: join(REPO_ROOT, "components/ui"), suffix: ".visor.yaml" },
    { base: join(REPO_ROOT, "components/devtools"), suffix: ".visor.yaml", multi: true },
    { base: join(REPO_ROOT, "hooks"), suffix: ".visor.yaml" },
  ]
  const { readdirSync: readdirSyncTop, statSync: statSyncTop } = await import("fs")
  for (const { base, suffix, multi } of yamlDirs) {
    if (!existsSync(base)) continue
    for (const entry of readdirSyncTop(base)) {
      const entryPath = join(base, entry)
      if (statSyncTop(entryPath).isDirectory()) {
        if (multi) {
          // Component dir may host multiple registry items in one folder
          // (e.g. source-inspector + source-inspector-toggle).
          for (const file of readdirSyncTop(entryPath)) {
            if (!file.endsWith(suffix)) continue
            const name = file.replace(suffix, "")
            try {
              const data = parseYAML(
                readFileSync(join(entryPath, file), "utf-8"),
              ) as Record<string, unknown>
              if (data.category) categoryMap.set(name, String(data.category))
            } catch { /* skip unparseable */ }
          }
        } else {
          // Component: components/ui/{name}/{name}.visor.yaml
          const yamlPath = join(entryPath, `${entry}${suffix}`)
          if (existsSync(yamlPath)) {
            try {
              const data = parseYAML(readFileSync(yamlPath, "utf-8")) as Record<string, unknown>
              if (data.category) categoryMap.set(entry, String(data.category))
            } catch { /* skip unparseable */ }
          }
        }
      } else if (entry.endsWith(suffix)) {
        // Hook: hooks/{name}.visor.yaml
        const name = entry.replace(suffix, "")
        try {
          const data = parseYAML(readFileSync(entryPath, "utf-8")) as Record<string, unknown>
          if (data.category) categoryMap.set(name, String(data.category))
        } catch { /* skip unparseable */ }
      }
    }
  }

  const allItems = [
    ...ui,
    ...hooks,
    ...lib,
    ...deck,
    ...blocks,
    ...visual,
    ...devtools,
    ...flutter,
  ]
  const bundledItems: BundledRegistryItem[] = []
  const buildErrors: string[] = []

  for (const item of allItems) {
    let itemHasError = false
    const bundledFiles = item.files.map(
      (file: { path: string; type: string; target?: string }) => {
        const filePath = join(REPO_ROOT, file.path)
        let content: string
        try {
          content = readFileSync(filePath, "utf-8")
        } catch {
          buildErrors.push(`Could not read ${file.path} (item: ${item.name})`)
          itemHasError = true
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

    // Never include items with empty file content in the output
    if (itemHasError) {
      console.error(`  ✗ ${item.name} — skipped (has unreadable files)`)
      continue
    }

    // Use category from registry definition, falling back to .visor.yaml
    const category = item.category ?? categoryMap.get(item.name)

    bundledItems.push({
      name: item.name,
      type: item.type,
      ...(item.description ? { description: item.description } : {}),
      ...(category ? { category } : {}),
      ...(item.target ? { target: item.target } : {}),
      ...(item.dependencies ? { dependencies: item.dependencies } : {}),
      ...(item.devDependencies
        ? { devDependencies: item.devDependencies }
        : {}),
      ...(item.pubDependencies
        ? { pubDependencies: item.pubDependencies }
        : {}),
      ...(item.registryDependencies
        ? { registryDependencies: item.registryDependencies }
        : {}),
      files: bundledFiles,
    })

    console.log(`  ✓ ${item.name} (${item.files.length} files)`)
  }

  if (buildErrors.length > 0) {
    console.error(`\n✗ Registry build failed with ${buildErrors.length} error(s):`)
    for (const err of buildErrors) {
      console.error(`  - ${err}`)
    }
    process.exit(1)
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
