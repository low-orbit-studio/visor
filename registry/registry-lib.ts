import type { Registry } from "./schema"

export const lib: Registry = [
  {
    name: "utils",
    type: "registry:lib",
    description:
      "Utility function for merging class names with clsx.",
    dependencies: ["clsx"],
    files: [
      {
        path: "lib/utils.ts",
        type: "registry:lib",
      },
    ],
  },
  {
    name: "deck-registry",
    type: "registry:lib",
    category: "deck",
    description:
      "Types and utility functions for declarative deck registries (DeckRegistry, SlideEntry, DeckSection).",
    files: [
      {
        path: "lib/deck-registry.ts",
        type: "registry:lib",
      },
    ],
  },
  {
    name: "password-managers-context",
    type: "registry:lib",
    description:
      "React context that lets Form set a passwordManagers default for descendant Input and Textarea fields.",
    files: [
      {
        path: "lib/password-managers-context.tsx",
        type: "registry:lib",
      },
    ],
  },
]
