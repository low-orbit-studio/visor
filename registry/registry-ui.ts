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
  {
    name: "chart",
    type: "registry:ui",
    description:
      "A Recharts wrapper providing ChartContainer, ChartTooltip, and ChartLegend with theming via @loworbit/visor-tokens CSS custom properties.",
    dependencies: ["recharts", "@loworbit/visor-tokens"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/chart/chart.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/chart/chart.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "card",
    type: "registry:ui",
    description:
      "A compound card component with header, title, description, content, and footer sub-components.",
    dependencies: ["@loworbit/visor-tokens"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/card/card.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/card/card.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "badge",
    type: "registry:ui",
    description:
      "A badge component with multiple variants (default, secondary, outline, destructive) using CVA.",
    dependencies: ["class-variance-authority", "@loworbit/visor-tokens"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/badge/badge.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/badge/badge.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "avatar",
    type: "registry:ui",
    description:
      "An avatar component with image and fallback support, built on Radix UI Avatar.",
    dependencies: ["@radix-ui/react-avatar", "@loworbit/visor-tokens"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/avatar/avatar.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/avatar/avatar.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "separator",
    type: "registry:ui",
    description:
      "A separator component supporting horizontal and vertical orientations, built on Radix UI Separator.",
    dependencies: ["@radix-ui/react-separator", "@loworbit/visor-tokens"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/separator/separator.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/separator/separator.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "skeleton",
    type: "registry:ui",
    description:
      "A skeleton loading placeholder component with a pulse animation.",
    dependencies: ["@loworbit/visor-tokens"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/skeleton/skeleton.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/skeleton/skeleton.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "tooltip",
    type: "registry:ui",
    description:
      "A tooltip component with provider, trigger, and content sub-components, built on Radix UI Tooltip.",
    dependencies: ["@radix-ui/react-tooltip", "@loworbit/visor-tokens"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/tooltip/tooltip.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/tooltip/tooltip.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "alert",
    type: "registry:ui",
    description:
      "An alert component with title and description sub-components, supporting default, destructive, success, and warning variants.",
    dependencies: ["class-variance-authority", "@loworbit/visor-tokens"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/alert/alert.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/alert/alert.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "progress",
    type: "registry:ui",
    description:
      "A progress bar component built on Radix UI Progress.",
    dependencies: ["@radix-ui/react-progress", "@loworbit/visor-tokens"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/progress/progress.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/progress/progress.module.css",
        type: "registry:ui",
      },
    ],
  },
]
