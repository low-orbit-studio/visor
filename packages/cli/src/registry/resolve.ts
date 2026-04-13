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
  names: string[],
  onWarning?: (msg: string) => void
): BundledRegistryItem[] {
  const resolved = new Map<string, BundledRegistryItem>()
  const queue: Array<{ name: string; ancestors: Set<string> }> = names.map((n) => ({
    name: n,
    ancestors: new Set<string>(),
  }))

  while (queue.length > 0) {
    const { name, ancestors } = queue.shift()!
    if (resolved.has(name)) continue

    const item = findItem(registry, name)
    if (!item) {
      throw new Error(`Registry item "${name}" not found.`)
    }

    resolved.set(name, item)

    if (item.registryDependencies) {
      const childAncestors = new Set(ancestors)
      childAncestors.add(name)

      for (const dep of item.registryDependencies) {
        if (childAncestors.has(dep)) {
          // True circular: dep is an ancestor of this item
          onWarning?.(`Circular registry dependency: ${name} → ${dep}`)
        } else if (!resolved.has(dep)) {
          queue.push({ name: dep, ancestors: childAncestors })
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
