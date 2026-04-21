import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { resolve, dirname, join } from "path"
import { generateTheme, generateThemeData } from "@loworbitstudio/visor-theme-engine"
import {
  nextjsAdapter,
  fumadocsAdapter,
  deckAdapter,
  docsAdapter,
  flutterAdapter,
} from "@loworbitstudio/visor-theme-engine/adapters"
import type {
  AdapterFileMap,
  AdapterName,
  FlutterAdapterOptions,
} from "@loworbitstudio/visor-theme-engine/adapters"
import { logger } from "../utils/logger.js"

export interface ThemeApplyOptions {
  output?: string
  json?: boolean
  adapter?: AdapterName
  /** Flutter adapter: package name. */
  packageName?: string
  /** Flutter adapter: skip scaffolding, emit only token files. */
  tokensOnly?: boolean
  /** Flutter adapter: emit only light-brightness getter. */
  lightOnly?: boolean
  /** Flutter adapter: emit only dark-brightness getter. */
  darkOnly?: boolean
  /** Flutter adapter: generated theme class name. */
  themeClassName?: string
}

/** Default output path per adapter. Directory for flutter; file otherwise. */
function defaultOutputPath(adapter: AdapterName | undefined, themeName?: string): string {
  switch (adapter) {
    case "nextjs":
      return "globals.css"
    case "fumadocs":
      return "visor-fumadocs-bridge.css"
    case "deck": {
      const slug = (themeName ?? "theme").toLowerCase().replace(/\s+/g, "-")
      return `visor-deck-${slug}.css`
    }
    case "docs": {
      const slug = (themeName ?? "theme").toLowerCase().replace(/\s+/g, "-")
      return `${slug}-theme.css`
    }
    case "flutter":
      return "packages/ui"
    default:
      return "visor-theme.css"
  }
}

export function themeApplyCommand(
  file: string,
  cwd: string,
  options: ThemeApplyOptions
): void {
  // Read the .visor.yaml file
  const filePath = resolve(cwd, file)
  let yamlContent: string

  try {
    yamlContent = readFileSync(filePath, "utf-8")
  } catch {
    if (options.json) {
      console.log(
        JSON.stringify({
          success: false,
          error: `Could not read file: ${filePath}`,
        })
      )
    } else {
      logger.error(`Could not read file: ${filePath}`)
      logger.info("Make sure the file exists and is readable.")
    }
    process.exit(2)
  }

  // Generate the theme
  let css: string | null = null
  let fileMap: AdapterFileMap | null = null
  let themeName: string | undefined
  let sections: Record<string, number> | undefined

  try {
    if (options.adapter) {
      const data = generateThemeData(yamlContent)
      themeName = data.config.name

      const adapterInput = {
        primitives: data.primitives,
        tokens: data.tokens,
        config: data.config,
      }

      switch (options.adapter) {
        case "nextjs":
          css = nextjsAdapter(adapterInput)
          break
        case "fumadocs":
          css = fumadocsAdapter(adapterInput)
          break
        case "deck":
          css = deckAdapter(adapterInput)
          break
        case "docs":
          css = docsAdapter(adapterInput)
          break
        case "flutter": {
          const flutterOptions: FlutterAdapterOptions = {
            packageName: options.packageName,
            tokensOnly: options.tokensOnly,
            lightOnly: options.lightOnly,
            darkOnly: options.darkOnly,
            themeClassName: options.themeClassName,
          }
          fileMap = flutterAdapter(adapterInput, flutterOptions)
          break
        }
        default:
          throw new Error(`Unknown adapter: ${options.adapter}`)
      }
    } else {
      const output = generateTheme(yamlContent)
      css = output.fullBundleCss
      sections = {
        primitives: output.primitivesCss.length,
        semantic: output.semanticCss.length,
        light: output.lightCss.length,
        dark: output.darkCss.length,
        fullBundle: output.fullBundleCss.length,
      }
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error generating theme"
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: message }))
    } else {
      logger.error("Failed to generate theme.")
      logger.info(message)
    }
    process.exit(1)
  }

  // Write the output
  const outputTarget = options.output ?? defaultOutputPath(options.adapter, themeName)
  const outputPath = resolve(cwd, outputTarget)

  // File-map adapters (flutter) write a directory tree.
  if (fileMap) {
    try {
      mkdirSync(outputPath, { recursive: true })
      let totalBytes = 0
      for (const [relPath, content] of Object.entries(fileMap.files)) {
        const filePath = join(outputPath, relPath)
        mkdirSync(dirname(filePath), { recursive: true })
        writeFileSync(filePath, content, "utf-8")
        totalBytes += content.length
      }

      if (options.json) {
        console.log(
          JSON.stringify({
            success: true,
            directory: outputPath,
            adapter: options.adapter,
            files: Object.keys(fileMap.files),
            size: totalBytes,
          })
        )
      } else {
        logger.success(`Flutter theme package generated: ${outputPath}`)
        logger.info(`Adapter: ${options.adapter}`)
        logger.item(`Files: ${Object.keys(fileMap.files).length}`)
        logger.item(`Size: ${formatSize(totalBytes)}`)
      }
    } catch {
      if (options.json) {
        console.log(
          JSON.stringify({
            success: false,
            error: `Could not write package to: ${outputPath}`,
          })
        )
      } else {
        logger.error(`Could not write package to: ${outputPath}`)
      }
      process.exit(2)
    }
    return
  }

  // Single-file adapters write one file.
  if (css === null) {
    // Unreachable — either fileMap or css is set.
    process.exit(1)
  }
  const outputDir = dirname(outputPath)
  try {
    mkdirSync(outputDir, { recursive: true })
    writeFileSync(outputPath, css, "utf-8")
  } catch {
    if (options.json) {
      console.log(
        JSON.stringify({
          success: false,
          error: `Could not write to: ${outputPath}`,
        })
      )
    } else {
      logger.error(`Could not write to: ${outputPath}`)
    }
    process.exit(2)
  }

  if (options.json) {
    const jsonResult: Record<string, unknown> = {
      success: true,
      file: outputPath,
    }
    if (options.adapter) {
      jsonResult.adapter = options.adapter
      jsonResult.size = css.length
    }
    if (sections) {
      jsonResult.sections = sections
    }
    console.log(JSON.stringify(jsonResult))
  } else {
    logger.success(`Theme CSS generated: ${outputPath}`)
    if (options.adapter) {
      logger.info(`Adapter: ${options.adapter}`)
    }
    logger.item(`Size: ${formatSize(css.length)}`)
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}
