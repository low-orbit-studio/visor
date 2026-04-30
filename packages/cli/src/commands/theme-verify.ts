import { spawnSync as _spawnSync } from "child_process"
import { existsSync } from "fs"
import { resolve } from "path"
import { findFlutterBin } from "../utils/flutter.js"
import { logger } from "../utils/logger.js"

export interface ThemeVerifyOptions {
  target?: string
  json?: boolean
}

// _spawnFn is injectable for testing; defaults to the real spawnSync
export function themeVerifyCommand(
  dir: string,
  cwd: string,
  options: ThemeVerifyOptions,
  _spawnFn: typeof _spawnSync = _spawnSync
): void {
  const target = options.target ?? "flutter"

  if (target !== "flutter") {
    if (options.json) {
      console.log(
        JSON.stringify({
          valid: false,
          target,
          errors: [
            {
              code: "UNSUPPORTED_TARGET",
              message: `Unsupported target: "${target}". Only "flutter" is supported.`,
            },
          ],
        })
      )
    } else {
      logger.error(`Unsupported target: "${target}". Only "flutter" is supported.`)
    }
    process.exit(1)
  }

  const dirPath = resolve(cwd, dir)

  if (!existsSync(dirPath)) {
    if (options.json) {
      console.log(
        JSON.stringify({
          valid: false,
          target,
          dir: dirPath,
          errors: [
            {
              code: "DIR_NOT_FOUND",
              message: `Directory not found: ${dirPath}`,
            },
          ],
        })
      )
    } else {
      logger.error(`Directory not found: ${dirPath}`)
      logger.info("Make sure the path exists and is readable.")
    }
    process.exit(1)
  }

  // Resolve Flutter binary
  const flutterBin = findFlutterBin()

  if (!flutterBin) {
    if (options.json) {
      console.log(
        JSON.stringify({
          valid: false,
          target,
          dir: dirPath,
          errors: [
            {
              code: "FLUTTER_NOT_FOUND",
              message:
                "Flutter binary not found. Set FLUTTER_ROOT, add flutter to PATH, or install via FVM.",
            },
          ],
        })
      )
    } else {
      logger.error("Flutter binary not found.")
      logger.info(
        "Set FLUTTER_ROOT, add flutter to PATH, or install via FVM."
      )
    }
    process.exit(1)
  }

  if (!options.json) {
    logger.info(`Verifying Flutter output at: ${dirPath}`)
    logger.item(`Using Flutter binary: ${flutterBin}`)
  }

  // Run dart analyze via flutter
  const result = _spawnFn(flutterBin, ["analyze", "--no-pub"], {
    cwd: dirPath,
    stdio: options.json ? "pipe" : "inherit",
    encoding: "utf-8",
  })

  if (options.json) {
    const stdout = (result.stdout ?? "").toString()
    const stderr = (result.stderr ?? "").toString()
    const success = result.status === 0

    console.log(
      JSON.stringify({
        valid: success,
        target,
        dir: dirPath,
        exitCode: result.status,
        stdout: stdout.trim() || undefined,
        stderr: stderr.trim() || undefined,
        errors: success
          ? []
          : [
              {
                code: "DART_ANALYZE_FAILED",
                message: stderr.trim() || stdout.trim() || "dart analyze reported errors",
              },
            ],
      })
    )
    process.exit(success ? 0 : 1)
  }

  if (result.status === 0) {
    logger.success("Flutter output is clean — dart analyze passed.")
    process.exit(0)
  } else {
    logger.error("dart analyze reported errors in the generated output.")
    logger.info("Fix the errors above, then re-run: visor theme apply --target flutter")
    process.exit(1)
  }
}
