import { existsSync, readdirSync } from "fs"
import { join } from "path"
import {
  BLESSED_MANIFEST_FILENAME,
  parseBlessedManifest,
  type BlessedManifest,
} from "./blessed-manifest.js"

/**
 * Directories never descended into while walking the blessed-dir tree. These
 * are transient/build artefacts that can be large and never contain a blessed
 * build root of their own.
 */
const WALK_EXCLUDE_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  ".turbo",
  "coverage",
  ".cache",
])

export interface DiscoveredBuild {
  /** Absolute path to the blessed build root (the dir holding the manifest). */
  dir: string
  manifest: BlessedManifest
}

export interface BlessedDiscoveryResult {
  builds: DiscoveredBuild[]
  /** Dirs that carry a manifest file that failed to read/validate. */
  errors: { dir: string; error: string }[]
}

/**
 * Walk `blessedDir` and collect every blessed build — a directory containing a
 * `blessed-manifest.json` (VI-597 D8). Once a manifest is found in a directory,
 * that directory is treated as a build root and we do NOT descend further (the
 * build's own `node_modules`/`.next` etc. are irrelevant to discovery).
 *
 * Missing `blessedDir` yields an empty result rather than throwing.
 */
export function discoverBlessedBuilds(
  blessedDir: string,
  maxDepth = 8
): BlessedDiscoveryResult {
  const builds: DiscoveredBuild[] = []
  const errors: { dir: string; error: string }[] = []

  if (!existsSync(blessedDir)) {
    return { builds, errors }
  }

  walk(blessedDir, 0)

  builds.sort((a, b) => {
    if (a.manifest.shape !== b.manifest.shape) {
      return a.manifest.shape.localeCompare(b.manifest.shape)
    }
    return a.manifest.pattern.localeCompare(b.manifest.pattern)
  })

  return { builds, errors }

  function walk(dir: string, depth: number): void {
    if (depth > maxDepth) return

    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }

    const hasManifest = entries.some(
      (entry) => entry.isFile() && entry.name === BLESSED_MANIFEST_FILENAME
    )
    if (hasManifest) {
      const result = parseBlessedManifest(dir)
      if (result.ok) {
        builds.push({ dir, manifest: result.manifest })
      } else {
        errors.push({ dir, error: result.error })
      }
      return
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (WALK_EXCLUDE_DIRS.has(entry.name)) continue
      walk(join(dir, entry.name), depth + 1)
    }
  }
}

/**
 * Resolve a single blessed build by `shape` + `pattern`. Returns the matched
 * build (if any) alongside the full discovered list so callers can render a
 * helpful "available builds" hint when there is no match.
 */
export function resolveBlessedBuild(
  blessedDir: string,
  shape: string,
  pattern: string
): { build?: DiscoveredBuild; available: DiscoveredBuild[] } {
  const { builds } = discoverBlessedBuilds(blessedDir)
  const build = builds.find(
    (candidate) =>
      candidate.manifest.shape === shape && candidate.manifest.pattern === pattern
  )
  return { build, available: builds }
}
