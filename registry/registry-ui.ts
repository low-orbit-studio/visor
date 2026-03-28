import type { Registry } from "./schema"

export const ui: Registry = [
  {
    name: "code-block",
    type: "registry:ui",
    description:
      "A lightweight code display component with optional line numbers, copy-to-clipboard, and language badge.",
    dependencies: [
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/code-block/code-block.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/code-block/code-block.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "heading",
    type: "registry:ui",
    description:
      "A semantic heading component (h1-h6) with independent size and weight variants using CVA.",
    dependencies: ["class-variance-authority", "@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/heading/heading.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/heading/heading.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "stepper",
    type: "registry:ui",
    description:
      "A multi-step progress indicator with horizontal and vertical orientations, auto-derived step status, and accessible ARIA roles.",
    dependencies: [
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/stepper/stepper.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/stepper/stepper.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "text",
    type: "registry:ui",
    description:
      "A body text component with size, weight, color, and line-height variants using CVA.",
    dependencies: ["class-variance-authority", "@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/text/text.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/text/text.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "timeline",
    type: "registry:ui",
    description:
      "A vertical timeline component with status-based styling, optional icons, timestamps, and connector lines.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/timeline/timeline.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/timeline/timeline.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "button",
    type: "registry:ui",
    description:
      "A button component with multiple variants and sizes using CVA.",
    dependencies: ["class-variance-authority", "@loworbitstudio/visor-core"],
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
    dependencies: ["@loworbitstudio/visor-core"],
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
    dependencies: ["@radix-ui/react-label", "@loworbitstudio/visor-core"],
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
    dependencies: ["@loworbitstudio/visor-core"],
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
      "@loworbitstudio/visor-core",
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
      "@loworbitstudio/visor-core",
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
      "@loworbitstudio/visor-core",
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
      "@loworbitstudio/visor-core",
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
      "A Recharts wrapper providing ChartContainer, ChartTooltip, and ChartLegend with theming via @loworbitstudio/visor-core CSS custom properties.",
    dependencies: ["recharts", "@loworbitstudio/visor-core"],
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
    dependencies: ["@loworbitstudio/visor-core"],
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
    dependencies: ["class-variance-authority", "@loworbitstudio/visor-core"],
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
    dependencies: ["@radix-ui/react-avatar", "@loworbitstudio/visor-core"],
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
    dependencies: ["@radix-ui/react-separator", "@loworbitstudio/visor-core"],
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
    dependencies: ["@loworbitstudio/visor-core"],
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
    dependencies: ["@radix-ui/react-tooltip", "@loworbitstudio/visor-core"],
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
    dependencies: ["class-variance-authority", "@loworbitstudio/visor-core"],
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
    dependencies: ["@radix-ui/react-progress", "@loworbitstudio/visor-core"],
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
  {
    name: "dialog",
    type: "registry:ui",
    description:
      "A modal dialog component with overlay, content, header, title, and description sub-components.",
    dependencies: ["@radix-ui/react-dialog", "@phosphor-icons/react", "@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/dialog/dialog.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/dialog/dialog.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "sheet",
    type: "registry:ui",
    description:
      "A slide-over panel component built on Dialog with support for top, right, bottom, and left sides.",
    dependencies: [
      "@radix-ui/react-dialog",
      "@phosphor-icons/react",
      "class-variance-authority",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/sheet/sheet.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/sheet/sheet.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "dropdown-menu",
    type: "registry:ui",
    description:
      "A dropdown menu component with items, checkbox items, radio items, sub-menus, labels, and separators.",
    dependencies: [
      "@radix-ui/react-dropdown-menu",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/dropdown-menu/dropdown-menu.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/dropdown-menu/dropdown-menu.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "tabs",
    type: "registry:ui",
    description:
      "A tabs component with list, trigger, and content sub-components. Supports default and line variants.",
    dependencies: [
      "@radix-ui/react-tabs",
      "class-variance-authority",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/tabs/tabs.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/tabs/tabs.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "breadcrumb",
    type: "registry:ui",
    description:
      "A breadcrumb navigation component with list, item, link, page, separator, and ellipsis sub-components.",
    dependencies: ["@phosphor-icons/react", "@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/breadcrumb/breadcrumb.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/breadcrumb/breadcrumb.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "scroll-area",
    type: "registry:ui",
    description:
      "A scroll area component with custom scrollbars using Radix UI ScrollArea.",
    dependencies: ["@radix-ui/react-scroll-area", "@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/scroll-area/scroll-area.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/scroll-area/scroll-area.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "sidebar",
    type: "registry:ui",
    description:
      "A feature-rich collapsible sidebar component with provider, menu, groups, and sub-menus.",
    dependencies: [
      "class-variance-authority",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/sidebar/sidebar.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/sidebar/sidebar.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "context-menu",
    type: "registry:ui",
    description:
      "A context menu component triggered by right-click, with items, checkbox items, radio items, sub-menus, labels, and separators.",
    dependencies: [
      "@radix-ui/react-context-menu",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/context-menu/context-menu.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/context-menu/context-menu.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "hover-card",
    type: "registry:ui",
    description:
      "A hover card component that displays rich content on hover, built on Radix UI HoverCard.",
    dependencies: ["@radix-ui/react-hover-card", "@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/hover-card/hover-card.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/hover-card/hover-card.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "popover",
    type: "registry:ui",
    description:
      "A popover component for floating content panels, built on Radix UI Popover.",
    dependencies: ["@radix-ui/react-popover", "@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/popover/popover.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/popover/popover.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "banner",
    type: "registry:ui",
    description:
      "A full-width banner/callout component with intent variants (info, warning, error, success) and optional sticky positioning.",
    dependencies: [
      "class-variance-authority",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/banner/banner.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/banner/banner.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "toast",
    type: "registry:ui",
    description:
      "A toast notification system using Sonner with visor-core token theming.",
    dependencies: ["sonner", "@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/toast/toast.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/toast/toast.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "table",
    type: "registry:ui",
    description:
      "A presentational table component with semantic HTML sub-components: TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, and TableCaption.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/table/table.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/table/table.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "accordion",
    type: "registry:ui",
    description:
      "An accessible accordion component with single and multiple expansion modes, built on Radix UI Accordion.",
    dependencies: [
      "@radix-ui/react-accordion",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/accordion/accordion.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/accordion/accordion.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "collapsible",
    type: "registry:ui",
    description:
      "A simple collapsible component for single expandable sections, built on Radix UI Collapsible.",
    dependencies: [
      "@radix-ui/react-collapsible",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/collapsible/collapsible.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/collapsible/collapsible.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "radio-group",
    type: "registry:ui",
    description:
      "An accessible radio group component built on Radix UI RadioGroup. Follows the same pattern as Checkbox.",
    dependencies: [
      "@radix-ui/react-radio-group",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/radio-group/radio-group.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/radio-group/radio-group.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "slider",
    type: "registry:ui",
    description:
      "An accessible slider component built on Radix UI Slider. Supports single value and range (two thumbs).",
    dependencies: [
      "@radix-ui/react-slider",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/slider/slider.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/slider/slider.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "slider-control",
    type: "registry:ui",
    description:
      "A labeled slider with inline value display, composing Slider with a label and formatted output.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "slider"],
    files: [
      {
        path: "components/ui/slider-control/slider-control.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/slider-control/slider-control.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "toggle-group",
    type: "registry:ui",
    description:
      "A toggle group component built on Radix UI ToggleGroup. Supports single-select and multi-select modes with CVA variants.",
    dependencies: [
      "@radix-ui/react-toggle-group",
      "class-variance-authority",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/toggle-group/toggle-group.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/toggle-group/toggle-group.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "combobox",
    type: "registry:ui",
    description:
      "A combobox/autocomplete component built on Radix UI Popover with filterable dropdown, keyboard navigation, and full a11y support.",
    dependencies: [
      "@radix-ui/react-popover",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/combobox/combobox.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/combobox/combobox.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "pagination",
    type: "registry:ui",
    description:
      "A composable pagination component with previous/next navigation, page links, and ellipsis.",
    dependencies: ["@phosphor-icons/react", "@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/pagination/pagination.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/pagination/pagination.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "navbar",
    type: "registry:ui",
    description:
      "A top navigation bar with brand, content areas, links, and style variants (default, transparent, bordered).",
    dependencies: [
      "class-variance-authority",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/navbar/navbar.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/navbar/navbar.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "menubar",
    type: "registry:ui",
    description:
      "A horizontal menu bar with menus, items, checkbox items, radio items, sub-menus, and keyboard navigation.",
    dependencies: [
      "@radix-ui/react-menubar",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/menubar/menubar.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/menubar/menubar.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "command",
    type: "registry:ui",
    description:
      "A command palette/search component with filtering, keyboard navigation, and optional dialog mode.",
    dependencies: [
      "cmdk",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils", "dialog"],
    files: [
      {
        path: "components/ui/command/command.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/command/command.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "calendar",
    type: "registry:ui",
    description:
      "A calendar component wrapping react-day-picker with Visor token styling and Phosphor icon navigation.",
    dependencies: [
      "react-day-picker",
      "date-fns",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/calendar/calendar.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/calendar/calendar.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "carousel",
    type: "registry:ui",
    description:
      "A composable carousel component with horizontal and vertical orientations, built on Embla Carousel.",
    dependencies: [
      "embla-carousel-react",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/carousel/carousel.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/carousel/carousel.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "date-picker",
    type: "registry:ui",
    description:
      "A date picker component combining Calendar with a Radix Popover trigger showing the formatted date.",
    dependencies: [
      "@radix-ui/react-popover",
      "date-fns",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["calendar", "utils"],
    files: [
      {
        path: "components/ui/date-picker/date-picker.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/date-picker/date-picker.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "fullscreen-overlay",
    type: "registry:ui",
    description:
      "A full-viewport overlay for expanding content to fill the screen, built on Radix Dialog.",
    dependencies: [
      "@radix-ui/react-dialog",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/fullscreen-overlay/fullscreen-overlay.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/fullscreen-overlay/fullscreen-overlay.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "file-upload",
    type: "registry:ui",
    description:
      "A drag-and-drop file upload zone with file validation, keyboard activation, and customizable content.",
    dependencies: [
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/file-upload/file-upload.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/file-upload/file-upload.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "image",
    type: "registry:ui",
    description:
      "An image component with loading skeleton, error fallback, aspect ratio presets, and lazy loading.",
    dependencies: [
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/image/image.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/image/image.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "lightbox",
    type: "registry:ui",
    description:
      "A full-screen image viewer with gallery navigation, keyboard and touch support, built on Radix Dialog.",
    dependencies: [
      "@radix-ui/react-dialog",
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/lightbox/lightbox.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/lightbox/lightbox.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "fieldset",
    type: "registry:ui",
    description:
      "A semantic fieldset wrapper with styled legend for grouping related form fields.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/fieldset/fieldset.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/fieldset/fieldset.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "search-input",
    type: "registry:ui",
    description:
      "A search input with magnifying glass icon and optional clear button.",
    dependencies: [
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils", "input"],
    files: [
      {
        path: "components/ui/search-input/search-input.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/search-input/search-input.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "password-input",
    type: "registry:ui",
    description:
      "A password input with show/hide toggle and optional strength meter.",
    dependencies: [
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils", "input"],
    files: [
      {
        path: "components/ui/password-input/password-input.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/password-input/password-input.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "number-input",
    type: "registry:ui",
    description:
      "A number input with increment/decrement buttons and min/max/step support.",
    dependencies: [
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/number-input/number-input.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/number-input/number-input.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "phone-input",
    type: "registry:ui",
    description:
      "A phone number input with automatic US format formatting.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "input"],
    files: [
      {
        path: "components/ui/phone-input/phone-input.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/phone-input/phone-input.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "otp-input",
    type: "registry:ui",
    description:
      "A multi-digit OTP/verification code input with auto-advance and paste support.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/otp-input/otp-input.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/otp-input/otp-input.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "tag-input",
    type: "registry:ui",
    description:
      "A multi-value tag input with removable chips, keyboard support, and max tag limit.",
    dependencies: [
      "@phosphor-icons/react",
      "@loworbitstudio/visor-core",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/tag-input/tag-input.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/tag-input/tag-input.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "accessibility-specimen",
    type: "registry:ui",
    description:
      "WCAG contrast pair display with color preview, ratio value, and AA/AAA pass/fail badges.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "text", "badge"],
    files: [
      {
        path: "components/ui/accessibility-specimen/accessibility-specimen.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/accessibility-specimen/accessibility-specimen.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "color-swatch",
    type: "registry:ui",
    description:
      "Individual color swatch with hex value display, plus grid variants for color scales and semantic color tokens.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "text"],
    files: [
      {
        path: "components/ui/color-swatch/color-swatch.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/color-swatch/color-swatch.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "elevation-card",
    type: "registry:ui",
    description:
      "Shadow level display card showing a single elevation token with its name and token reference.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "text"],
    files: [
      {
        path: "components/ui/elevation-card/elevation-card.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/elevation-card/elevation-card.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "icon-grid",
    type: "registry:ui",
    description:
      "Icon set display with names, usage descriptions, and a size scale row.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "text"],
    files: [
      {
        path: "components/ui/icon-grid/icon-grid.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/icon-grid/icon-grid.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "motion-specimen",
    type: "registry:ui",
    description:
      "Duration and easing preview components with interactive play-animation controls.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "text", "button"],
    files: [
      {
        path: "components/ui/motion-specimen/motion-specimen.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/motion-specimen/motion-specimen.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "opacity-bar",
    type: "registry:ui",
    description:
      "Opacity level visualization showing bars at varying opacity values with token names.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "text"],
    files: [
      {
        path: "components/ui/opacity-bar/opacity-bar.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/opacity-bar/opacity-bar.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "radius-scale",
    type: "registry:ui",
    description:
      "Border radius examples with labels and pixel values, displayed in a responsive grid.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "text"],
    files: [
      {
        path: "components/ui/radius-scale/radius-scale.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/radius-scale/radius-scale.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "spacing-scale",
    type: "registry:ui",
    description:
      "Visual spacing scale displaying token names, proportional bars, and pixel/rem values.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "text"],
    files: [
      {
        path: "components/ui/spacing-scale/spacing-scale.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/spacing-scale/spacing-scale.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "surface-row",
    type: "registry:ui",
    description:
      "Surface background variant display showing a surface token with its name and token reference.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/surface-row/surface-row.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/surface-row/surface-row.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "type-specimen",
    type: "registry:ui",
    description:
      "A single typography row displaying sample text at a given font-size token with weight and size metadata.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "text"],
    files: [
      {
        path: "components/ui/type-specimen/type-specimen.tsx",
        type: "registry:ui",
      },
      {
        path: "components/ui/type-specimen/type-specimen.module.css",
        type: "registry:ui",
      },
    ],
  },
]
