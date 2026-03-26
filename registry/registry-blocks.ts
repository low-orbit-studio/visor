import type { Registry } from "./schema"

export const blocks: Registry = [
  {
    name: "configuration-panel",
    type: "registry:block",
    category: "configuration",
    description:
      "A floating, glassmorphic configuration panel for organizing controls into labeled sections. Supports collapse animation, positional anchoring, and responsive stacking.",
    dependencies: [
      "@loworbitstudio/visor-core",
      "@phosphor-icons/react",
    ],
    registryDependencies: ["utils", "separator"],
    files: [
      {
        path: "blocks/configuration-panel/configuration-panel.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/configuration-panel/configuration-panel.module.css",
        type: "registry:block",
      },
    ],
  },
  {
    name: "design-system-specimen",
    type: "registry:block",
    category: "documentation",
    description:
      "A live, interactive design system specimen block showcasing the full Visor token system and component library. Theme-responsive.",
    dependencies: [
      "@loworbitstudio/visor-core",
      "@phosphor-icons/react",
      "class-variance-authority",
    ],
    registryDependencies: [
      "utils",
      "accessibility-specimen",
      "alert",
      "badge",
      "button",
      "card",
      "checkbox",
      "color-swatch",
      "elevation-card",
      "heading",
      "icon-grid",
      "input",
      "label",
      "motion-specimen",
      "progress",
      "radius-scale",
      "radio-group",
      "select",
      "separator",
      "slider",
      "spacing-scale",
      "surface-row",
      "switch",
      "tabs",
      "text",
      "textarea",
      "toggle-group",
      "type-specimen",
    ],
    files: [
      {
        path: "blocks/design-system-specimen/design-system-specimen.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/design-system-specimen/design-system-specimen.module.css",
        type: "registry:block",
      },
      {
        path: "blocks/design-system-specimen/specimen-data.ts",
        type: "registry:block",
      },
      {
        path: "blocks/design-system-specimen/token-specimens.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/design-system-specimen/motion-specimens.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/design-system-specimen/component-specimens.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/design-system-specimen/utility-specimens.tsx",
        type: "registry:block",
      },
    ],
  },
  {
    name: "sphere-playground",
    type: "registry:block",
    category: "visual-elements",
    description:
      "An interactive demo composing the Sphere visualization with a Configuration Panel for real-time parameter control. The signature showcase for Visual Elements.",
    dependencies: [
      "three",
      "@loworbitstudio/visor-core",
      "@phosphor-icons/react",
    ],
    devDependencies: ["@types/three"],
    registryDependencies: [
      "utils",
      "sphere",
      "configuration-panel",
      "slider",
      "toggle-group",
    ],
    files: [
      {
        path: "blocks/sphere-playground/sphere-playground.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/sphere-playground/sphere-playground.module.css",
        type: "registry:block",
      },
    ],
  },
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
