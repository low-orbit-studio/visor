/**
 * Vertical font metrics for centring a native <input>'s text (VI-684).
 *
 * A native input cannot be trimmed to its capital band without clipping
 * descenders and accents, so its capitals sit wherever the font's line box puts
 * them: half a line above the box centre plus (ascent - descent) / 2, each
 * rounded to a whole px. That depends on the face, so input.module.css reads
 * `--font-ascent` / `--font-descent` (unitless em ratios) to work out the
 * padding that lands the baseline on the right pixel.
 *
 * The ratios are Chromium's own `fontBoundingBoxAscent` / `Descent` at 1000px
 * (what its line layout rounds), measured once from the real faces by
 * scripts/measure-font-metrics.mjs and committed here. Measuring at build time
 * would put a network fetch and a font parser on every theme build.
 *
 * A face with no entry emits no tokens, and the input takes no nudge: it renders
 * as it did before VI-684 (within about 1px of centre), never worse.
 *
 * `system-ui` is platform-dependent. The entry is what Chromium resolves on
 * macOS (San Francisco). Windows and Linux resolve another face, so the nudge
 * there is a best effort; override it with --font-ascent / --font-descent.
 */

export interface FontVerticalMetrics {
  /** Ascent as a fraction of the font size. */
  ascent: number
  /** Descent as a fraction of the font size. */
  descent: number
}

export const FONT_VERTICAL_METRICS: Record<string, FontVerticalMetrics> = {
  arial: { ascent: 0.905, descent: 0.212 },
  inter: { ascent: 0.969, descent: 0.241 },
  outfit: { ascent: 1, descent: 0.26 },
  "pitch sans": { ascent: 0.9, descent: 0.32 },
  "pp model mono": { ascent: 1.02, descent: 0.288 },
  "product sans": { ascent: 0.96, descent: 0.253 },
  satoshi: { ascent: 1.01, descent: 0.24 },
  "system-ui": { ascent: 0.967, descent: 0.211 },
}

/** The `--font-ascent` / `--font-descent` declarations for a body family, or none when the face is unmeasured. */
export function generateFontMetricDecls(family: string): string[] {
  const key = family.trim().replace(/^["']|["']$/g, "").toLowerCase()
  const m = FONT_VERTICAL_METRICS[key]
  return m ? [`--font-ascent: ${m.ascent};`, `--font-descent: ${m.descent};`] : []
}
