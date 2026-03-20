import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import type {
  BundledRegistry,
  BundledRegistryItem,
} from "./types.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

let cachedRegistry: BundledRegistry | null = null

export function loadRegistry(): BundledRegistry {
  if (cachedRegistry) return cachedRegistry

  // After tsup bundles into dist/index.js, __dirname is the dist/ directory
  // registry.json lives alongside index.js in dist/
  const registryPath = join(__dirname, "registry.json")
  const raw = readFileSync(registryPath, "utf-8")
  cachedRegistry = JSON.parse(raw) as BundledRegistry
  return cachedRegistry
}

export function findItem(
  registry: BundledRegistry,
  name: string
): BundledRegistryItem | undefined {
  return registry.items.find((item) => item.name === name)
}

export function resolveTransitiveDeps(
  registry: BundledRegistry,
  names: string[]
): BundledRegistryItem[] {
  const resolved = new Map<string, BundledRegistryItem>()
  const queue = [...names]

  while (queue.length > 0) {
    const name = queue.shift()!
    if (resolved.has(name)) continue

    const item = findItem(registry, name)
    if (!item) {
      throw new Error(`Registry item "${name}" not found.`)
    }

    resolved.set(name, item)

    if (item.registryDependencies) {
      for (const dep of item.registryDependencies) {
        if (!resolved.has(dep)) {
          queue.push(dep)
        }
      }
    }
  }

  return Array.from(resolved.values())
}

export function collectDependencies(
  items: BundledRegistryItem[]
): { dependencies: string[]; devDependencies: string[] } {
  const deps = new Set<string>()
  const devDeps = new Set<string>()

  for (const item of items) {
    if (item.dependencies) {
      for (const dep of item.dependencies) {
        deps.add(dep)
      }
    }
    if (item.devDependencies) {
      for (const dep of item.devDependencies) {
        devDeps.add(dep)
      }
    }
  }

  return {
    dependencies: Array.from(deps).sort(),
    devDependencies: Array.from(devDeps).sort(),
  }
}
