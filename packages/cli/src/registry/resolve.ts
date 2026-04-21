import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import type {
  BundledRegistry,
  BundledRegistryItem,
  PubDependency,
  RegistryTarget,
} from "./types.js"
import type { VisorManifest } from "../generate/manifest-types.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

let cachedRegistry: BundledRegistry | null = null
let cachedManifest: VisorManifest | null = null

export function loadRegistry(): BundledRegistry {
  if (cachedRegistry) return cachedRegistry

  // After tsup bundles into dist/index.js, __dirname is the dist/ directory
  // registry.json lives alongside index.js in dist/
  const registryPath = join(__dirname, "registry.json")
  const raw = readFileSync(registryPath, "utf-8")
  cachedRegistry = JSON.parse(raw) as BundledRegistry
  return cachedRegistry
}

export function loadManifest(): VisorManifest {
  if (cachedManifest) return cachedManifest

  // After tsup bundles into dist/index.js, __dirname is the dist/ directory
  // visor-manifest.json lives alongside index.js in dist/
  const manifestPath = join(__dirname, "visor-manifest.json")
  const raw = readFileSync(manifestPath, "utf-8")
  cachedManifest = JSON.parse(raw) as VisorManifest
  return cachedManifest
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
): {
  dependencies: string[]
  devDependencies: string[]
  pubDependencies: PubDependency[]
} {
  const deps = new Set<string>()
  const devDeps = new Set<string>()
  const pubDeps = new Map<string, PubDependency>()

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
    if (item.pubDependencies) {
      for (const dep of item.pubDependencies) {
        pubDeps.set(dep.pub, dep)
      }
    }
  }

  return {
    dependencies: Array.from(deps).sort(),
    devDependencies: Array.from(devDeps).sort(),
    pubDependencies: Array.from(pubDeps.values()).sort((a, b) =>
      a.pub.localeCompare(b.pub)
    ),
  }
}

export function filterItemsByTarget(
  items: BundledRegistryItem[],
  target: RegistryTarget
): BundledRegistryItem[] {
  return items.filter(
    (item) => item.target === target || item.target === undefined
  )
}

/** Normalize a name to a slug: lowercase + strip non-alphanumerics. Lets us
 * match "section-header", "SectionHeader", and "section_header" as the same
 * canonical component across registries with different naming conventions. */
function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "")
}

export function findItemForTarget(
  registry: BundledRegistry,
  name: string,
  target: RegistryTarget
): BundledRegistryItem | undefined {
  const needle = slug(name)
  // Prefer exact target match; fall back to untargeted (shared) items.
  return (
    registry.items.find(
      (item) => slug(item.name) === needle && item.target === target
    ) ??
    registry.items.find(
      (item) => slug(item.name) === needle && item.target === undefined
    )
  )
}
