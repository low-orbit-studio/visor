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
]
