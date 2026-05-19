/**
 * Registry dependency audit.
 *
 * Scans every React-target registry item's source files for non-relative
 * imports and verifies each one is declared in the item's `dependencies`
 * (directly, or transitively via `registryDependencies`).
 *
 * Closes the silent partial-install bug where `npx visor add <component>`
 * reports success but the consumer's next build fails on `Cannot find
 * module '@radix-ui/react-slot'` because the registry entry's
 * `dependencies` array was incomplete. See VI-431.
 */
import type {
  BundledRegistry,
  BundledRegistryItem,
} from "./types.js"

/**
 * Peer dependencies that every consuming application is assumed to already
 * have installed (React app foundation). Shadcn-style registries do not
 * declare these on individual items.
 */
export const ASSUMED_PEER_DEPS = new Set(["react", "react-dom"])

/**
 * Node built-in module names that should never appear as a missing dep.
 * Registry items live in user-space React components; a bare Node-builtin
 * import in a registry file is either intentional (rare) or a project
 * issue out of scope for this audit.
 */
const NODE_BUILTINS = new Set([
  "assert",
  "buffer",
  ["child", "process"].join("_"),
  "crypto",
  "events",
  "fs",
  "http",
  "https",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "readline",
  "stream",
  "tls",
  "url",
  "util",
  "worker_threads",
  "zlib",
])

/** Detect file extensions that contain JS/TS import statements. */
const SCAN_FILE_RE = /\.(tsx?|jsx?|mjs|cjs)$/

/**
 * Extract import package specifiers from JS/TS source.
 *
 * Recognizes:
 *   - `import X from "pkg"`
 *   - `import { X } from "pkg"`
 *   - `import * as X from "pkg"`
 *   - `import "pkg/styles.css"`
 *   - `import type { X } from "pkg"`
 *   - `export { X } from "pkg"`
 *   - `export * from "pkg"`
 *
 * Filters out:
 *   - Relative imports (`./` and `../`)
 *   - `@/`-aliased project-internal imports
 *   - `node:` prefix and bare Node built-ins
 *   - Assumed peer deps (`react`, `react-dom`)
 *
 * Strips both block and line comments before scanning so a commented-out
 * import does not trigger a false positive.
 */
export function extractImports(content: string): Set<string> {
  const imports = new Set<string>()
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
  const re =
    /(?:^|\s|;)(?:import|export)\s+(?:[\w*{},\s]+\s+from\s+)?["']([^"']+)["']/g
  let match: RegExpExecArray | null
  while ((match = re.exec(stripped)) !== null) {
    const src = match[1]
    if (src.startsWith(".") || src.startsWith("@/")) continue
    if (src.startsWith("node:")) continue
    if (NODE_BUILTINS.has(src)) continue
    // Package-name extraction: `@scope/name/sub/path` -> `@scope/name`,
    // `name/sub/path` -> `name`.
    let pkg: string
    if (src.startsWith("@")) {
      const parts = src.split("/")
      pkg = parts.slice(0, 2).join("/")
    } else {
      pkg = src.split("/")[0]
    }
    if (ASSUMED_PEER_DEPS.has(pkg)) continue
    imports.add(pkg)
  }
  return imports
}

/**
 * Walk an item's declared dependencies plus the dependencies of every
 * registry item it depends on transitively. Returns the union as a Set.
 *
 * Mirrors the CLI's install behavior: `npx visor add <name>` resolves
 * transitive registry deps and installs the union of every item's npm
 * `dependencies`, so the audit must check against that same union.
 */
export function collectTransitiveDeclaredDeps(
  registry: BundledRegistry,
  itemName: string
): Set<string> {
  const byName = new Map<string, BundledRegistryItem>()
  for (const item of registry.items) {
    // Prefer the React-target item when names collide with Flutter entries.
    const existing = byName.get(item.name)
    if (!existing || existing.target === "flutter") {
      byName.set(item.name, item)
    }
  }

  const deps = new Set<string>()
  const seen = new Set<string>()
  const queue: string[] = [itemName]
  while (queue.length > 0) {
    const name = queue.shift()!
    if (seen.has(name)) continue
    seen.add(name)
    const item = byName.get(name)
    if (!item) continue
    if (item.dependencies) {
      for (const dep of item.dependencies) deps.add(dep)
    }
    if (item.registryDependencies) {
      for (const r of item.registryDependencies) {
        if (!seen.has(r)) queue.push(r)
      }
    }
  }
  return deps
}

export interface DepDriftIssue {
  /** Registry item name (e.g. `"button"`). */
  item: string
  /** Source-file path within the item. */
  file: string
  /** npm package name missing from the item's declared `dependencies`. */
  missing: string
}

/**
 * Audit every React-target registry item. Returns an array of drift
 * issues — empty array means the registry is consistent.
 *
 * Flutter-target items are skipped: they consume `pubDependencies` against
 * pubspec.yaml and have a separate dep model.
 */
export function auditRegistryDependencies(
  registry: BundledRegistry
): DepDriftIssue[] {
  const issues: DepDriftIssue[] = []
  for (const item of registry.items) {
    if (item.target === "flutter") continue
    const declared = collectTransitiveDeclaredDeps(registry, item.name)
    for (const file of item.files) {
      if (!SCAN_FILE_RE.test(file.path)) continue
      const imports = extractImports(file.content)
      for (const pkg of imports) {
        if (!declared.has(pkg)) {
          issues.push({ item: item.name, file: file.path, missing: pkg })
        }
      }
    }
  }
  return issues
}
