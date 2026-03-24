# Visor Vision

## What Visor Is

Visor is Low Orbit Studio's shared design system. It aims to be the single source of truth for UI components, design tokens, and theming across every Low Orbit project — internal and client — and available as open source for anyone to use.

## Core Goals

### 1. Power Every Low Orbit Project
Visor should be comprehensive enough that starting any new project means `npx visor init` and immediately having everything needed. No rebuilding common components from scratch.

### 2. AI Agent Consumability
Visor should be as understandable by AI agents as by human developers. Structured component metadata, a single machine-readable registry manifest, documented composition patterns, and an agent-first CLI with structured JSON output. Agents should be able to discover, understand, select, and compose Visor components without reading source code. See [ai-consumability.md](./ai-consumability.md).

### 3. Design System Interchange Format
A portable, human-readable format (`.visor.yaml`) that fully describes a visual identity. Applying a Visor theme file to any Visor-powered project completely transforms it — both light and dark mode — with zero manual CSS work. Adapter layers translate the format for different consumers (NextJS, fumadocs, decks, Flutter, Figma).

### 4. Open Source & Community
The component library, token system, interchange format, and Google Fonts integration are all open. Licensed/paid fonts and private themes require authentication.

### 5. Project Templates & Starters
`npx visor init --template dashboard` scaffolds a full working app — layout, nav, auth pages — all themed via the interchange format. Drastically reduces time-to-first-screen.

### 6. Theme Gallery & Comparator
A browsable gallery of public themes. The docs site gets a global theme switcher so every component page is a live preview. A four-quadrant theme comparator shows two themes x light/dark simultaneously with real components.

### 7. Easy Theme Generation
Choose fonts and colors, get a complete theme. Google Fonts available to everyone. Blacklight's paid font library available to authenticated Low Orbit projects. Font pairing suggestions with mood tags.

### 8. Figma Integration
Generate Figma variables from the interchange format (or read them). Closes the designer-developer gap.

### 9. Flutter Token Distribution
Generate Dart theme constants from the interchange format so Flutter projects consume the same design system. Full Flutter component library evaluated later based on need.

### 10. User Accounts & Private Themes
Users can save favorite design systems and keep private themes. Architecture TBD, but private theme support is a hard requirement.

## Design Principles

- **Theming is the core differentiator.** Every component is fully theme-agnostic. Never hard-code values — always reference CSS custom properties.
- **Own your components.** Copy-and-own distribution means consumers have full edit rights with no lock-in.
- **Shared tokens keep consistency effortless.** The `@loworbitstudio/visor-core` npm package is the only shared dependency. Updates propagate via `npm update`.
- **One design system file, total transformation.** A valid `.visor.yaml` applied to default Visor components should produce a fully branded app with no extra work.
- **AI-native by design.** Structured metadata, machine-readable manifests, and an agent-first CLI mean AI agents can work with Visor as fluently as human developers. CLI over MCP — lightweight, universal, self-describing.

## Source Material & Inspiration

| Source | Path | What to draw from |
|--------|------|-------------------|
| Kaiah UI | `~/Code/kaiah/kaiah-app/packages/ui/src/components/ui/` | Component implementations |
| Blacklight tokens | `~/Code/blacklight/packages/design-tokens/` | 3-tier token architecture, multi-platform generation |
| Blacklight fonts | `~/Code/blacklight/` | Font loading, CDN delivery, pairing system, size multipliers |
| Reference NextJS App | `~/Code/low-orbit/low-orbit-playbook/reference-nextjs-app/` | Component tests (69 files), deck components, design system showcase |
| Low Orbit Decks | `~/Code/low-orbit/low-orbit-decks/` | Deck framework, per-client theming, config-driven slides |
