import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, realpathSync, statSync } from "fs"
import { resolve, dirname, join } from "path"
import { execFileSync } from "child_process"

/** Convert a theme name to a kebab-case slug. */
export function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-")
}

/** Convert a theme name to a display label (title-cased words). */
export function toLabel(name: string): string {
  return name
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

/** Walk up from dir until we find a directory containing packages/docs. */
export function findRepoRoot(startDir: string): string | null {
  let current = resolve(startDir)
  while (true) {
    if (existsSync(join(current, "packages", "docs"))) {
      return current
    }
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  return null
}

/**
 * Resolve the main worktree's repo root. In a git worktree, `findRepoRoot`
 * returns the worktree path; this returns the canonical main checkout path
 * so sibling lookups converge to the same `visor-themes-private/` location
 * regardless of which worktree the command runs from.
 *
 * Falls back to `findRepoRoot(startDir)` when git is unavailable or the
 * lookup fails for any reason.
 */
export function findMainRepoRoot(startDir: string): string | null {
  try {
    const commonDir = execFileSync("git", ["rev-parse", "--git-common-dir"], {
      cwd: startDir,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
    if (commonDir) {
      const absoluteCommonDir = resolve(startDir, commonDir)
      const candidate = dirname(absoluteCommonDir)
      if (existsSync(join(candidate, "packages", "docs"))) {
        return candidate
      }
    }
  } catch {
    // git not available or not a repo — fall through to local repo root
  }
  return findRepoRoot(startDir)
}

export class BrokenSymlinkError extends Error {
  readonly code = "BROKEN_SYMLINK"
  constructor(public readonly path: string, public readonly target: string) {
    super(`Broken symlink: ${path} → ${target}`)
  }
}

/**
 * Walk a directory and throw a `BrokenSymlinkError` if any entry is a
 * dangling symlink. Returns silently when all entries resolve.
 */
export function assertNoBrokenSymlinks(dir: string): void {
  if (!existsSync(dir)) return
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const entryPath = join(dir, entry.name)
    let lst
    try {
      lst = lstatSync(entryPath)
    } catch {
      continue
    }
    if (lst.isSymbolicLink()) {
      const target = readlinkSync(entryPath)
      try {
        statSync(entryPath)
      } catch {
        throw new BrokenSymlinkError(entryPath, target)
      }
    }
  }
}

/**
 * Scan `parentDir` one level deep for any subdirectory containing
 * `visor-themes-private/themes/`. Returns the absolute paths to those `themes/`
 * directories, sorted alphabetically by candidate dir name. Catches the LO
 * convention `~/Code/low-orbit/visor-themes-private/themes/` and any other
 * parent-org layout when the visor checkout is at `~/Code/visor/`.
 *
 * Does not throw for missing `parentDir`. Symlinked subdirs are followed
 * (existsSync resolves them), so a working symlink to a private themes
 * checkout is also picked up.
 */
export function scanParentForPrivateThemes(parentDir: string): string[] {
  if (!existsSync(parentDir)) return []
  const entries = readdirSync(parentDir, { withFileTypes: true })
  const matches: string[] = []
  for (const entry of entries) {
    // Accept directories AND symlinks pointing at directories
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
    const candidate = join(parentDir, entry.name, "visor-themes-private", "themes")
    if (existsSync(candidate)) {
      matches.push(candidate)
    }
  }
  return matches.sort()
}

/**
 * Discover themes in a nested directory layout: `{dir}/{slug}/theme.visor.yaml`.
 * The slug is taken from the parent dirname. Throws `BrokenSymlinkError` for
 * any dangling symlink encountered while scanning.
 */
export function scanNestedThemeDir(dir: string): { filePath: string; slug: string }[] {
  if (!existsSync(dir)) return []
  assertNoBrokenSymlinks(dir)
  const entries = readdirSync(dir, { withFileTypes: true })
  const out: { filePath: string; slug: string }[] = []
  for (const entry of entries) {
    // Accept directories AND symlinks pointing at directories — matches the
    // symlink-aware behavior of scanParentForPrivateThemes one tier up.
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
    const themeFile = join(dir, entry.name, "theme.visor.yaml")
    if (existsSync(themeFile)) {
      out.push({ filePath: themeFile, slug: entry.name })
    }
  }
  return out
}

/**
 * Detect whether `cwd` is inside a Visor monorepo workspace. Walks up looking
 * for a `package.json` whose `name` is "visor" and whose `workspaces` array
 * references both `packages/cli` and `packages/theme-engine`. Returns the
 * workspace root path or null.
 */
export function detectVisorWorkspace(cwd: string): string | null {
  let current = resolve(cwd)
  while (true) {
    const pkgPath = join(current, "package.json")
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
          name?: string
          workspaces?: string[]
        }
        const workspaces = pkg.workspaces ?? []
        const hasCli = workspaces.some((w) => w.includes("packages/cli"))
        const hasEngine = workspaces.some((w) => w.includes("packages/theme-engine"))
        if (pkg.name === "visor" && hasCli && hasEngine) {
          return current
        }
      } catch {
        // ignore malformed package.json and keep walking
      }
    }
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  return null
}

/**
 * Returns true when `scriptPath` resolves to the workspace's local visor
 * binary at `<workspaceRoot>/packages/cli/dist/`. Resolves both paths via
 * `realpathSync` so symlinked binaries (npm, pnpm, yarn) match correctly.
 */
export function isLocalVisorBinary(workspaceRoot: string, scriptPath: string | undefined): boolean {
  if (!scriptPath) return false
  const expectedPrefix = join(workspaceRoot, "packages", "cli", "dist")
  let resolvedScript: string
  let resolvedPrefix: string
  try {
    resolvedScript = realpathSync(scriptPath)
  } catch {
    resolvedScript = resolve(scriptPath)
  }
  try {
    resolvedPrefix = realpathSync(expectedPrefix)
  } catch {
    resolvedPrefix = resolve(expectedPrefix)
  }
  return resolvedScript.startsWith(resolvedPrefix + "/") || resolvedScript === resolvedPrefix
}
