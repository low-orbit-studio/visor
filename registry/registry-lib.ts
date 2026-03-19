import type { Registry } from "./schema"

export const lib: Registry = [
  {
    name: "utils",
    type: "registry:lib",
    description:
      "Utility function for merging class names with tailwind-merge and clsx.",
    dependencies: ["clsx", "tailwind-merge"],
    files: [
      {
        path: "lib/utils.ts",
        type: "registry:lib",
      },
    ],
  },
]
