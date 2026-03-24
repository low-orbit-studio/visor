# Design System Interchange Format

## Overview

The Visor interchange format is a portable, human-readable file (`.visor.yaml` or `.visor.json`) that fully describes a visual identity. Applying a theme file to any Visor-powered project completely transforms it — both light and dark mode — with zero manual CSS work.

## Format Spec (Draft)

```yaml
name: "Veronica Home"
version: 1

colors:
  primary: "#1A5F7A"
  primary-hover: "#155068"
  accent: "#5BC4BF"
  accent-hover: "#4BADA8"
  background: "#FFFFFF"
  background-alt: "#F5F5F0"
  surface: "#FFFFFF"
  surface-subtle: "#F8F8F6"
  text-primary: "#1E1F21"
  text-secondary: "rgba(30, 31, 33, 0.7)"
  border-default: "rgba(30, 31, 33, 0.12)"
  success: "#22C55E"
  warning: "#FFB217"
  error: "#EF4444"
  info: "#3B82F6"

colors-dark:
  background: "#0D0D0D"
  background-alt: "#1A1A1A"
  surface: "#1E1E1E"
  surface-subtle: "#262626"
  text-primary: "#F5F5F0"
  text-secondary: "rgba(245, 245, 240, 0.7)"
  border-default: "rgba(245, 245, 240, 0.12)"
  # primary, accent, status colors can be overridden or inherited from light

typography:
  display:
    font: "PP Model Plastic"
    weight: 500
    text-transform: none
  body:
    font: "PP Model Mono"
    weight: 300
  heading-weight: 700
  body-weight: 400
  letter-spacing:
    tight: "-0.02em"
    normal: "0"
    wide: "0.05em"

spacing: "8pt"  # base unit; generates scale from xxxs to xxxxl

radius:
  sm: 4
  md: 8
  lg: 16
  xl: 24
  pill: 9999

shadows:
  sm: "0 1px 2px rgba(0,0,0,0.05)"
  md: "0 4px 6px rgba(0,0,0,0.07)"
  lg: "0 10px 15px rgba(0,0,0,0.1)"
  glow: "0 0 20px rgba(91, 196, 191, 0.3)"

motion:
  duration-quick: "100ms"
  duration-normal: "300ms"
  duration-slow: "600ms"
  easing: "cubic-bezier(0.23, 1, 0.32, 1)"
```

## Adapter Layers

Each consumer type gets an adapter that reads the interchange format and outputs what it needs.

| Adapter | Output | Consumer |
|---------|--------|----------|
| `visor-adapter-nextjs` | CSS custom properties + globals.css | NextJS projects |
| `visor-adapter-fumadocs` | CSS variables compatible with fumadocs theming | Docs sites |
| `visor-adapter-deck` | Scoped CSS under `.deck--{name}` class | Pitch decks |
| `visor-adapter-flutter` | Dart `ThemeData` constants | Flutter projects |
| `visor-adapter-figma` | Figma Variables JSON | Design tools |

## CLI Integration

```bash
npx visor theme apply ./my-brand.visor.yaml     # Apply theme to current project
npx visor theme validate ./theme.visor.yaml      # Validate a theme file
npx visor theme generate                          # Interactive theme generator
npx visor theme export --format figma             # Export for Figma
```

## Key Principle

A project using 100% default Visor components + any valid `.visor.yaml` file should be fully and completely transformed — light and dark mode — with zero manual CSS work.

## Open Questions

- Exact adapter architecture (build-time codegen vs runtime CSS injection)
- How fonts are resolved (Google Fonts ID vs CDN URL vs local path)
- How to handle extended color palettes beyond the core semantic set
- Whether the format should support component-level overrides (e.g., button radius different from global radius)
