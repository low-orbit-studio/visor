import { FONT_VERTICAL_METRICS } from "../../../packages/theme-engine/src/font-metrics"
import type { MeasureOptions } from "./ink-centering"

/** A face to measure against: a theme's real CSS plus any extra @font-face and token overrides. */
export interface FontScenario { name: string; theme: string; extraCss: string }

const CDN = "https://fonts.visor.design/low-orbit-studio"
const GSTATIC = "https://fonts.gstatic.com/s"

/** The body-font scope for a face loaded by a fixture @font-face, with the vertical metrics the engine would publish for it (VI-684). */
const fixture = (family: string, metricsKey: string, faces: string): string => {
  const m = FONT_VERTICAL_METRICS[metricsKey]
  return `${faces}
#theme-scope { --font-body: "${family} [fixture]", sans-serif; --font-sans: "${family} [fixture]", sans-serif; --font-ascent: ${m.ascent}; --font-descent: ${m.descent}; }`
}
const face = (family: string, url: string, weight: number, format: string) =>
  `@font-face { font-family: "${family} [fixture]"; src: url("${url}") format("${format}"); font-weight: ${weight}; font-display: block; }`

/**
 * Every body face a shipped theme uses (VI-684): Inter, Outfit, Pitch Sans, PP Model Mono, Product Sans,
 * Satoshi and system-ui, plus Arial. Product Sans, Satoshi and system-ui run on their real theme CSS
 * (modern-minimal, blackout, neutral); the rest load their real font files into the neutral theme.
 */
export const FONT_SCENARIOS: FontScenario[] = [
  { name: "Arial (system)", theme: "neutral", extraCss: `#theme-scope { --font-body: Arial; --font-sans: Arial; --font-ascent: ${FONT_VERTICAL_METRICS.arial.ascent}; --font-descent: ${FONT_VERTICAL_METRICS.arial.descent}; }` },
  { name: "system-ui (neutral)", theme: "neutral", extraCss: "" },
  { name: "Satoshi (blackout)", theme: "blackout", extraCss: "" },
  { name: "Product Sans (modern-minimal)", theme: "modern-minimal", extraCss: "" },
  {
    name: "PP Model Mono (fonts.visor.design)",
    theme: "neutral",
    extraCss: fixture("PP Model Mono", "pp model mono", `${face("PP Model Mono", `${CDN}/pp-model-mono/PPModelMono-Medium.woff2`, 500, "woff2")}
${face("PP Model Mono", `${CDN}/pp-model-mono/PPModelMono-Book.woff2`, 400, "woff2")}`),
  },
  { name: "Pitch Sans (fonts.visor.design)", theme: "neutral", extraCss: fixture("Pitch Sans", "pitch sans", face("Pitch Sans", `${CDN}/pitch-sans/PitchSans-Regular.woff2`, 400, "woff2")) },
  { name: "Inter (Google Fonts)", theme: "neutral", extraCss: fixture("Inter", "inter", face("Inter", `${GSTATIC}/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf`, 400, "truetype")) },
  { name: "Outfit (Google Fonts)", theme: "neutral", extraCss: fixture("Outfit", "outfit", face("Outfit", `${GSTATIC}/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1C4E.ttf`, 400, "truetype")) },
]

export const withScenario = (s: FontScenario, o: Pick<MeasureOptions, "modules" | "cases">): MeasureOptions =>
  ({ theme: s.theme, extraCss: s.extraCss, ...o })
