import { existsSync, readdirSync, statSync, type Dirent } from "fs"
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

/**
 * The subdirectory a pattern dir puts its reference build in. Its presence,
 * paired with an approved capture baseline, is what makes a manifest-less
 * directory a *near-miss* rather than an unrelated folder (VI-626 D1).
 */
const REFERENCE_BUILD_DIRNAME = "reference-build"

/** Approved capture baseline, relative to a pattern dir. */
const APPROVED_CAPTURES_SUBPATH = join("captures", "approved")

/** The single reason a near-miss is reported today (VI-626 D3). */
export const MISSING_MANIFEST_REASON = `missing ${BLESSED_MANIFEST_FILENAME}`

export interface DiscoveredBuild {
  /** Absolute path to the blessed build root (the dir holding the manifest). */
  dir: string
  manifest: BlessedManifest
}

/**
 * A *near-miss*: a directory that carries everything a blessed build needs
 * except the manifest that would make it spawnable (VI-626 D1). Reported so a
 * caller asking "what can I spawn?" learns these exist; never treated as a
 * build, and never spawnable (D2).
 */
export interface IncompleteBuild {
  /** Absolute path to the near-miss build root. */
  dir: string
  /** Why the directory is not spawnable, e.g. `missing blessed-manifest.json`. */
  reason: string
}

export interface BlessedDiscoveryResult {
  builds: DiscoveredBuild[]
  /**
   * Near-miss build roots (VI-626). A sibling of `errors` rather than part of
   * it: discovery succeeded, so `success` stays `true` (D4) and `errors` stays
   * reserved for discovery failures — unreadable dirs, malformed manifests.
   */
  incomplete: IncompleteBuild[]
  /** Dirs that carry a manifest file that failed to read/validate. */
  errors: { dir: string; error: string }[]
}

/**
 * Walk `blessedDir` and collect every blessed build — a directory containing a
 * `blessed-manifest.json` (VI-597 D8). Once a manifest is found in a directory,
 * that directory is treated as a build root and we do NOT descend further (the
 * build's own `node_modules`/`.next` etc. are irrelevant to discovery).
 *
 * Directories that carry a `reference-build/` and an approved capture baseline
 * but no manifest are reported as near-misses in `incomplete` (VI-626) instead
 * of being silently walked past. They are build roots too, so — like a blessed
 * build — they terminate the descent.
 *
 * Missing `blessedDir` yields an empty result rather than throwing.
 */
export function discoverBlessedBuilds(
  blessedDir: string,
  maxDepth = 8
): BlessedDiscoveryResult {
  const builds: DiscoveredBuild[] = []
  const incomplete: IncompleteBuild[] = []
  const errors: { dir: string; error: string }[] = []

  if (!existsSync(blessedDir)) {
    return { builds, incomplete, errors }
  }

  walk(blessedDir, 0)

  builds.sort((a, b) => {
    if (a.manifest.shape !== b.manifest.shape) {
      return a.manifest.shape.localeCompare(b.manifest.shape)
    }
    return a.manifest.pattern.localeCompare(b.manifest.pattern)
  })
  incomplete.sort((a, b) => a.dir.localeCompare(b.dir))

  return { builds, incomplete, errors }

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

    if (isNearMissRoot(dir, entries)) {
      incomplete.push({ dir, reason: MISSING_MANIFEST_REASON })
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
 * A near-miss is a directory holding both `reference-build/` and an approved
 * capture baseline at `captures/approved/`, with no `blessed-manifest.json`
 * (VI-626 D1) — exactly the state a reference build sits in between "captured
 * and approved" and "blessed".
 *
 * Two manifest locations are checked, because both are places a manifest for
 * this layout can legitimately live: `dir` itself (already ruled out by the
 * caller's early return) and `dir/reference-build/`, which is where every real
 * blessed build ships it. Checking the latter is what keeps a *blessed* pattern
 * dir — which also has `reference-build/` + `captures/approved/` — from being
 * misreported as a near-miss and, because near-misses terminate the descent,
 * from hiding its own build.
 */
function isNearMissRoot(dir: string, entries: Dirent[]): boolean {
  const hasReferenceBuild = entries.some(
    (entry) => entry.isDirectory() && entry.name === REFERENCE_BUILD_DIRNAME
  )
  if (!hasReferenceBuild) return false

  const approved = join(dir, APPROVED_CAPTURES_SUBPATH)
  try {
    if (!statSync(approved).isDirectory()) return false
  } catch {
    return false
  }

  return !existsSync(join(dir, REFERENCE_BUILD_DIRNAME, BLESSED_MANIFEST_FILENAME))
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
