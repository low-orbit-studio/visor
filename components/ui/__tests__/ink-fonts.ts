import type { MeasureOptions } from "./ink-centering"

/** The three faces VI-682 is measured against. */
export interface FontScenario { name: string; theme: string; extraCss: string }

const CDN = "https://fonts.visor.design/low-orbit-studio"

export const FONT_SCENARIOS: FontScenario[] = [
  { name: "Arial (system)", theme: "neutral", extraCss: `#theme-scope { --font-body: Arial; }` },
  { name: "Product Sans (modern-minimal)", theme: "modern-minimal", extraCss: "" },
  {
    name: "PP Model Mono (fonts.visor.design)",
    theme: "neutral",
    extraCss: `
@font-face { font-family: "PP Model Mono [fixture]"; src: url("${CDN}/pp-model-mono/PPModelMono-Medium.woff2") format("woff2"); font-weight: 500; font-display: block; }
@font-face { font-family: "PP Model Mono [fixture]"; src: url("${CDN}/pp-model-mono/PPModelMono-Book.woff2") format("woff2"); font-weight: 400; font-display: block; }
#theme-scope { --font-body: "PP Model Mono [fixture]", monospace; }`,
  },
]

export const withScenario = (s: FontScenario, o: Pick<MeasureOptions, "modules" | "cases">): MeasureOptions =>
  ({ theme: s.theme, extraCss: s.extraCss, ...o })
