import type { BlessedManifest, ThemeApplyTarget } from "../blessed-manifest.js"
import { applyGlobalsCss } from "./globals-css.js"
import { applyThemesCssDir } from "./themes-css-dir.js"

/**
 * Where `visor spawn` / `visor theme apply --target-path` writes the
 * nextjs-adapter CSS for a blessed build, per the build's `theme_apply_target`
 * (VI-601). Manifests without the field fall back to `globals-css` at
 * `app/globals.css` — the pre-VI-601 default — so existing builds stay behind
 * a backward-compatible shim.
 */
export interface ApplyThemeToBuildInput {
  /** The blessed build's parsed manifest. */
  manifest: BlessedManifest
  /** Absolute path to the build root (fork destination for spawn; existing tree for standalone). */
  buildDir: string
  /** Theme id used to name the target file for kinds that emit per-theme files. */
  themeId: string
  /** The nextjs-adapter CSS to write. */
  adapterCss: string
}

export interface ApplyThemeToBuildResult {
  /** Absolute path of the file that was written. */
  writtenPath: string
  /** The resolved (or implicit) target used for the dispatch. */
  target: ThemeApplyTarget
}

const IMPLICIT_TARGET: ThemeApplyTarget = { kind: "globals-css" }

/**
 * Dispatch the applied theme CSS to the build's declared swap point. Unknown
 * kinds and malformed inputs error clearly with a docs pointer rather than
 * silently falling back — silent fallback would mask misconfigured manifests
 * (D6).
 */
export function applyThemeToBuild(
  input: ApplyThemeToBuildInput
): ApplyThemeToBuildResult {
  const target = input.manifest.theme_apply_target ?? IMPLICIT_TARGET

  switch (target.kind) {
    case "globals-css": {
      const writtenPath = applyGlobalsCss({
        buildDir: input.buildDir,
        adapterCss: input.adapterCss,
        path: target.path,
      })
      return { writtenPath, target }
    }
    case "themes-css-dir": {
      if (!input.themeId || input.themeId.length === 0) {
        throw new Error(
          `theme_apply_target kind 'themes-css-dir' requires a theme id (used to name the emitted file); see docs/blessed-builds.md`
        )
      }
      const writtenPath = applyThemesCssDir({
        buildDir: input.buildDir,
        adapterCss: input.adapterCss,
        themeId: input.themeId,
        path: target.path,
      })
      return { writtenPath, target }
    }
    default: {
      const unknown = (target as { kind: string }).kind
      throw new Error(
        `Unknown theme_apply_target kind: '${unknown}'. Supported: 'globals-css', 'themes-css-dir'. See docs/blessed-builds.md.`
      )
    }
  }
}
