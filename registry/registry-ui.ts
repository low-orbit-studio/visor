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
  {
    name: "input",
    type: "registry:ui",
    description: "A text input component with focus and validation states.",
    dependencies: ["@loworbit/visor-tokens"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/input/input.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/input/input.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "label",
    type: "registry:ui",
    description: "An accessible label component built on Radix UI Label.",
    dependencies: ["@radix-ui/react-label", "@loworbit/visor-tokens"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/label/label.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/label/label.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "textarea",
    type: "registry:ui",
    description: "A textarea component with auto-resize and validation states.",
    dependencies: ["@loworbit/visor-tokens"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/textarea/textarea.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/textarea/textarea.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "checkbox",
    type: "registry:ui",
    description: "An accessible checkbox component built on Radix UI Checkbox.",
    dependencies: [
      "@radix-ui/react-checkbox",
      "@phosphor-icons/react",
      "@loworbit/visor-tokens",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/checkbox/checkbox.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/checkbox/checkbox.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "select",
    type: "registry:ui",
    description:
      "An accessible select component built on Radix UI Select with all sub-components.",
    dependencies: [
      "@radix-ui/react-select",
      "@phosphor-icons/react",
      "@loworbit/visor-tokens",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/select/select.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/select/select.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "switch",
    type: "registry:ui",
    description:
      "An accessible toggle switch component built on Radix UI Switch.",
    dependencies: [
      "class-variance-authority",
      "@radix-ui/react-switch",
      "@loworbit/visor-tokens",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/switch/switch.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/switch/switch.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "field",
    type: "registry:ui",
    description:
      "A form field wrapper composing label, description, and error components.",
    dependencies: [
      "class-variance-authority",
      "@loworbit/visor-tokens",
    ],
    registryDependencies: ["utils", "label"],
    files: [
      {
        path: "components/ui/field/field.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/field/field.module.css",
        type: "registry:ui",
      },
    ],
  },
]
