# Visor Roadmap

Phases are sequential but may overlap. Status is updated as work progresses.

## Phase 1a: Core Expansion + Theme Architecture Validation — IN PROGRESS

Validate the theming architecture with a second standard theme while expanding the highest-priority components. Fix the adaptive token gap before scaling up.

See [component-inventory.md](./component-inventory.md) for the full current vs target list.

**Key work:**
- Promote interactive tokens to the adaptive layer (currently only text/surface/border are adaptive — interactive tokens like `--interactive-primary-bg` are hardcoded to blue primitives and can't be theme-switched)
- Create a **"Neutral" standard theme** (zinc palette, sections 1-4 only, no creative extensions) to validate the full token contract across all components
- Add a **basic theme switcher** to the docs site header for immediate visual verification
- Add ~15 highest-priority general-purpose components (table, accordion, toast, popover, radio group, slider, combobox, navbar, pagination, command palette, toggle group, context menu, hover card, menubar, banner)
- Add axe-core a11y testing to vitest setup
- Replace tailwind-merge with plain clsx (tailwind-merge does nothing useful for CSS Module classnames)
- All components must be fully theme-agnostic, using CSS Modules + CSS custom properties

## Phase 1b: Remaining Components + Deck

Complete the component library and add the deck category.

**Key work:**
- Add remaining general-purpose components to reach ~55 total
- Add ~12 deck components as a separate registry category (`npx visor add --category deck`)
- Move tests from reference-nextjs-app to Visor (not copy) — 100% coverage target
- Add component composition tests (dialog + form, sidebar + nav, dropdown in table)

## Phase 2: AI Agent Consumability

Make Visor as understandable and usable by AI agents as it is by human developers.

See [ai-consumability.md](./ai-consumability.md) for the full spec.

**Key work:**
- Component metadata manifests — structured YAML/JSON per component with props, variants, slots, dependencies, usage examples, "when to use" / "when not to use" guidance
- Single registry manifest (`visor-manifest.json`) — one file an agent loads to understand everything available
- Composition patterns/recipes — higher-level documented patterns ("form with validation", "dashboard layout", "CRUD table") showing how components combine
- Agent-first CLI enhancements — `--json` flag on all commands, rich `--help`, composable commands, structured output (following CLI-Anything principles)

## Phase 3: Interchange Format, Import/Export, Validation & Basic Font Resolution

Define the `.visor.yaml` spec, build adapter layers, create a theme validator, and add basic font infrastructure.

See [interchange-format.md](./interchange-format.md) for the format spec and adapter design.

**Key work:**
- **Design spike first:** Document the exact algorithm for `.visor.yaml` flat colors → 3-tier token mapping (e.g., `primary: "#2563EB"` → all derived interactive/surface/text/border tokens) before implementing
- Finalize the interchange format spec with a formal JSON Schema
- Reconcile the draft spec with the actual 3-tier token system (the draft uses flat color names; tokens use primitives → semantic → adaptive)
- Build `packages/theme-engine/` — shared package housing:
  - JSON Schema for `.visor.yaml` validation
  - Shade generation algorithm (OKLCH-based, generates 50–950 scale from a base hex)
  - Import: parse `.visor.yaml` → generate CSS custom property overrides
  - Export: read current theme tokens → produce `.visor.yaml`
  - Mapping layer: flat `.visor.yaml` colors → primitive shade scales → semantic/adaptive token assignment
- **Basic font infrastructure:** Google Fonts URL resolution from family name, `font-display` strategy, preload hint generation (the interchange format needs this to be complete)
- CLI commands:
  - `npx visor theme apply <file>` — reads `.visor.yaml`, generates full CSS token overrides
  - `npx visor theme export [--format yaml|json|figma]` — exports current theme
  - `npx visor theme validate <file> [--json]` — runs full validation ruleset
- Build adapters: NextJS, fumadocs, decks
- Ensure any valid theme file completely transforms a Visor project (light + dark)
- **Minimal `npx visor init`:** Single starter template proving the end-to-end flow (theme file → working project)
- Decide on CSS `@layer` strategy for token output specificity
- Add FOWT (Flash of Wrong Theme) prevention: blocking `<script>` snippet for consumer projects + SSR guidance

**Validator rules:**
- **Completeness** — all required tokens present (colors light+dark, typography, spacing, radius, shadows)
- **WCAG contrast** — text-primary on background/surface ≥ 4.5:1, interactive colors ≥ 3:1, same checks for dark mode
- **Type scale coherence** — heading-weight ≥ body-weight, valid font family strings
- **Structural integrity** — version/name present, valid CSS color formats, non-negative radius, valid shadow strings
- **Warnings (non-blocking)** — primary/accent too similar, missing glow shadow, inconsistent radius scale

**Why `packages/theme-engine/`:** Validator, shade generator, and import/export logic are consumed by both CLI (Node.js) and docs site (browser). Shared package avoids duplication. The visual theme creator (Phase 6) also depends on this.

## Phase 4: Theme Extraction

Extract design systems from existing projects into `.visor.yaml` themes. Both a deterministic CLI tool and an AI-powered Claude Code skill. The docs site theme switcher from Phase 1a enables visual verification of extracted themes.

**Key work:**
- CLI: `npx visor theme extract [--from <path>] [--json]` — deterministic static analysis
  - Scan targets: CSS custom properties, globals.css, CSS module files, tailwind config, package.json
  - Output: best-effort `.visor.yaml` with confidence annotations (high/medium/low per mapped token)
  - Ambiguous mappings flagged for human/AI review
- Claude Code skill: registered in `~/.claude/skills/` following playbook patterns
  - Wraps the CLI extract command
  - Uses AI to resolve ambiguities (e.g., which blue is "primary"?)
  - Interprets design intent from variable naming and usage patterns
  - Produces a complete, validated `.visor.yaml`
- Test against real projects: Kaiah, Blacklight, reference-nextjs-app
- Extracted themes are local `.visor.yaml` files (private by default; cloud storage comes in Phase 11)

## Phase 5: Docs Site & Theme Experience

Make the docs site a world-class showcase.

**Key work:**
- [x] Global theme switcher dropdown in docs header — every page is a live preview
- Upgrade the basic theme switcher (Phase 1a) to a polished global dropdown
- Four-quadrant theme comparator (`/compare`) — 2 themes x light/dark showing real components
- [x] Full MDX documentation for every component (currently only button exists)
- All examples respond to the active theme
- Add visual regression testing (Playwright screenshots) before themes proliferate further

## Phase 6: Visual Theme Creator

A visual theme creation experience in the docs site with harmonious color generation and clone-to-modify workflow.

**Key work:**
- Lives in the docs site at `/create` (or `/theme/create`)
- Color picker with shade generation: pick base primary + accent colors, OKLCH algorithm generates full shade palettes
- Typography section: Google Fonts API selector, weight picker, scale preview
- Spacing/radius/shadow controls with sensible defaults
- "Start from" dropdown: blank theme, or clone any existing theme (loads `.visor.yaml` as starting state)
- Real-time preview panel showing actual Visor components (button, card, input, badge, alert, dialog) with in-progress theme applied via CSS custom property injection
- Light/dark mode toggle in preview
- Live validation: runs Phase 3 validator continuously, shows warnings/errors inline
- Export button: downloads `.visor.yaml` file
- "Apply to project" shortcut: copies CLI command to clipboard
- Depends on `packages/theme-engine/` (shade generator, validator, mapper)

## Phase 7: Advanced Font Infrastructure

Blacklight font library and font pairing intelligence. Basic font resolution (Google Fonts, `font-display`) ships in Phase 3.

**Key work:**
- Blacklight font library (Cloudflare R2 CDN): authenticated Low Orbit projects only
- Font pairing with mood tags (leverage Blacklight's `epk_theme_font_pairing` system)
- Advanced font loading optimizations (subsetting, variable font support)

## Phase 8: Project Templates & Starters

`npx visor init --template <name>` scaffolds a complete, themed, working app. A minimal single-template `npx visor init` ships in Phase 3; this phase expands to a full template gallery.

**Templates:**
- `dashboard` — Sidebar nav, header, main content area, cards
- `marketing` — Landing page with hero, features, CTA, footer
- `admin` — Table views, forms, CRUD patterns
- `docs` — Documentation site (fumadocs-based)
- `deck` — Pitch deck with slide framework

## Phase 9: Flutter Token Distribution

Generate Dart `ThemeData` from `.visor.yaml` so Flutter projects consume the same design system.

**Key work:**
- Build `visor-adapter-flutter` (reference: Blacklight's `generate-flutter.ts`)
- Colors, typography, spacing, radius, shadows all map to Flutter equivalents
- Evaluate need for a full Flutter component library based on usage across projects

## Phase 10: Figma Integration

Bi-directional sync between Visor themes and Figma.

**Key work:**
- Export `.visor.yaml` to Figma Variables JSON
- Import Figma Variables to `.visor.yaml`

## Phase 11: User Accounts & Theme Marketplace

Users can save, share, and browse themes. Private themes supported.

**Key work:**
- Architecture TBD (web app, API, or hybrid)
- Private theme support (hard requirement)
- Public theme browsing without auth
- Authenticated users: save favorites, create private themes, access licensed fonts

**Note:** Phases 3–7 produce and consume local `.visor.yaml` files. This phase adds cloud persistence, sharing, and private theme storage with authentication.

---

## Migration Plan

Once Phases 1-4 are complete:

1. **Kaiah** — First retrofit (already referenced as source material)
2. **Reference NextJS App** — Migrate to Visor components + interchange format
3. **Low Orbit Decks** — Retrofit to use Visor deck category
4. **New projects** (Sked, Reboot, etc.) — Start on Visor from day one
5. **Existing projects** (Veronica, SoleSpark, ENTR, Blacklight) — Migrate as capacity allows
