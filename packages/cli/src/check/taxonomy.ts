/**
 * Kit taxonomy resolution (VI-631 D7).
 *
 * The composition lint asserts *kit membership* — "is this element part of the
 * project's kit?" — against `taxonomy.json`, read as data. There is no second
 * parser and no re-typed kit list in this repo: the taxonomy is the single
 * definition, produced by PL-2821 and shipped alongside the design prototypes.
 *
 * Resolution order (first hit wins):
 *   1. an explicit path — `--taxonomy <path>`
 *   2. the `VISOR_TAXONOMY` environment variable
 *   3. a `taxonomy` key in the scanned directory's `.visorrc.json`
 *   4. conventional discovery, walking up from the scanned path
 *
 * Fail-closed is the caller's job: when a taxonomy was *asked for* and cannot be
 * loaded, `resolveTaxonomy` returns `{ taxonomy: null, error: "..." }` and the
 * scan reports `kit-taxonomy-missing` rather than passing green. A green that
 * silently skipped the assertion would be worse than no assertion at all.
 */

import { readFileSync, existsSync, statSync } from "fs"
import { resolve, join, dirname, isAbsolute } from "path"

/** Where a taxonomy path came from — reported so a green is traceable. */
export type TaxonomySource = "flag" | "env" | "visorrc" | "discovered"

export interface KitTaxonomy {
  /** Absolute path the taxonomy was read from. */
  path: string
  /** kebab-case element slugs, e.g. "stat-card", "admin-shell". */
  slugs: Set<string>
  /** PascalCase component identifiers, e.g. "StatCard", "AdminShell". */
  identifiers: Set<string>
}

export interface TaxonomyResolution {
  taxonomy: KitTaxonomy | null
  /** The path we tried (or resolved), when there was one. */
  path: string | null
  source: TaxonomySource | null
  /** Non-null when a taxonomy was requested but could not be loaded. */
  error: string | null
  /** True when a path was explicitly configured (flag / env / .visorrc.json). */
  requested: boolean
}

/** Relative locations searched when no explicit path is configured. */
const DISCOVERY_CANDIDATES = [
  "taxonomy.json",
  join(".visor", "taxonomy.json"),
  join("design-prototypes", "admin-ui", "taxonomy.json"),
]

/** `stat-card` → `StatCard`; `blocks/admin-shell` → `AdminShell`. */
export function slugToIdentifier(slug: string): string {
  const bare = slug.includes("/") ? slug.slice(slug.lastIndexOf("/") + 1) : slug
  return bare
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
}

/** `blocks/admin-shell` → `admin-shell`. Token refs (`--divider`) are dropped upstream. */
function refToSlug(ref: string): string | null {
  const bare = ref.includes("/") ? ref.slice(ref.lastIndexOf("/") + 1) : ref
  if (!/^[a-z][a-z0-9-]*$/.test(bare)) return null
  return bare
}

interface TaxonomyEntry {
  ref?: unknown
  kind?: unknown
}

interface TaxonomyRow {
  visor?: { entries?: unknown } | null
}

/**
 * Extract the kit's component/block element set from a parsed `taxonomy.json`.
 * `kind: "token"` rows are skipped — a token is not an element you can redeclare.
 */
export function parseTaxonomy(data: unknown, path: string): KitTaxonomy {
  const root = data as { tiers?: unknown } | null
  const tiers = Array.isArray(root?.tiers) ? (root!.tiers as unknown[]) : null
  if (!tiers) {
    throw new Error(`taxonomy.json at ${path} has no "tiers" array — not a kit taxonomy.`)
  }

  const slugs = new Set<string>()
  for (const tier of tiers) {
    const families = (tier as { families?: unknown }).families
    if (!Array.isArray(families)) continue
    for (const family of families) {
      const rows = (family as { rows?: unknown }).rows
      if (!Array.isArray(rows)) continue
      for (const row of rows as TaxonomyRow[]) {
        const entries = row?.visor?.entries
        if (!Array.isArray(entries)) continue
        for (const entry of entries as TaxonomyEntry[]) {
          if (entry?.kind !== "component" && entry?.kind !== "block") continue
          if (typeof entry.ref !== "string") continue
          const slug = refToSlug(entry.ref)
          if (slug) slugs.add(slug)
        }
      }
    }
  }

  if (slugs.size === 0) {
    throw new Error(`taxonomy.json at ${path} declares no component or block elements.`)
  }

  const identifiers = new Set<string>()
  for (const slug of slugs) identifiers.add(slugToIdentifier(slug))

  return { path, slugs, identifiers }
}

function loadFrom(path: string): KitTaxonomy {
  const raw = readFileSync(path, "utf-8")
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error(`taxonomy.json at ${path} is not valid JSON.`)
  }
  return parseTaxonomy(data, path)
}

/**
 * Walk up from `startDir` looking for a conventional taxonomy location, bounded
 * at the repository root (the first directory carrying a `.git` entry — a file
 * in a worktree, a directory in a normal clone). Unbounded discovery would let
 * an unrelated `taxonomy.json` far up the filesystem silently define the kit.
 */
function discover(startDir: string): string | null {
  let dir = startDir
  for (;;) {
    for (const candidate of DISCOVERY_CANDIDATES) {
      const full = join(dir, candidate)
      if (existsSync(full)) return full
    }
    if (existsSync(join(dir, ".git"))) return null
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

export interface ResolveTaxonomyOptions {
  /** Explicit path from `--taxonomy` (highest precedence). */
  explicitPath?: string
  /** `taxonomy` key read out of the scanned directory's `.visorrc.json`. */
  visorrcPath?: string
  /** The file or directory being scanned — the anchor for discovery. */
  scanPath: string
  /** Injected for tests; defaults to `process.env`. */
  env?: Record<string, string | undefined>
}

export function resolveTaxonomy(options: ResolveTaxonomyOptions): TaxonomyResolution {
  const { explicitPath, visorrcPath, scanPath, env = process.env } = options

  const scanAbs = resolve(scanPath)
  let scanDir = scanAbs
  try {
    if (!statSync(scanAbs).isDirectory()) scanDir = dirname(scanAbs)
  } catch {
    scanDir = dirname(scanAbs)
  }

  const envPath = env.VISOR_TAXONOMY
  const configured: Array<{ path: string; source: TaxonomySource }> = []
  if (explicitPath) configured.push({ path: resolve(explicitPath), source: "flag" })
  else if (envPath) configured.push({ path: resolve(envPath), source: "env" })
  else if (visorrcPath) {
    configured.push({
      path: isAbsolute(visorrcPath) ? visorrcPath : resolve(scanDir, visorrcPath),
      source: "visorrc",
    })
  }

  if (configured.length > 0) {
    const { path, source } = configured[0]
    if (!existsSync(path)) {
      return {
        taxonomy: null,
        path,
        source,
        error: `Kit taxonomy not found at ${path}.`,
        requested: true,
      }
    }
    try {
      return { taxonomy: loadFrom(path), path, source, error: null, requested: true }
    } catch (err) {
      return {
        taxonomy: null,
        path,
        source,
        error: err instanceof Error ? err.message : String(err),
        requested: true,
      }
    }
  }

  const found = discover(scanDir)
  if (!found) {
    return { taxonomy: null, path: null, source: null, error: null, requested: false }
  }
  try {
    return { taxonomy: loadFrom(found), path: found, source: "discovered", error: null, requested: false }
  } catch (err) {
    return {
      taxonomy: null,
      path: found,
      source: "discovered",
      error: err instanceof Error ? err.message : String(err),
      requested: false,
    }
  }
}
