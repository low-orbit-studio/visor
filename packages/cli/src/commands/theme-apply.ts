import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { generateTheme } from "@loworbitstudio/visor-theme-engine"
import { logger } from "../utils/logger.js"

export interface ThemeApplyOptions {
  output?: string
  json?: boolean
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

  // Generate the theme CSS
  let output: ReturnType<typeof generateTheme>
  try {
    output = generateTheme(yamlContent)
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
  const outputPath = resolve(cwd, options.output ?? "visor-theme.css")
  const outputDir = dirname(outputPath)

  try {
    mkdirSync(outputDir, { recursive: true })
    writeFileSync(outputPath, output.fullBundleCss, "utf-8")
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
    console.log(
      JSON.stringify({
        success: true,
        file: outputPath,
        sections: {
          primitives: output.primitivesCss.length,
          semantic: output.semanticCss.length,
          light: output.lightCss.length,
          dark: output.darkCss.length,
          fullBundle: output.fullBundleCss.length,
        },
      })
    )
  } else {
    logger.success(`Theme CSS generated: ${outputPath}`)
    logger.blank()
    logger.info("Generated sections:")
    logger.item(`Primitives   ${formatSize(output.primitivesCss.length)}`)
    logger.item(`Semantic     ${formatSize(output.semanticCss.length)}`)
    logger.item(`Light mode   ${formatSize(output.lightCss.length)}`)
    logger.item(`Dark mode    ${formatSize(output.darkCss.length)}`)
    logger.item(`Full bundle  ${formatSize(output.fullBundleCss.length)}`)
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}
