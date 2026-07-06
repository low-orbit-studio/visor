import { existsSync, mkdirSync, writeFileSync } from "fs"
import { dirname, isAbsolute, join, resolve } from "path"

export interface ApplyGlobalsCssInput {
  buildDir: string
  adapterCss: string
  /**
   * Build-root-relative destination file. When omitted, prefers an existing
   * `app/globals.css` (or `src/app/globals.css`), else falls back to
   * `app/globals.css`. This mirrors the pre-VI-601 behavior in
   * `spawn.ts::resolveGlobalsCssPath` so existing builds behave identically.
   */
  path?: string
}

/**
 * Write nextjs-adapter CSS to a single file in the build tree. Returns the
 * absolute path of the file that was written.
 */
export function applyGlobalsCss(input: ApplyGlobalsCssInput): string {
  const outFile =
    input.path !== undefined
      ? resolveInsideBuild(input.buildDir, input.path)
      : resolveDefaultGlobalsCss(input.buildDir)

  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, input.adapterCss, "utf-8")
  return outFile
}

function resolveDefaultGlobalsCss(buildDir: string): string {
  const candidates = [
    join(buildDir, "app", "globals.css"),
    join(buildDir, "src", "app", "globals.css"),
  ]
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0]
}

function resolveInsideBuild(buildDir: string, relativeOrAbsolute: string): string {
  return isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : resolve(buildDir, relativeOrAbsolute)
}
