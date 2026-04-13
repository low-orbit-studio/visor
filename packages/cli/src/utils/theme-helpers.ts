import { existsSync } from "fs"
import { resolve, dirname, join } from "path"

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
