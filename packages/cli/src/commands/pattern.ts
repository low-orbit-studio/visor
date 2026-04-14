import { loadPatternsFromYaml, findRepoRoot } from "../utils/patterns.js"
import { logger } from "../utils/logger.js"

export interface PatternCommandOptions {
  json?: boolean
}

export function patternListCommand(
  cwd: string,
  options: PatternCommandOptions = {}
): void {
  const json = options.json ?? false

  const repoRoot = findRepoRoot(cwd)
  if (!repoRoot) {
    if (json) {
      console.log(
        JSON.stringify({ success: false, error: "Could not find patterns/ directory." }, null, 2)
      )
      process.exit(1)
      return
    }
    logger.error("Could not find patterns/ directory.")
    process.exit(1)
    return
  }

  const patterns = loadPatternsFromYaml(repoRoot)

  if (json) {
    const output = patterns.map((p) => ({
      name: p.name,
      description: p.description,
      components_used: p.components_used,
      when_to_use: p.when_to_use,
    }))
    console.log(
      JSON.stringify(
        {
          success: true,
          patterns: output,
          summary: { total: output.length },
        },
        null,
        2
      )
    )
    process.exit(0)
    return
  }

  logger.heading(`Composition Patterns (${patterns.length})`)
  logger.blank()
  for (const p of patterns) {
    logger.info(`  ${p.name.padEnd(32)} ${p.description}`)
  }
  logger.blank()
}

export function patternInfoCommand(
  name: string,
  cwd: string,
  options: PatternCommandOptions = {}
): void {
  const json = options.json ?? false

  const repoRoot = findRepoRoot(cwd)
  if (!repoRoot) {
    if (json) {
      console.log(
        JSON.stringify({ success: false, error: "Could not find patterns/ directory." }, null, 2)
      )
      process.exit(1)
      return
    }
    logger.error("Could not find patterns/ directory.")
    process.exit(1)
    return
  }

  const patterns = loadPatternsFromYaml(repoRoot)

  // Match by name (case-insensitive) or by slug derived from filename
  const pattern = patterns.find(
    (p) =>
      p.name.toLowerCase() === name.toLowerCase() ||
      p.name.toLowerCase().replace(/\s+/g, "-") === name.toLowerCase()
  )

  if (!pattern) {
    if (json) {
      console.log(
        JSON.stringify({ success: false, error: `Pattern "${name}" not found.` }, null, 2)
      )
      process.exit(1)
      return
    }
    logger.error(`Pattern "${name}" not found.`)
    process.exit(1)
    return
  }

  if (json) {
    console.log(
      JSON.stringify(
        {
          success: true,
          pattern: {
            name: pattern.name,
            description: pattern.description,
            components_used: pattern.components_used,
            ...(pattern.related_blocks ? { related_blocks: pattern.related_blocks } : {}),
            when_to_use: pattern.when_to_use,
            structure: pattern.structure,
            notes: pattern.notes,
          },
        },
        null,
        2
      )
    )
    process.exit(0)
    return
  }

  logger.heading(pattern.name)
  logger.blank()
  logger.info(`Description: ${pattern.description}`)
  logger.blank()
  logger.info(`Components used: ${pattern.components_used.join(", ")}`)
  logger.blank()
  logger.info("When to use:")
  for (const item of pattern.when_to_use) {
    logger.info(`  - ${item}`)
  }
  if (pattern.related_blocks && pattern.related_blocks.length > 0) {
    logger.blank()
    logger.info(`Related blocks: ${pattern.related_blocks.join(", ")}`)
  }
  logger.blank()
  logger.info("Structure:")
  logger.blank()
  console.log(pattern.structure)
  logger.blank()
  logger.info("Notes:")
  logger.blank()
  console.log(pattern.notes)
  logger.blank()
}
