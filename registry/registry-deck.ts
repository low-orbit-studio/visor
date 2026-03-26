import type { Registry } from "./schema"

export const deck: Registry = [
  // Contexts
  {
    name: "deck-context",
    type: "registry:ui",
    category: "deck",
    description:
      "React context providing slide navigation (goTo, navigateTo) for deck components.",
    dependencies: ["@loworbitstudio/visor-core"],
    files: [
      {
        path: "components/deck/deck-context/deck-context.tsx",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "slide-theme-context",
    type: "registry:ui",
    category: "deck",
    description:
      "React context tracking the current slide theme (light/dark) for nested components.",
    dependencies: ["@loworbitstudio/visor-core"],
    files: [
      {
        path: "components/deck/slide-theme-context/slide-theme-context.tsx",
        type: "registry:ui",
      },
    ],
  },

  // Utility
  {
    name: "deck-stagger",
    type: "registry:lib",
    category: "deck",
    description:
      "Stagger delay utility that computes transitionDelay styles for deck animations.",
    files: [
      {
        path: "lib/deck-stagger.ts",
        type: "registry:lib",
      },
    ],
  },

  // Hooks
  {
    name: "use-slide-engine",
    type: "registry:hook",
    category: "deck",
    description:
      "Smooth scroll-to-slide hook with easeInOutQuad easing for deck navigation.",
    files: [
      {
        path: "hooks/use-slide-engine.ts",
        type: "registry:hook",
      },
    ],
  },
  {
    name: "use-keyboard-nav",
    type: "registry:hook",
    category: "deck",
    description:
      "Keyboard navigation hook for deck slides (arrows, space, home, end).",
    files: [
      {
        path: "hooks/use-keyboard-nav.ts",
        type: "registry:hook",
      },
    ],
  },
  {
    name: "use-wheel-nav",
    type: "registry:hook",
    category: "deck",
    description:
      "Mouse wheel navigation hook with debounce for deck slide navigation.",
    files: [
      {
        path: "hooks/use-wheel-nav.ts",
        type: "registry:hook",
      },
    ],
  },
  {
    name: "use-intersection-animation",
    type: "registry:hook",
    category: "deck",
    description:
      "IntersectionObserver hook that toggles data-deck-visible for slide entrance animations.",
    files: [
      {
        path: "hooks/use-intersection-animation.ts",
        type: "registry:hook",
      },
    ],
  },

  // Core components
  {
    name: "slide",
    type: "registry:ui",
    category: "deck",
    description:
      "Base slide container with theme, layout modes, hero images, and background support.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["slide-theme-context", "utils"],
    files: [
      {
        path: "components/deck/slide/slide.tsx",
        type: "registry:ui",
      },
      {
        path: "components/deck/slide/slide.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "deck-slide-header",
    type: "registry:ui",
    category: "deck",
    description:
      "Reusable slide header with subtitle, title, and optional description with stagger animations.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["deck-stagger", "utils"],
    files: [
      {
        path: "components/deck/slide-header/slide-header.tsx",
        type: "registry:ui",
      },
      {
        path: "components/deck/slide-header/slide-header.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "deck-dot-nav",
    type: "registry:ui",
    category: "deck",
    description:
      "Fixed right-side navigation dots with hover tooltips and active state indicators.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/deck/dot-nav/dot-nav.tsx",
        type: "registry:ui",
      },
      {
        path: "components/deck/dot-nav/dot-nav.module.css",
        type: "registry:ui",
      },
    ],
  },

  // Composite components
  {
    name: "deck-card-grid",
    type: "registry:ui",
    category: "deck",
    description:
      "Responsive grid layout that auto-applies stagger animations to card children.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["deck-stagger", "utils"],
    files: [
      {
        path: "components/deck/card-grid/card-grid.tsx",
        type: "registry:ui",
      },
      {
        path: "components/deck/card-grid/card-grid.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "deck-carousel-gallery",
    type: "registry:ui",
    category: "deck",
    description:
      "Image gallery grid that opens a fullscreen lightbox on click.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["lightbox", "utils"],
    files: [
      {
        path: "components/deck/carousel-gallery/carousel-gallery.tsx",
        type: "registry:ui",
      },
      {
        path: "components/deck/carousel-gallery/carousel-gallery.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "deck-hero-slide",
    type: "registry:ui",
    category: "deck",
    description:
      "Hero/title slide with badge, stagger animations, hero image, and split logo layout.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["slide", "deck-stagger", "utils"],
    files: [
      {
        path: "components/deck/hero-slide/hero-slide.tsx",
        type: "registry:ui",
      },
      {
        path: "components/deck/hero-slide/hero-slide.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "deck-toc-slide",
    type: "registry:ui",
    category: "deck",
    description:
      "Table of contents slide with clickable section links for slide navigation.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["slide", "deck-context", "deck-stagger", "utils"],
    files: [
      {
        path: "components/deck/toc-slide/toc-slide.tsx",
        type: "registry:ui",
      },
      {
        path: "components/deck/toc-slide/toc-slide.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "deck-closing-slide",
    type: "registry:ui",
    category: "deck",
    description:
      "Closing/thank-you slide with tagline, subtitle, and stagger animations.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["slide", "deck-stagger", "utils"],
    files: [
      {
        path: "components/deck/closing-slide/closing-slide.tsx",
        type: "registry:ui",
      },
      {
        path: "components/deck/closing-slide/closing-slide.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "deck-concept-slide",
    type: "registry:ui",
    category: "deck",
    description:
      "Full-bleed auto-playing video slide with text overlay.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["slide", "utils"],
    files: [
      {
        path: "components/deck/concept-slide/concept-slide.tsx",
        type: "registry:ui",
      },
      {
        path: "components/deck/concept-slide/concept-slide.module.css",
        type: "registry:ui",
      },
    ],
  },
  {
    name: "deck-footer",
    type: "registry:ui",
    category: "deck",
    description:
      "Multi-column footer with brand info, navigation links, and colophon.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: ["deck-context", "deck-stagger", "utils"],
    files: [
      {
        path: "components/deck/deck-footer/deck-footer.tsx",
        type: "registry:ui",
      },
      {
        path: "components/deck/deck-footer/deck-footer.module.css",
        type: "registry:ui",
      },
    ],
  },

  // Orchestrator
  {
    name: "deck-layout",
    type: "registry:ui",
    category: "deck",
    description:
      "Master deck orchestrator with scroll-snap navigation, keyboard/wheel/intersection support, and dot-nav.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: [
      "deck-context",
      "deck-dot-nav",
      "use-slide-engine",
      "use-keyboard-nav",
      "use-wheel-nav",
      "use-intersection-animation",
      "utils",
    ],
    files: [
      {
        path: "components/deck/deck-layout/deck-layout.tsx",
        type: "registry:ui",
      },
      {
        path: "components/deck/deck-layout/deck-layout.module.css",
        type: "registry:ui",
      },
    ],
  },

  // Renderer
  {
    name: "deck-renderer",
    type: "registry:ui",
    category: "deck",
    description:
      "Renders a navigable slide deck from a declarative DeckRegistry config. Supports TOC, footer, fullscreen mode, and keyboard navigation.",
    dependencies: ["@loworbitstudio/visor-core"],
    registryDependencies: [
      "deck-layout",
      "deck-footer",
      "deck-toc-slide",
      "fullscreen-overlay",
      "utils",
    ],
    files: [
      {
        path: "components/deck/deck-renderer/deck-renderer.tsx",
        type: "registry:ui",
      },
      {
        path: "components/deck/deck-renderer/deck-renderer.module.css",
        type: "registry:ui",
      },
      {
        path: "lib/deck-registry.ts",
        type: "registry:lib",
      },
    ],
  },
]
