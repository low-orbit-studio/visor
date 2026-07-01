/**
 * visor check theme-mode <path>
 *
 * Deterministic theme-mode GATE. Reads a theme's declared `color-scheme`
 * (`dark-only | light-only | adaptive`) and asserts that the app-root
 * background luminance matches the declared mode:
 *
 *   dark-only  → the rendered (dark) page background must be DARK
 *   light-only → the rendered (light) page background must be LIGHT
 *   adaptive   → skipped (no single correct mode to assert)
 *
 * This catches the failure class where a `dark-only` brand ships a white
 * (light) app root — the exact regression that oracle/freeze structural
 * gates cannot see, because they check structure, not rendered mode.
 *
 * The gate is fully deterministic and dependency-light: it reuses the theme
 * engine's own resolution (`generateThemeData`) to compute the host page
 * background the emitted CSS would carry (`--surface-page`), then reuses
 * `getLuminance()` — never reinventing luminance math or booting a browser.
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import {
  generateThemeData,
  parseColor,
  getLuminance,
} from "@loworbitstudio/visor-theme-engine"

// ─── Types ───────────────────────────────────────────────────────────────────

export type ColorScheme = "dark-only" | "light-only" | "adaptive"

export interface ThemeModeResult {
  /** true when the rendered mode matches the declared color-scheme (or skipped). */
  pass: boolean
  /** true when the theme is adaptive — no single mode to assert, gate is a no-op. */
  skipped: boolean
  /** the theme's declared color-scheme. */
  mode: ColorScheme
  /** the theme name, for reporting. */
  theme: string
  /**
   * the computed app-root (`--surface-page`) background color for the rendered
   * mode. On failure this is the offending color. null when skipped.
   */
  computed_bg: string | null
  /** WCAG relative luminance (0–1) of `computed_bg`. null when skipped. */
  luminance: number | null
  /** the luminance threshold used to classify dark vs. light. */
  threshold: number
  /** human-readable explanation of the pass/fail/skip decision. */
  reason: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * WCAG relative-luminance threshold splitting "dark" from "light" backgrounds.
 * A `dark-only` theme FAILS when its rendered background luminance is >= this
 * value (too light); a `light-only` theme FAILS when it is < this value (too
 * dark). Tunable — 0.2 comfortably separates near-black app roots from the
 * light/white roots that constitute the regression this gate guards against.
 */
export const LUMINANCE_THRESHOLD = 0.2

// ─── Core gate ────────────────────────────────────────────────────────────────

/**
 * Run the theme-mode gate against a `.visor.yaml` source string.
 * Throws only on unparseable theme input or an unresolvable background color;
 * a legitimate mismatch returns a result with `pass: false`.
 */
export function checkThemeModeSource(
  yamlSource: string,
  threshold: number = LUMINANCE_THRESHOLD
): ThemeModeResult {
  const data = generateThemeData(yamlSource)
  const mode = data.config["color-scheme"] as ColorScheme
  const theme = data.config.name

  // adaptive → no single declared mode; gate is a no-op.
  if (mode === "adaptive") {
    return {
      pass: true,
      skipped: true,
      mode,
      theme,
      computed_bg: null,
      luminance: null,
      threshold,
      reason: "adaptive theme — supports both modes, no single background to assert",
    }
  }

  // Resolve the host page background the emitted CSS carries for the rendered
  // mode. `--surface-page` is the app-root background (light → colors.background,
  // dark → colors-dark.background ?? neutral-950).
  const page = data.tokens.surface.page
  const computed_bg = mode === "dark-only" ? page.dark : page.light

  const parsed = parseColor(computed_bg)
  if (!parsed) {
    throw new Error(
      `Could not parse app-root background color "${computed_bg}" for theme "${theme}".`
    )
  }

  const luminance = getLuminance(parsed.rgb[0], parsed.rgb[1], parsed.rgb[2])

  const isDark = luminance < threshold
  const pass = mode === "dark-only" ? isDark : !isDark

  const declaredWord = mode === "dark-only" ? "dark" : "light"
  const actualWord = isDark ? "dark" : "light"
  const reason = pass
    ? `theme declares ${mode}; app-root background renders ${actualWord} (luminance ${luminance.toFixed(4)}) — matches`
    : `theme declares ${mode} but app-root background "${computed_bg}" renders ${actualWord} (luminance ${luminance.toFixed(4)}, threshold ${threshold}) — expected ${declaredWord}`

  return {
    pass,
    skipped: false,
    mode,
    theme,
    computed_bg,
    luminance,
    threshold,
    reason,
  }
}

/**
 * Run the theme-mode gate against a `.visor.yaml` file on disk.
 */
export function checkThemeModeFile(
  filePath: string,
  threshold: number = LUMINANCE_THRESHOLD
): ThemeModeResult {
  const abs = resolve(filePath)
  const source = readFileSync(abs, "utf-8")
  return checkThemeModeSource(source, threshold)
}
