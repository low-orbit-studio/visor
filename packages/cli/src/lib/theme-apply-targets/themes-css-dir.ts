import { mkdirSync, writeFileSync } from "fs"
import { isAbsolute, join, resolve } from "path"

export interface ApplyThemesCssDirInput {
  buildDir: string
  adapterCss: string
  themeId: string
  /**
   * Build-root-relative directory that holds one CSS file per registered
   * theme. The nextjs-adapter output is written to `<path>/<themeId>.css`.
   * Matches organization-management's actual swap pattern where `layout.tsx`
   * inlines every registered theme as a scoped `<style data-theme-css>` block.
   */
  path: string
}

/**
 * Write nextjs-adapter CSS to `<buildDir>/<path>/<themeId>.css`, creating the
 * target directory if it doesn't exist. Returns the absolute path written.
 */
export function applyThemesCssDir(input: ApplyThemesCssDirInput): string {
  const dir = isAbsolute(input.path)
    ? input.path
    : resolve(input.buildDir, input.path)
  const outFile = join(dir, `${input.themeId}.css`)

  mkdirSync(dir, { recursive: true })
  writeFileSync(outFile, input.adapterCss, "utf-8")
  return outFile
}
