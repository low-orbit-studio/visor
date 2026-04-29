import type { Registry } from "./schema"

export const devtools: Registry = [
  {
    name: "source-inspector",
    type: "registry:devtool",
    category: "devtools",
    description:
      "Borealis pre-flight x-ray overlay. Walks the React Fiber tree, classifies each rendered DOM node by source file, and tints regions to surface Visor coverage and gaps. No-op in production.",
    files: [
      {
        path: "components/devtools/source-inspector/source-inspector.tsx",
        type: "registry:devtool",
      },
      {
        path: "components/devtools/source-inspector/source-inspector.module.css",
        type: "registry:devtool",
      },
      {
        path: "components/devtools/source-inspector/classify.ts",
        type: "registry:devtool",
      },
    ],
  },
  {
    name: "source-inspector-toggle",
    type: "registry:devtool",
    category: "devtools",
    description:
      "Phosphor `Scan` icon button that cycles the SourceInspector overlay through off → highlight-visor → highlight-non-visor → off. Mounts a default SourceInspectorProvider lazily if no provider is in scope.",
    dependencies: ["@phosphor-icons/react"],
    registryDependencies: ["source-inspector"],
    files: [
      {
        path: "components/devtools/source-inspector/source-inspector-toggle.tsx",
        type: "registry:devtool",
      },
      {
        path: "components/devtools/source-inspector/source-inspector-toggle.module.css",
        type: "registry:devtool",
      },
    ],
  },
]
