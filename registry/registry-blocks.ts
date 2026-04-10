import type { Registry } from "./schema"

export const blocks: Registry = [
  {
    name: "admin-shell",
    type: "registry:block",
    category: "admin",
    description:
      "Foundational admin layout with sidebar, topbar, and main content area. Slot-driven for logo, navigation, breadcrumbs, user menu, and status indicators.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "breadcrumb", "dropdown-menu", "sidebar"],
    files: [
      {
        path: "blocks/admin-shell/admin-shell.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/admin-shell/admin-shell.module.css",
        type: "registry:block",
      },
    ],
  },
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
    name: "features-grid",
    type: "registry:block",
    category: "marketing",
    description: "A responsive grid of feature cards with icons, titles, and descriptions.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "card", "heading", "text"],
    files: [
      {
        path: "blocks/features-grid/features-grid.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/features-grid/features-grid.module.css",
        type: "registry:block",
      },
    ],
  },
  {
    name: "design-system-deck",
    type: "registry:block",
    category: "documentation",
    description:
      "A complete, registry-driven design system presentation deck. Composes all slide components into a DeckRenderer with TOC, dot navigation, keyboard nav, and fullscreen support. Responds dynamically to the active theme.",
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
      "deck-renderer",
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
      "slide",
      "slide-header",
      "spacing-scale",
      "surface-row",
      "switch",
      "tabs",
      "text",
      "toggle-group",
      "type-specimen",
    ],
    files: [
      { path: "blocks/design-system-deck/design-system-deck.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/index.ts", type: "registry:block" },
      { path: "blocks/design-system-deck/registry.ts", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/slides.module.css", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/index.ts", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/slide-data.ts", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/title-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/gray-scale-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/accent-palette-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/semantic-tokens-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/type-display-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/type-body-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/opacity-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/theme-architecture-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/elevation-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/radius-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/motion-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/icons-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/accessibility-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/button-specimen-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/form-specimen-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/component-showcase-slide.tsx", type: "registry:block" },
      { path: "blocks/design-system-deck/slides/closing-slide.tsx", type: "registry:block" },
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
    name: "footer-section",
    type: "registry:block",
    category: "marketing",
    description: "A multi-column responsive footer with link groups, logo, and copyright.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "heading", "text", "separator"],
    files: [
      {
        path: "blocks/footer-section/footer-section.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/footer-section/footer-section.module.css",
        type: "registry:block",
      },
    ],
  },
  {
    name: "hero-section",
    type: "registry:block",
    category: "marketing",
    description:
      "A full-width hero section with background media, heading, and call-to-action.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "heading", "text", "button"],
    files: [
      {
        path: "blocks/hero-section/hero-section.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/hero-section/hero-section.module.css",
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
    name: "cta-section",
    type: "registry:block",
    category: "marketing",
    description:
      "A centered call-to-action section with heading, description, and button.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "heading", "text", "button"],
    files: [
      {
        path: "blocks/cta-section/cta-section.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/cta-section/cta-section.module.css",
        type: "registry:block",
      },
    ],
  },
  {
    name: "login-form",
    type: "registry:block",
    category: "authentication",
    description:
      "A login form block using Visor form components (Button, Input, Label, Card).",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "button", "input", "field", "card"],
    files: [
      {
        path: "blocks/login-form/login-form.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/login-form/login-form.module.css",
        type: "registry:block",
      },
    ],
  },
  {
    name: "pricing-section",
    type: "registry:block",
    category: "marketing",
    description: "A responsive pricing tier grid with feature lists and CTAs.",
    dependencies: ["@loworbitstudio/visor-core", "@phosphor-icons/react"],
    registryDependencies: ["utils", "card", "badge", "button", "separator", "heading", "text"],
    files: [
      {
        path: "blocks/pricing-section/pricing-section.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/pricing-section/pricing-section.module.css",
        type: "registry:block",
      },
    ],
  },
  {
    name: "steps-section",
    type: "registry:block",
    category: "marketing",
    description:
      "A numbered process section with steps and connector lines.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "heading", "text"],
    files: [
      {
        path: "blocks/steps-section/steps-section.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/steps-section/steps-section.module.css",
        type: "registry:block",
      },
    ],
  },
  {
    name: "testimonial-section",
    type: "registry:block",
    category: "marketing",
    description:
      "A social proof section with testimonial quotes, avatars, and attribution.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils", "card", "avatar", "text", "heading", "separator"],
    files: [
      {
        path: "blocks/testimonial-section/testimonial-section.tsx",
        type: "registry:block",
      },
      {
        path: "blocks/testimonial-section/testimonial-section.module.css",
        type: "registry:block",
      },
    ],
  },
]
