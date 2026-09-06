import { Command } from "commander"
import { statSync } from "fs"
import { resolve, dirname } from "path"
import { loadManifest } from "../registry/resolve.js"
import { getAllCatalogItems, findByName, fuzzyFind } from "../check/catalog.js"
import { scanJsx } from "../check/jsx-scan.js"
import { scanDesign, loadVisorRc, compositionScopeNotice, COMPOSITION_SCOPE } from "../check/design.js"
import { checkThemeModeFile } from "../check/theme-mode.js"
import { logger } from "../utils/logger.js"
import pc from "picocolors"

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

/**
 * VI-631 D2 — the checker states its own limit. A green here says the scanned
 * surface introduced no styling outside the kit; it never says the surface is
 * on-design. Printing it on the green path is the point: a green read as
 * "on-design" is exactly the failure this statement exists to prevent.
 */
function printCompositionScope(): void {
  logger.blank()
  for (const line of compositionScopeNotice()) logger.item(line)
  logger.blank()
}

async function checkDiffCommand(
  pathArg: string,
  options: { failOnHits?: boolean; json?: boolean }
) {
  const result = await scanJsx(pathArg)

  if (options.json) {
    // `process.exit()` truncates a large payload on a pipe — set the code and
    // let Node flush stdout on a natural exit instead.
    console.log(JSON.stringify({ success: true, ...result, composition: COMPOSITION_SCOPE }, null, 2))
    if (options.failOnHits && result.summary.hits > 0) process.exitCode = 1
    return
  }

  if (result.summary.hits === 0) {
    logger.success(`No native HTML primitives found — ${result.summary.scanned} file(s) scanned.`)
    printCompositionScope()
    return
  }

  logger.heading(`Found ${result.summary.hits} native HTML usage(s) in ${result.summary.scanned} file(s):\n`)
  for (const f of result.findings) {
    const loc = `${f.file}:${f.line}:${f.column}`
    const note = f.rationale ? ` (${f.rationale})` : ""
    logger.warn(`  <${f.nativeTag}> → use <${f.suggestedPrimitive}>${note}`)
    logger.item(`  ${loc}  ${f.installCmd}`)
  }
  printCompositionScope()

  if (options.failOnHits) process.exit(1)
}

interface DesignCheckCommandOptions {
  format?: "json" | "human"
  errorsOnly?: boolean
  // Commander maps `--no-fail` to `fail: false` (negatable boolean, default
  // true). It never sets a `noFail` key — reading one silently pins advisory
  // mode off and the exit-1 fires anyway. Always test `options.fail !== false`.
  fail?: boolean
  json?: boolean
  taxonomy?: string
  composition?: boolean
}

function checkDesignCommand(
  pathArg: string,
  options: DesignCheckCommandOptions
): void {
  const absPath = resolve(pathArg)

  // Load per-project .visorrc.json rule toggles from the scanned directory
  const rcDir = statSync(absPath).isDirectory() ? absPath : dirname(absPath)
  const rc = loadVisorRc(rcDir)

  const result = scanDesign(absPath, {
    disabledRules: rc.disabledRules ?? [],
    errorsOnly: options.errorsOnly ?? false,
    taxonomyPath: options.taxonomy,
    visorrcTaxonomyPath: rc.taxonomy,
    composition: options.composition ?? false,
  })

  // Determine output format: --json or --format json → JSON; otherwise human
  const useJson = options.json || options.format === "json"

  // `--no-fail` is advisory mode: findings still print, only the exit code is
  // suppressed. See DesignCheckCommandOptions for the Commander mapping.
  const shouldFail = options.fail !== false

  if (useJson) {
    // A full-project scan emits megabytes of findings; `process.exit()` would
    // truncate them mid-string on a pipe. Set the exit code and return instead.
    console.log(JSON.stringify({ success: true, ...result }, null, 2))
    if (shouldFail && result.summary.errorCount > 0) process.exitCode = 1
    return
  }

  // Human output
  const { errors, warnings, summary, composition } = result

  const printKitMembership = () => {
    const km = composition.kitMembership
    if (km.asserted) {
      logger.item(`Kit membership: asserted against ${km.taxonomyPath} (${km.elementCount} element(s), via ${km.source}).`)
    } else {
      logger.item(`Kit membership: NOT asserted — ${km.reason}`)
    }
  }

  if (summary.errorCount === 0 && summary.warningCount === 0) {
    logger.success(`No design anti-patterns found — ${summary.filesScanned} file(s) scanned.`)
    printCompositionScope()
    printKitMembership()
    logger.blank()
    process.exit(0)
    return
  }

  logger.blank()
  logger.heading(`visor check design — ${summary.filesScanned} file(s) scanned`)
  logger.blank()

  // Group by file
  const byFile = new Map<string, typeof errors>()
  const allFindings = [...errors, ...warnings]
  for (const f of allFindings) {
    if (!byFile.has(f.file)) byFile.set(f.file, [])
    byFile.get(f.file)!.push(f)
  }

  for (const [file, fileFindings] of byFile) {
    logger.heading(`  ${file}`)
    for (const f of fileFindings) {
      const loc = pc.dim(`${f.line}:`)
      const badge = f.severity === "error" ? pc.red("error") : pc.yellow("warn ")
      const ruleName = pc.dim(`[${f.rule}]`)
      console.log(`    ${loc} ${badge}  ${f.message}  ${ruleName}`)
      if (f.fix) {
        console.log(`           ${pc.dim("fix:")} ${pc.cyan(f.fix)}`)
      }
    }
    logger.blank()
  }

  logger.blank()
  if (summary.errorCount > 0) {
    logger.error(`${summary.errorCount} error(s), ${summary.warningCount} warning(s)`)
  } else {
    logger.warn(`${summary.warningCount} warning(s) (0 errors)`)
  }
  printCompositionScope()
  printKitMembership()
  logger.blank()

  if (shouldFail && summary.errorCount > 0) process.exit(1)
}

interface ThemeModeCommandOptions {
  format?: "json" | "human"
  // Commander maps `--no-fail` to `fail: false` (negatable boolean, default true).
  fail?: boolean
  json?: boolean
}

function checkThemeModeCommand(
  pathArg: string,
  options: ThemeModeCommandOptions
): void {
  let result
  try {
    result = checkThemeModeFile(pathArg)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const useJson = options.json || options.format === "json"
    if (useJson) {
      console.log(JSON.stringify({ success: false, error: message }, null, 2))
    } else {
      logger.error(message)
    }
    process.exit(1)
    return
  }

  const useJson = options.json || options.format === "json"

  const shouldFail = options.fail !== false

  if (useJson) {
    console.log(JSON.stringify({ success: true, ...result }, null, 2))
    if (shouldFail && !result.pass) process.exit(1)
    process.exit(0)
    return
  }

  // Human output
  if (result.skipped) {
    logger.info(`⃝  skipped — ${result.theme}: ${result.reason}`)
    process.exit(0)
    return
  }

  if (result.pass) {
    logger.success(`${result.theme} — ${result.reason}`)
    process.exit(0)
    return
  }

  logger.error(`${result.theme} — ${result.reason}`)
  logger.item(`  offending background: ${pc.cyan(result.computed_bg ?? "unknown")} (luminance ${result.luminance?.toFixed(4)})`)
  if (shouldFail) process.exit(1)
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

  check
    .command("design")
    .description("Scan frontend code for Borealis design anti-patterns (deterministic, no LLM). Asserts composition — that the surface introduced no styling outside the kit — never arrangement.")
    .argument("<path>", "file path or directory to scan")
    .option("--format <format>", "output format: json or human (default: human when TTY, json otherwise)")
    .option("--errors-only", "report only error-severity rules (skip warnings)")
    .option("--no-fail", "do not exit 1 on errors (advisory mode)")
    .option("--json", "shorthand for --format json")
    .option("--taxonomy <path>", "path to the kit's taxonomy.json — the definition kit membership is asserted against")
    .option("--composition", "require the kit-membership assertion: fail closed when no taxonomy.json resolves")
    .action((pathArg: string, options: DesignCheckCommandOptions) => {
      checkDesignCommand(pathArg, options)
    })

  check
    .command("theme-mode")
    .description("Assert a theme's rendered app-root background matches its declared color-scheme (dark-only/light-only/adaptive)")
    .argument("<path>", "path to a .visor.yaml theme file")
    .option("--format <format>", "output format: json or human (default: human)")
    .option("--no-fail", "do not exit 1 on a mode mismatch (advisory mode)")
    .option("--json", "shorthand for --format json")
    .action((pathArg: string, options: ThemeModeCommandOptions) => {
      checkThemeModeCommand(pathArg, options)
    })

  return check
}
