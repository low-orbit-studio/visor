import type { Registry } from "./schema"

export const visual: Registry = [
  {
    name: "vignette",
    type: "registry:ui",
    category: "visual-elements",
    description:
      "Fixed, full-viewport radial vignette layer. Decorative atmosphere atom — pointer-events-none, aria-hidden, static. Ported from Blacklight bl-vignette (BL-326). Gradient stops and strength are configurable via CSS custom properties.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/visual/vignette/vignette.tsx",
        type: "registry:ui",
      },
      {
        path: "components/visual/vignette/vignette.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "ambient-glow",
    type: "registry:ui",
    category: "visual-elements",
    description:
      "Absolutely-positioned drifting radial glow with live CSS-var-driven color. Decorative only — aria-hidden, pointer-events-none. Keyed and gold variants. Ported from the Blacklight marketing depth system (BL-326).",
    dependencies: ["class-variance-authority", "@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/visual/ambient-glow/ambient-glow.tsx",
        type: "registry:ui",
      },
      {
        path: "components/visual/ambient-glow/ambient-glow.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "hero-glow",
    type: "registry:ui",
    category: "visual-elements",
    description:
      "Breathing radial glow band for hero media. Color is driven by a live CSS custom property (--glow-color) so the caller can rewrite it every rAF frame without triggering a React re-render.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/visual/hero-glow/hero-glow.tsx",
        type: "registry:ui",
      },
      {
        path: "components/visual/hero-glow/hero-glow.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "grain-overlay",
    type: "registry:ui",
    category: "visual-elements",
    description:
      "Fixed, full-viewport film-grain noise layer. Ported from Blacklight's bl-grain depth-system primitive. Decorative only — pointer-events-none, aria-hidden. No dependencies beyond visor-core.",
    dependencies: ["@loworbitstudio/visor-core"],
    files: [
      {
        path: "components/visual/grain-overlay/grain-overlay.tsx",
        type: "registry:ui",
      },
      {
        path: "components/visual/grain-overlay/grain-overlay.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "sphere",
    type: "registry:ui",
    category: "visual-elements",
    description:
      "GPU-accelerated particle sphere visualization with 256K particles, 6 geometry modes, 5 color schemes, and think-mode animation effects. Requires Three.js (~150KB gzipped).",
    dependencies: ["three", "@loworbitstudio/visor-core"],
    devDependencies: ["@types/three"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/visual/sphere/sphere.tsx",
        type: "registry:ui",
      },
      {
        path: "components/visual/sphere/sphere.types.ts",
        type: "registry:ui",
      },
      {
        path: "components/visual/sphere/sphere-shaders.ts",
        type: "registry:ui",
      },
      {
        path: "components/visual/sphere/sphere-geometries.ts",
        type: "registry:ui",
      },
      {
        path: "components/visual/sphere/sphere-particles.ts",
        type: "registry:ui",
      },
      {
        path: "components/visual/sphere/sphere-color.ts",
        type: "registry:ui",
      },
      {
        path: "components/visual/sphere/sphere.module.css",
        type: "registry:ui",
      },
    ],
  },
]
