# Changelog

## 0.3.0 — Sphere Playground & Live Code

The Sphere Playground is now a fully interactive showcase with real-time code generation, a complete control panel matching the source sandbox, and a new CSS-based fullscreen mode that preserves all state.

### New Components

- **SliderControl** — Labeled slider with inline value display, composing Slider with a label and formatted output for configuration panels

### Sphere Playground

- **Live code generation** — "Show Code" displays a fully configured `<Sphere>` component with all current prop values, updating in real-time as controls change. Powered by a new `BlockCodeContext` bridge that any block can opt into.
- **Correct defaults** — All slider defaults now match the source sandbox (saturation 1.8, lightness 0.8, size 1.0, etc.)
- **Full control panel** — Restructured to match the source: Geometry (chips + Size + Waves + Speed), Appearance (Dots + Flecks), Color (chips + Sat + Light), Think (Pulses/Ramp/Scatter toggles + Intensity)
- **Particle count slider** — "Dots" controls particle count from 6k to 1M (default 128k) with abbreviated labels
- **Flecks slider** — Controls sparkle chance (0–10%, default 2%), replacing the old Blur slider
- **Draggable panel** — Configuration panel can be repositioned by dragging the header
- **Dark glassmorphic panel** — 95% opaque dark background for contrast against the WebGL canvas
- **`sparkleChance` prop** added to the Sphere component

### Block Preview

- **CSS-based fullscreen** — Replaced Radix Dialog portal (which lost all state on toggle) with CSS `position: fixed` on the same DOM tree. All component state persists across transitions.
- **Fullscreen footer** — Glassmorphic dark bar with Exit button; Show Code hidden in fullscreen
- **Preview title styling** — Bold, 1rem, `--text-primary` across all themes

### ToggleGroup

- **xs size variant** — Extra-small size for compact control panels

### Infrastructure

- **THREE.Clock → THREE.Timer** — Replaces deprecated Clock (r183) with Timer for correct delta timing and Page Visibility API support
- **Test coverage** — 103 tests across sphere-related components (up from 54), covering interactions, code generation, drag behavior, edge cases, and config validation

## 0.2.0 — Phase 1a Complete

Phase 1a is complete: the theming architecture is validated, the component library has grown from 25 to 40 components, and the docs site is upgraded to the latest stack.

### Components

- **15 new components:** accordion, banner, collapsible, combobox, command, context-menu, hover-card, menubar, navbar, pagination, popover, radio-group, slider, table, toast, toggle-group
- All components are fully theme-agnostic using CSS Modules + CSS custom properties

### Tokens & Theming

- Promoted interactive tokens (`--interactive-primary-bg`, etc.) to the adaptive layer — themes can now override interactive colors
- Added **Neutral standard theme** (zinc palette) validating the full token contract
- Added **theme switcher** dropdown to docs site header
- Token system cleanup and theme contract formalization

### Infrastructure

- Added **axe-core a11y testing** infrastructure with `vitest-axe` integration
- Replaced `tailwind-merge` with plain `clsx` — cleaner CSS Module classname composition
- Upgraded to **fumadocs v16**, **Next.js 16**, **React 19.2**
- Added GitHub Actions CI/CD pipelines
- Added Visor CLI (`npx visor add <component>`) for registry-based component installation

### Documentation

- Added minimal MDX documentation pages for all components
- Docs site visual polish — sidebar, themes, buttons
- Component sidebar grouping (alphabetized)
- Props table component with search
- Consumer documentation and migration guide

## 0.1.0 — Initial Release

Scaffolded the Visor monorepo with registry-based component distribution and token package.

### Components

- **25 initial components:** alert, avatar, badge, breadcrumb, button, card, chart, checkbox, dialog, dropdown-menu, field, input, label, progress, scroll-area, select, separator, sheet, sidebar, skeleton, switch, tabs, textarea, tooltip
- **9 hooks:** use-boolean, use-click-outside, use-debounce, use-focus-trap, use-intersection-observer, use-keyboard-shortcut, use-local-storage, use-media-query, use-previous

### Tokens

- `@loworbitstudio/visor-core` token package with 3-tier architecture (primitives → semantic → adaptive)
- Dark mode theme tokens
- Motion/animation tokens
- Space creative theme for docs site

### Infrastructure

- Monorepo scaffold with packages: tokens, cli, docs
- fumadocs documentation site
- SSR compatibility with `use client` directives
- MIT license and contributing guide
