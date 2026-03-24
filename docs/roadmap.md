# Visor Roadmap

Phases are sequential but may overlap. Status is updated as work progresses.

## Phase 1: Component Library Expansion — IN PROGRESS

Expand from 25 to ~55 general-purpose components plus a deck component category. Make Visor comprehensive enough to start any project immediately.

See [component-inventory.md](./component-inventory.md) for the full current vs target list.

**Key work:**
- Add ~30 new general-purpose components
- Add ~12 deck components as a separate registry category (`npx visor add --category deck`)
- Move tests from reference-nextjs-app to Visor (not copy) — 100% coverage target
- All components must be fully theme-agnostic, using CSS Modules + CSS custom properties

## Phase 2: AI Agent Consumability

Make Visor as understandable and usable by AI agents as it is by human developers.

See [ai-consumability.md](./ai-consumability.md) for the full spec.

**Key work:**
- Component metadata manifests — structured YAML/JSON per component with props, variants, slots, dependencies, usage examples, "when to use" / "when not to use" guidance
- Single registry manifest (`visor-manifest.json`) — one file an agent loads to understand everything available
- Composition patterns/recipes — higher-level documented patterns ("form with validation", "dashboard layout", "CRUD table") showing how components combine
- Agent-first CLI enhancements — `--json` flag on all commands, rich `--help`, composable commands, structured output (following CLI-Anything principles)

## Phase 3: Design System Interchange Format

Define the `.visor.yaml` spec and build adapter layers.

See [interchange-format.md](./interchange-format.md) for the format spec and adapter design.

**Key work:**
- Finalize the interchange format spec
- Build adapters: NextJS, fumadocs, decks
- CLI commands: `npx visor theme apply`, `validate`, `generate`, `export`
- Ensure any valid theme file completely transforms a Visor project (light + dark)

## Phase 4: Docs Site & Theme Experience

Make the docs site a world-class showcase.

**Key work:**
- Global theme switcher dropdown in docs header — every page is a live preview
- Four-quadrant theme comparator (`/compare`) — 2 themes x light/dark showing real components
- Full MDX documentation for every component (currently only button exists)
- All examples respond to the active theme

## Phase 5: Theme Generation & Font Infrastructure

Make creating a new theme as easy as picking fonts and colors.

**Key work:**
- Interactive theme wizard: choose colors + fonts, preview in real-time, export `.visor.yaml`
- Google Fonts: open to everyone
- Blacklight font library (Cloudflare R2 CDN): authenticated Low Orbit projects only
- Font pairing with mood tags (leverage Blacklight's `epk_theme_font_pairing` system)

## Phase 6: Project Templates & Starters

`npx visor init --template <name>` scaffolds a complete, themed, working app.

**Templates:**
- `dashboard` — Sidebar nav, header, main content area, cards
- `marketing` — Landing page with hero, features, CTA, footer
- `admin` — Table views, forms, CRUD patterns
- `docs` — Documentation site (fumadocs-based)
- `deck` — Pitch deck with slide framework

## Phase 7: Flutter Token Distribution

Generate Dart `ThemeData` from `.visor.yaml` so Flutter projects consume the same design system.

**Key work:**
- Build `visor-adapter-flutter` (reference: Blacklight's `generate-flutter.ts`)
- Colors, typography, spacing, radius, shadows all map to Flutter equivalents
- Evaluate need for a full Flutter component library based on usage across projects

## Phase 8: Figma Integration

Bi-directional sync between Visor themes and Figma.

**Key work:**
- Export `.visor.yaml` to Figma Variables JSON
- Import Figma Variables to `.visor.yaml`

## Phase 9: User Accounts & Theme Marketplace

Users can save, share, and browse themes. Private themes supported.

**Key work:**
- Architecture TBD (web app, API, or hybrid)
- Private theme support (hard requirement)
- Public theme browsing without auth
- Authenticated users: save favorites, create private themes, access licensed fonts

---

## Migration Plan

Once Phases 1-3 are complete:

1. **Kaiah** — First retrofit (already referenced as source material)
2. **Reference NextJS App** — Migrate to Visor components + interchange format
3. **Low Orbit Decks** — Retrofit to use Visor deck category
4. **New projects** (Sked, Reboot, etc.) — Start on Visor from day one
5. **Existing projects** (Veronica, SoleSpark, ENTR, Blacklight) — Migrate as capacity allows
