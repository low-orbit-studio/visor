import { readFileSync } from "fs"
import { resolve } from "path"
import { parse as parseYaml } from "yaml"
import { validate } from "@loworbitstudio/visor-theme-engine"
import type { ThemeValidationResult, ValidationIssue } from "@loworbitstudio/visor-theme-engine"
import { logger } from "../utils/logger.js"
import pc from "picocolors"

export interface ThemeValidateOptions {
  json?: boolean
}

export function themeValidateCommand(
  file: string,
  cwd: string,
  options: ThemeValidateOptions
): void {
  // Read the file
  const filePath = resolve(cwd, file)
  let fileContent: string

  try {
    fileContent = readFileSync(filePath, "utf-8")
  } catch {
    if (options.json) {
      console.log(
        JSON.stringify({
          valid: false,
          errors: [
            {
              severity: "error",
              code: "FILE_NOT_FOUND",
              message: `Could not read file: ${filePath}`,
            },
          ],
          warnings: [],
        })
      )
    } else {
      logger.error(`Could not read file: ${filePath}`)
      logger.info("Make sure the file exists and is readable.")
    }
    process.exit(2)
  }

  // Parse YAML
  let parsed: unknown
  try {
    parsed = parseYaml(fileContent)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid YAML syntax"
    if (options.json) {
      console.log(
        JSON.stringify({
          valid: false,
          errors: [
            {
              severity: "error",
              code: "YAML_PARSE_ERROR",
              message,
            },
          ],
          warnings: [],
        })
      )
    } else {
      logger.error("Invalid YAML syntax.")
      logger.info(message)
    }
    process.exit(1)
  }

  // Run validation
  const result: ThemeValidationResult = validate(parsed)

  if (options.json) {
    console.log(JSON.stringify(result))
    process.exit(result.valid ? 0 : 1)
  }

  // Human-readable output
  if (result.valid && result.warnings.length === 0) {
    logger.success("Theme is valid. No issues found.")
    process.exit(0)
  }

  if (result.valid) {
    logger.success("Theme is valid.")
    logger.blank()
  }

  if (result.errors.length > 0) {
    logger.heading(`${result.errors.length} error(s):`)
    for (const err of result.errors) {
      printIssue(err)
    }
    logger.blank()
  }

  if (result.warnings.length > 0) {
    logger.heading(`${result.warnings.length} warning(s):`)
    for (const warn of result.warnings) {
      printIssue(warn)
    }
    logger.blank()
  }

  if (!result.valid) {
    logger.error("Validation failed. Fix the errors above before applying this theme.")
    process.exit(1)
  }
}

function printIssue(issue: ValidationIssue): void {
  const prefix =
    issue.severity === "error" ? pc.red("  ERROR") : pc.yellow("  WARN ")
  const code = pc.dim(`[${issue.code}]`)
  const path = issue.path ? pc.dim(` (${issue.path})`) : ""
  console.log(`${prefix} ${code} ${issue.message}${path}`)
}
