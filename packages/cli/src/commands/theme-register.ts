import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
import { resolve, join } from "path"
import { generateThemeData } from "@loworbitstudio/visor-theme-engine"
import { docsAdapter } from "@loworbitstudio/visor-theme-engine/adapters"
import { logger } from "../utils/logger.js"
import { toSlug, toLabel, findRepoRoot } from "../utils/theme-helpers.js"

export interface ThemeRegisterOptions {
  group: string
  dryRun?: boolean
  json?: boolean
}

/**
 * Insert a theme @import into globals.css in alphabetical order among the
 * existing theme imports. Returns the updated content and whether a change was made.
 */
function insertGlobalsImport(
  content: string,
  slug: string,
): { updated: string; changed: boolean } {
  const importLine = `@import './${slug}-theme.css';`

  if (content.includes(importLine)) {
    return { updated: content, changed: false }
  }

  const lines = content.split("\n")
  const themeImportPattern = /^@import '\.\/[\w-]+-theme\.css';/

  const themeImportIndices: number[] = []
  for (let i = 0; i < lines.length; i++) {
    if (themeImportPattern.test(lines[i])) {
      themeImportIndices.push(i)
    }
  }

  if (themeImportIndices.length === 0) {
    const lastImportIdx = lines.reduce(
      (last, line, i) => (line.startsWith("@import") ? i : last),
      -1,
    )
    const insertAt = lastImportIdx + 1
    lines.splice(insertAt, 0, importLine)
    return { updated: lines.join("\n"), changed: true }
  }

  let insertAt = themeImportIndices[themeImportIndices.length - 1] + 1
  for (const idx of themeImportIndices) {
    if (importLine < lines[idx]) {
      insertAt = idx
      break
    }
  }
  lines.splice(insertAt, 0, importLine)
  return { updated: lines.join("\n"), changed: true }
}

/**
 * Insert a theme entry into theme-config.ts within the matching group,
 * in alphabetical order by value.
 */
function insertThemeConfig(
  content: string,
  slug: string,
  label: string,
  group: string,
): { updated: string; changed: boolean; error?: string } {
  if (content.includes(`value: "${slug}"`)) {
    return { updated: content, changed: false }
  }

  const escapedGroup = group.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const groupPattern = new RegExp(`label:\\s*"${escapedGroup}"`)
  const groupMatch = groupPattern.exec(content)
  if (!groupMatch) {
    return {
      updated: content,
      changed: false,
      error: `Group "${group}" not found in theme-config.ts. Available groups: Visor, Client, Low Orbit.`,
    }
  }

  const afterGroup = content.slice(groupMatch.index)
  const themesMatch = /themes:\s*\[/.exec(afterGroup)
  if (!themesMatch) {
    return { updated: content, changed: false, error: `Could not find themes array for group "${group}".` }
  }

  const themesStart = groupMatch.index + themesMatch.index + themesMatch[0].length
  const closingBracket = content.indexOf("]", themesStart)
  const themesContent = content.slice(themesStart, closingBracket)

  // Find all existing entries for alphabetical ordering
  const entryPattern = /\{\s*value:\s*"([\w-]+)"[^}]*\}/g
  const entries: Array<{ value: string; start: number; end: number }> = []
  let m: RegExpExecArray | null
  while ((m = entryPattern.exec(themesContent)) !== null) {
    entries.push({
      value: m[1],
      start: themesStart + m.index,
      end: themesStart + m.index + m[0].length,
    })
  }

  // Determine insert position
  let insertPos = closingBracket
  for (const e of entries) {
    if (slug < e.value) {
      insertPos = e.start
      break
    }
  }

  // Determine indentation from surrounding content
  const prevNewline = content.lastIndexOf("\n", insertPos)
  const lineContent = content.slice(prevNewline + 1, insertPos)
  const indentMatch = /^(\s*)/.exec(lineContent)
  const indent = indentMatch ? indentMatch[1] : "      "

  const newEntry = `{ value: "${slug}", label: "${label}" }`
  const insertion = entries.length === 0
    ? `\n${indent}${newEntry},\n    `
    : `${indent}${newEntry},\n`

  const updated = content.slice(0, insertPos) + insertion + content.slice(insertPos)
  return { updated, changed: true }
}

export function themeRegisterCommand(
  file: string,
  cwd: string,
  options: ThemeRegisterOptions,
): void {
  const filePath = resolve(cwd, file)
  let yamlContent: string

  try {
    yamlContent = readFileSync(filePath, "utf-8")
  } catch {
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: `Could not read file: ${filePath}` }))
    } else {
      logger.error(`Could not read file: ${filePath}`)
    }
    process.exit(2)
    return
  }

  let data: ReturnType<typeof generateThemeData>
  try {
    data = generateThemeData(yamlContent)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error parsing theme"
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: message }))
    } else {
      logger.error("Failed to parse theme.")
      logger.info(message)
    }
    process.exit(1)
    return
  }

  const slug = toSlug(data.config.name)
  const label = toLabel(data.config.name)

  const adapterInput = {
    primitives: data.primitives,
    tokens: data.tokens,
    config: data.config,
  }
  const css = docsAdapter(adapterInput)

  const repoRoot = findRepoRoot(cwd)
  if (!repoRoot) {
    const msg = "Could not locate repo root (packages/docs/ not found). Run from within the visor repo."
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: msg }))
    } else {
      logger.error(msg)
    }
    process.exit(1)
    return
  }

  const docsAppDir = join(repoRoot, "packages", "docs", "app")
  const cssFilePath = join(docsAppDir, `${slug}-theme.css`)
  const globalsPath = join(docsAppDir, "globals.css")
  const themeConfigPath = join(repoRoot, "packages", "docs", "lib", "theme-config.ts")

  if (!existsSync(docsAppDir)) {
    const msg = `Docs app directory not found: ${docsAppDir}`
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: msg }))
    } else {
      logger.error(msg)
    }
    process.exit(1)
    return
  }

  let globalsContent = ""
  let themeConfigContent = ""
  try {
    globalsContent = readFileSync(globalsPath, "utf-8")
    themeConfigContent = readFileSync(themeConfigPath, "utf-8")
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not read docs files"
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: msg }))
    } else {
      logger.error(msg)
    }
    process.exit(1)
    return
  }

  const cssExists = existsSync(cssFilePath)
  const cssChanged = !cssExists || readFileSync(cssFilePath, "utf-8") !== css

  const { updated: newGlobals, changed: globalsChanged } = insertGlobalsImport(globalsContent, slug)
  const { updated: newThemeConfig, changed: themeConfigChanged, error: configError } = insertThemeConfig(
    themeConfigContent, slug, label, options.group,
  )

  if (configError) {
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: configError }))
    } else {
      logger.error(configError)
    }
    process.exit(1)
    return
  }

  if (options.dryRun) {
    if (options.json) {
      console.log(JSON.stringify({
        success: true,
        dryRun: true,
        slug,
        label,
        group: options.group,
        changes: {
          cssFile: { path: cssFilePath, changed: cssChanged },
          globalsCSS: { path: globalsPath, changed: globalsChanged },
          themeConfig: { path: themeConfigPath, changed: themeConfigChanged },
        },
      }))
    } else {
      logger.info("Dry run — no files written")
      logger.item(`Theme: ${label} (${slug})`)
      logger.item(`Group: ${options.group}`)
      logger.item(`CSS file: ${cssFilePath} — ${cssChanged ? (cssExists ? "update" : "create") : "no change"}`)
      logger.item(`globals.css: ${globalsChanged ? "add import" : "already registered"}`)
      logger.item(`theme-config.ts: ${themeConfigChanged ? "add entry" : "already registered"}`)
    }
    return
  }

  try {
    if (cssChanged) {
      mkdirSync(docsAppDir, { recursive: true })
      writeFileSync(cssFilePath, css, "utf-8")
    }
    if (globalsChanged) {
      writeFileSync(globalsPath, newGlobals, "utf-8")
    }
    if (themeConfigChanged) {
      writeFileSync(themeConfigPath, newThemeConfig, "utf-8")
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Write failed"
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: msg }))
    } else {
      logger.error(msg)
    }
    process.exit(2)
    return
  }

  if (options.json) {
    console.log(JSON.stringify({
      success: true,
      slug,
      label,
      group: options.group,
      files: { css: cssFilePath, globals: globalsPath, themeConfig: themeConfigPath },
      changes: { cssFile: cssChanged, globalsCSS: globalsChanged, themeConfig: themeConfigChanged },
    }))
  } else {
    logger.success(`Theme registered: ${label} (${slug})`)
    logger.item(`Group: ${options.group}`)
    if (cssChanged) logger.item(`CSS: ${cssFilePath}`)
    if (globalsChanged) logger.item(`globals.css updated`)
    if (themeConfigChanged) logger.item(`theme-config.ts updated`)
    if (!cssChanged && !globalsChanged && !themeConfigChanged) {
      logger.info("Already registered — no changes needed.")
    }
  }
}
