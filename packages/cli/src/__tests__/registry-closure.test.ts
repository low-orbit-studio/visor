/**
 * VI-716 regression gate: `npx visor add <item>` must install everything the
 * item's files need. `design-system-deck` shipped depending on a name that
 * didn't exist (`slide-header`) and importing five files no registry item
 * installed — the CLI threw on first install.
 *
 * Runs against the SOURCE registry (not dist/registry.json) so it can never
 * skip itself for want of a build.
 */
import { describe, it, expect, beforeAll } from "vitest"
import { readFileSync, existsSync } from "fs"
import { join, dirname, posix } from "path"
import { fileURLToPath } from "url"
import { auditRegistryDependencies } from "../registry/audit-dependencies.js"
import type { BundledRegistry, BundledRegistryItem } from "../registry/types.js"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..")
const SCAN_FILE_RE = /\.(tsx?|jsx?|mjs|cjs)$/
const RESOLVE_SUFFIXES = ["", ".ts", ".tsx", ".js", "/index.ts", "/index.tsx"]

let items: BundledRegistryItem[] = []
let byName = new Map<string, BundledRegistryItem>()

beforeAll(async () => {
  const sources = ["ui", "hooks", "lib", "deck", "blocks", "visual", "devtools"]
  for (const source of sources) {
    const mod = await import(join(REPO_ROOT, `registry/registry-${source}.ts`))
    items.push(...(mod[source] as BundledRegistryItem[]))
  }
  items = items
    .filter((item) => item.target !== "flutter")
    .map((item) => ({
      ...item,
      files: item.files.map((file) => ({
        ...file,
        content: readFileSync(join(REPO_ROOT, file.path), "utf-8"),
      })),
    }))
  byName = new Map(items.map((item) => [item.name, item]))
})

/** Every file `npx visor add <name>` writes: the item's own plus its transitive deps'. */
function installedFiles(name: string): Set<string> {
  const files = new Set<string>()
  const seen = new Set<string>()
  const queue = [name]
  while (queue.length > 0) {
    const item = byName.get(queue.shift()!)
    if (!item || seen.has(item.name)) continue
    seen.add(item.name)
    for (const file of item.files) files.add(file.path)
    queue.push(...(item.registryDependencies ?? []))
  }
  return files
}

function relativeImports(content: string): string[] {
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
  const re = /(?:^|\s|;)(?:import|export)\s+(?:[\w*{},\s]+\s+from\s+)?["'](\.[^"']*)["']/g
  return [...stripped.matchAll(re)].map((m) => m[1]!)
}

describe("registry closure (source registry)", () => {
  it("every registryDependency names a registered item", () => {
    const missing = items.flatMap((item) =>
      (item.registryDependencies ?? [])
        .filter((dep) => !byName.has(dep))
        .map((dep) => `${item.name} → ${dep}`)
    )
    expect(missing).toEqual([])
  })

  it("every relative import is installed by the item or its dependencies", () => {
    const missing: string[] = []
    for (const item of items) {
      const installed = installedFiles(item.name)
      for (const file of item.files) {
        if (!SCAN_FILE_RE.test(file.path)) continue
        for (const spec of relativeImports(file.content)) {
          const target = posix.join(posix.dirname(file.path), spec)
          const found = RESOLVE_SUFFIXES.some((suffix) => installed.has(target + suffix))
          // A file that doesn't exist in the repo is a different bug (the build
          // catches it); this gate is about files that exist but aren't installed.
          const existsInRepo = RESOLVE_SUFFIXES.some((suffix) =>
            existsSync(join(REPO_ROOT, target + suffix))
          )
          if (!found && existsInRepo) missing.push(`${item.name}: ${file.path} → ${spec}`)
        }
      }
    }
    expect(missing).toEqual([])
  })

  it("every package import is a declared dependency of the item or its dependencies", () => {
    const registry: BundledRegistry = { items } as BundledRegistry
    const issues = auditRegistryDependencies(registry).map(
      (issue) => `${issue.item}: ${issue.file} → ${issue.missing}`
    )
    expect(issues).toEqual([])
  })
})
