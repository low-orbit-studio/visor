import { Command } from "commander"
import { loadManifest } from "../registry/resolve.js"
import { getAllCatalogItems, findByName, fuzzyFind } from "../check/catalog.js"
import { scanJsx } from "../check/jsx-scan.js"
import { logger } from "../utils/logger.js"

type ItemType = "ui" | "blocks" | "hooks" | "patterns" | "all"

const TYPE_FILTER: Record<Exclude<ItemType, "all">, string> = {
  ui: "component",
  blocks: "block",
  hooks: "hook",
  patterns: "pattern",
}

function checkListCommand(options: { type?: ItemType; json?: boolean }) {
  const manifest = loadManifest()
  let items = getAllCatalogItems(manifest)

  if (options.type && options.type !== "all") {
    const filterType = TYPE_FILTER[options.type]
    items = items.filter((i) => i.type === filterType)
  }

  const byType: Record<string, number> = {}
  for (const item of items) {
    byType[item.type] = (byType[item.type] ?? 0) + 1
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          success: true,
          items: items.map((i) => ({ type: i.type, name: i.name, category: i.category ?? null, description: i.description })),
          summary: { total: items.length, byType },
        },
        null,
        2
      )
    )
    process.exit(0)
    return
  }

  const groups = new Map<string, typeof items>()
  for (const item of items) {
    const key = item.type
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }

  for (const [type, group] of groups) {
    logger.heading(`${type}s (${group.length})`)
    logger.blank()
    for (const item of group) {
      logger.info(`  ${item.name.padEnd(28)} ${item.description}`)
    }
    logger.blank()
  }
}

function checkHasCommand(pattern: string, options: { fuzzy?: boolean; json?: boolean }) {
  const manifest = loadManifest()

  if (options.fuzzy) {
    const results = fuzzyFind(manifest, pattern, 5)

    if (results.length === 0) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, found: false, query: pattern, results: [] }, null, 2))
      } else {
        logger.warn(`No fuzzy matches for "${pattern}"`)
      }
      process.exit(1)
      return
    }

    if (options.json) {
      console.log(JSON.stringify({ success: true, found: true, query: pattern, results }, null, 2))
      process.exit(0)
      return
    }

    logger.heading(`Fuzzy matches for "${pattern}":`)
    logger.blank()
    for (const r of results) {
      const cmd = r.installCmd ? ` — ${r.installCmd}` : ""
      logger.info(`  ${r.name} [${r.type}]${cmd}`)
      logger.info(`    ${r.description.slice(0, 80)}`)
    }
    return
  }

  const result = findByName(manifest, pattern)

  if (!result.found) {
    if (options.json) {
      console.log(JSON.stringify({ success: false, found: false, query: pattern }, null, 2))
    } else {
      logger.warn(`"${pattern}" not found in Visor catalog. Try --fuzzy for partial matches.`)
    }
    process.exit(1)
    return
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          success: true,
          found: true,
          name: result.name,
          type: result.type,
          category: result.category ?? null,
          description: result.description,
          installCmd: result.installCmd,
        },
        null,
        2
      )
    )
    process.exit(0)
    return
  }

  const cmd = result.installCmd ? ` — ${result.installCmd}` : ""
  logger.success(`${result.name} [${result.type}]${cmd}`)
  logger.info(`  ${result.description}`)
}

async function checkDiffCommand(
  pathArg: string,
  options: { failOnHits?: boolean; json?: boolean }
) {
  const result = await scanJsx(pathArg)

  if (options.json) {
    console.log(JSON.stringify({ success: true, ...result }, null, 2))
    if (options.failOnHits && result.summary.hits > 0) process.exit(1)
    process.exit(0)
    return
  }

  if (result.summary.hits === 0) {
    logger.success(`No native HTML primitives found — ${result.summary.scanned} file(s) scanned.`)
    return
  }

  logger.heading(`Found ${result.summary.hits} native HTML usage(s) in ${result.summary.scanned} file(s):\n`)
  for (const f of result.findings) {
    const loc = `${f.file}:${f.line}:${f.column}`
    const note = f.rationale ? ` (${f.rationale})` : ""
    logger.warn(`  <${f.nativeTag}> → use <${f.suggestedPrimitive}>${note}`)
    logger.item(`  ${loc}  ${f.installCmd}`)
  }
  logger.blank()

  if (options.failOnHits) process.exit(1)
}

export function checkCommand(): Command {
  const check = new Command("check")
    .description("Check Visor catalog — list items, test existence, scan JSX for native HTML")

  check
    .command("list")
    .description("List all catalog items (components, blocks, hooks, patterns)")
    .option("--type <type>", "filter by type: ui, blocks, hooks, patterns, all (default: all)")
    .option("--json", "output structured JSON (for AI agents)")
    .action((options: { type?: ItemType; json?: boolean }) => {
      checkListCommand(options)
    })

  check
    .command("has")
    .description("Check whether a component, block, hook, or pattern exists in the Visor catalog")
    .argument("<pattern>", "component name (kebab-case or PascalCase)")
    .option("--fuzzy", "run fuzzy match and return top 5 results")
    .option("--json", "output structured JSON (for AI agents)")
    .action((pattern: string, options: { fuzzy?: boolean; json?: boolean }) => {
      checkHasCommand(pattern, options)
    })

  check
    .command("diff")
    .description("Scan JSX/TSX for native HTML elements that have Visor equivalents")
    .argument("<path>", "file path, directory, or - for stdin")
    .option("--fail-on-hits", "exit 1 if any native HTML usages are found (for CI use)")
    .option("--json", "output structured JSON (for AI agents)")
    .action(async (pathArg: string, options: { failOnHits?: boolean; json?: boolean }) => {
      await checkDiffCommand(pathArg, options)
    })

  return check
}
