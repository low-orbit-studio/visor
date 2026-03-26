import type { Registry } from "./schema"

export const visual: Registry = [
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
