import type { Registry } from "./schema"

export const blocks: Registry = [
  {
    name: "login-form-placeholder",
    type: "registry:block",
    category: "authentication",
    description:
      "A minimal placeholder login form block demonstrating the blocks pipeline. Replace with a full implementation.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "blocks/login-form-placeholder/login-form-placeholder.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/login-form-placeholder/login-form-placeholder.module.css",
        type: "registry:block",
      },
    ],
  },
]
