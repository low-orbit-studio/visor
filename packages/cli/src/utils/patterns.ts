import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"
import { parse as parseYAML } from "yaml"

export interface PatternFull {
  name: string
  description: string
  components_used: string[]
  related_blocks?: string[]
  when_to_use: string[]
  structure: string
  notes: string
}

/**
 * Load all *.visor-pattern.yaml files from the patterns/ directory at repoRoot.
 * Returns an empty array if the directory does not exist.
 */
export function loadPatternsFromYaml(repoRoot: string): PatternFull[] {
  const patternsDir = join(repoRoot, "patterns")
  if (!existsSync(patternsDir)) return []

  const files = readdirSync(patternsDir).filter((f) =>
    f.endsWith(".visor-pattern.yaml")
  )

  return files
    .map((file) => {
      const content = readFileSync(join(patternsDir, file), "utf-8")
      return parseYAML(content) as PatternFull
    })
    .filter(Boolean)
}

/**
 * Walk up from startDir looking for a directory that contains a patterns/ folder.
 * Returns the directory path if found, or null.
 */
export function findRepoRoot(startDir: string): string | null {
  let current = startDir
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (existsSync(join(current, "patterns"))) {
      return current
    }
    const parent = join(current, "..")
    if (parent === current) return null
    current = parent
  }
}
