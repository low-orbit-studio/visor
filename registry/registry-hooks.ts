import type { Registry } from "./schema"

export const hooks: Registry = [
  {
    name: "use-media-query",
    type: "registry:hook",
    description: "A hook to check if a CSS media query matches.",
    files: [
      {
        path: "hooks/use-media-query.ts",
        type: "registry:hook",
      },
    ],
  },
]
