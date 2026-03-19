import type { Registry } from "./schema"

export const ui: Registry = [
  {
    name: "button",
    type: "registry:ui",
    description:
      "A button component with multiple variants and sizes using CVA.",
    dependencies: ["class-variance-authority", "@loworbit/visor-tokens"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/button/button.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/button/button.module.css",
        type: "registry:ui",
      },
    ],
  },
]
