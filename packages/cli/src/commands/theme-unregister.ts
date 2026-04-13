import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs"
import { join } from "path"
import { logger } from "../utils/logger.js"
import { findRepoRoot } from "../utils/theme-helpers.js"

export interface ThemeUnregisterOptions {
  json?: boolean
}

function removeGlobalsImport(content: string, slug: string): { updated: string; changed: boolean } {
  const importLine = `@import './${slug}-theme.css';`
  if (!content.includes(importLine)) {
    return { updated: content, changed: false }
  }
  const updated = content
    .split("\n")
    .filter((line) => line !== importLine)
    .join("\n")
  return { updated, changed: true }
}

function removeThemeConfigEntry(content: string, slug: string): { updated: string; changed: boolean } {
  if (!content.includes(`value: "${slug}"`)) {
    return { updated: content, changed: false }
  }
  // Remove the { value: "slug", label: "..." }, line (with optional trailing comma and newline)
  const entryPattern = new RegExp(
    `\\s*\\{\\s*value:\\s*"${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^}]*\\},?`,
    "g",
  )
  const updated = content.replace(entryPattern, "")
  return { updated, changed: true }
}

export function themeUnregisterCommand(
  slug: string,
  cwd: string,
  options: ThemeUnregisterOptions,
): void {
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
  const { updated: newGlobals, changed: globalsChanged } = removeGlobalsImport(globalsContent, slug)
  const { updated: newThemeConfig, changed: themeConfigChanged } = removeThemeConfigEntry(themeConfigContent, slug)

  if (!cssExists && !globalsChanged && !themeConfigChanged) {
    if (options.json) {
      console.log(JSON.stringify({ success: true, slug, changes: { cssFile: false, globalsCSS: false, themeConfig: false } }))
    } else {
      logger.info(`Theme "${slug}" is not registered — nothing to remove.`)
    }
    return
  }

  try {
    if (cssExists) unlinkSync(cssFilePath)
    if (globalsChanged) writeFileSync(globalsPath, newGlobals, "utf-8")
    if (themeConfigChanged) writeFileSync(themeConfigPath, newThemeConfig, "utf-8")
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
      changes: { cssFile: cssExists, globalsCSS: globalsChanged, themeConfig: themeConfigChanged },
    }))
  } else {
    logger.success(`Theme unregistered: ${slug}`)
    if (cssExists) logger.item(`CSS file removed: ${cssFilePath}`)
    if (globalsChanged) logger.item(`globals.css updated`)
    if (themeConfigChanged) logger.item(`theme-config.ts updated`)
  }
}
