import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { join } from "path"
import type { HandoffManifest } from "./parse-handoff.js"

export interface PrototypeImport {
  /** Absolute path to the prototype source directory. */
  sourceDir: string
  /** Sandbox-relative path to the destination (always `public/prototype/`). */
  destDir: string
  /** Names of files copied (sandbox-relative). */
  copiedFiles: string[]
  /**
   * Screen-slug → prototype HTML filename, in the order screens appear in the
   * manifest. Used by the screen route template to render an iframe.
   */
  screenMap: Record<string, string>
  warnings: string[]
}

const SCREEN_FILE_PATTERN = /^screen-(\d+)-[^/]*\.html$/i

/**
 * Copy a Phase 1.5 HTML prototype tree into the sandbox's `public/prototype/`
 * directory and pair each manifest screen with a numerically-ordered
 * `screen-N-*.html` source file. Returns metadata that the scaffold step uses
 * to generate iframe-loading screen routes.
 */
export function copyHtmlPrototype(
  sourceDir: string,
  sandboxDir: string,
  manifest: HandoffManifest
): PrototypeImport {
  const warnings: string[] = []
  const destAbs = join(sandboxDir, "public", "prototype")
  mkdirSync(destAbs, { recursive: true })

  const copiedFiles = copyTreeRelative(sourceDir, destAbs)
  const screenFiles = listOrderedScreenFiles(sourceDir)

  if (screenFiles.length === 0) {
    warnings.push(
      `HTML prototype at ${sourceDir} has no 'screen-N-*.html' files — screen routes will fall back to placeholder.`
    )
  }

  const screenMap: Record<string, string> = {}
  manifest.screens.forEach((screen, idx) => {
    const file = screenFiles[idx]
    if (file) {
      screenMap[screen.name] = file
    } else {
      warnings.push(
        `Manifest screen '${screen.name}' has no matching prototype HTML at position ${idx + 1} — route will use placeholder.`
      )
    }
  })

  if (screenFiles.length > manifest.screens.length) {
    const extras = screenFiles.slice(manifest.screens.length).join(", ")
    warnings.push(
      `Prototype has ${screenFiles.length} screens but manifest declares ${manifest.screens.length} — these files are copied to public/prototype but unrouted: ${extras}`
    )
  }

  return {
    sourceDir,
    destDir: "public/prototype",
    copiedFiles,
    screenMap,
    warnings,
  }
}

function copyTreeRelative(srcDir: string, destDir: string, relDir = ""): string[] {
  const out: string[] = []
  const entries = readdirSync(join(srcDir, relDir))
  for (const name of entries) {
    if (name.startsWith(".")) continue
    const srcPath = join(srcDir, relDir, name)
    const destPath = join(destDir, relDir, name)
    const stat = statSync(srcPath)
    if (stat.isDirectory()) {
      mkdirSync(destPath, { recursive: true })
      out.push(...copyTreeRelative(srcDir, destDir, join(relDir, name)))
    } else if (stat.isFile()) {
      writeFileSync(destPath, readFileSync(srcPath))
      out.push(join("public", "prototype", relDir, name).replace(/\\/g, "/"))
    }
  }
  return out
}

function listOrderedScreenFiles(srcDir: string): string[] {
  const names = readdirSync(srcDir).filter((n) => SCREEN_FILE_PATTERN.test(n))
  names.sort((a, b) => {
    const na = Number(a.match(SCREEN_FILE_PATTERN)?.[1] ?? 0)
    const nb = Number(b.match(SCREEN_FILE_PATTERN)?.[1] ?? 0)
    return na - nb
  })
  return names
}

