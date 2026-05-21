import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { join } from "path"
import type { HandoffManifest, ScreenEntry } from "./parse-handoff.js"
import { stripDocumentaryChrome } from "./strip-chrome.js"

export interface PrototypeImport {
  /** Absolute path to the prototype source directory. */
  sourceDir: string
  /** Sandbox-relative path to the destination (always `public/prototype/`). */
  destDir: string
  /** Names of files copied (sandbox-relative). */
  copiedFiles: string[]
  /**
   * Screen-slug → prototype HTML filename, in the order screens appear in the
   * manifest (including any auto-discovered state-coverage screens). Used by
   * the screen route template to render an iframe.
   */
  screenMap: Record<string, string>
  /** State-coverage screens auto-discovered from the prototype dir (slugs only). */
  stateCoverageScreens: string[]
  /**
   * If non-empty, every `.html` file copied into `public/prototype/` had
   * elements matching these CSS-ish selectors stripped before being written.
   * See `strip-chrome.ts` for the supported selector grammar.
   */
  stripChromeSelectors: string[]
  warnings: string[]
}

export interface CopyHtmlPrototypeOptions {
  /**
   * Selector list to strip from each `.html` file before it lands in
   * `public/prototype/`. Resolve via `resolveStripSelectors()` in `strip-chrome.ts`
   * so the `--strip-chrome` / `--strip-chrome-additional` flag semantics stay
   * encapsulated.
   */
  stripChromeSelectors?: string[]
}

const SCREEN_FILE_PATTERN = /^screen-(\d+)-([^/.]+)\.html$/i

/**
 * Copy a Phase 1.5 HTML prototype tree into the sandbox's `public/prototype/`
 * directory and pair each manifest screen with a numerically-ordered
 * `screen-N-*.html` source file. Any extra `screen-N-*.html` files beyond
 * the manifest's named-screen count are appended to the manifest as
 * `state-coverage` screens (powering the Phase 4 state-coverage diff gate).
 * Returns metadata that the scaffold step uses to generate iframe-loading
 * screen routes.
 */
export function copyHtmlPrototype(
  sourceDir: string,
  sandboxDir: string,
  manifest: HandoffManifest,
  options: CopyHtmlPrototypeOptions = {}
): PrototypeImport {
  const warnings: string[] = []
  const destAbs = join(sandboxDir, "public", "prototype")
  mkdirSync(destAbs, { recursive: true })

  const stripChromeSelectors = options.stripChromeSelectors ?? []
  const copiedFiles = copyTreeRelative(sourceDir, destAbs, "", stripChromeSelectors)
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

  const stateCoverageScreens: string[] = []
  if (screenFiles.length > manifest.screens.length) {
    const extras = screenFiles.slice(manifest.screens.length)
    const existingNames = new Set(manifest.screens.map((s) => s.name))
    for (const file of extras) {
      const entry = deriveStateCoverageScreen(file, existingNames)
      manifest.screens.push(entry)
      existingNames.add(entry.name)
      screenMap[entry.name] = file
      stateCoverageScreens.push(entry.name)
    }
  }

  return {
    sourceDir,
    destDir: "public/prototype",
    copiedFiles,
    screenMap,
    stateCoverageScreens,
    stripChromeSelectors,
    warnings,
  }
}

/**
 * Derive a sandbox screen entry for a `screen-N-*.html` file that has no
 * matching named-screen in the manifest. Uses the filename suffix as the
 * source of the slug — `screen-5-menus.html` → `state-coverage-menus`,
 * `screen-7-edge-states.html` → `state-coverage-edge-states`. If the derived
 * slug collides with an existing screen, the numeric prefix is appended.
 */
function deriveStateCoverageScreen(
  file: string,
  existingNames: Set<string>
): ScreenEntry {
  const m = file.match(SCREEN_FILE_PATTERN)
  const idx = m ? m[1] : "0"
  const suffix = m ? m[2].toLowerCase() : "extra"
  let slug = `state-coverage-${suffix}`
  if (existingNames.has(slug)) slug = `${slug}-${idx}`
  const title = `State coverage: ${suffix.replace(/-/g, " ")}`
  return { name: slug, title, kind: "state-coverage" }
}

function copyTreeRelative(
  srcDir: string,
  destDir: string,
  relDir = "",
  stripChromeSelectors: string[] = []
): string[] {
  const out: string[] = []
  const entries = readdirSync(join(srcDir, relDir))
  for (const name of entries) {
    if (name.startsWith(".")) continue
    const srcPath = join(srcDir, relDir, name)
    const destPath = join(destDir, relDir, name)
    const stat = statSync(srcPath)
    if (stat.isDirectory()) {
      mkdirSync(destPath, { recursive: true })
      out.push(...copyTreeRelative(srcDir, destDir, join(relDir, name), stripChromeSelectors))
    } else if (stat.isFile()) {
      if (stripChromeSelectors.length > 0 && name.toLowerCase().endsWith(".html")) {
        const html = readFileSync(srcPath, "utf-8")
        const stripped = stripDocumentaryChrome(html, stripChromeSelectors)
        writeFileSync(destPath, stripped)
      } else {
        writeFileSync(destPath, readFileSync(srcPath))
      }
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

