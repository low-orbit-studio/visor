# Visor Roadmap

Phases are sequential but may overlap. Status is updated as work progresses.

## Phase 1a: Core Expansion + Theme Architecture Validation — COMPLETE

Validated the theming architecture with a second standard theme while expanding the component library from 25 to 40 components.

**Completed work:**
- [x] Promoted interactive tokens to the adaptive layer
- [x] Created **"Neutral" standard theme** (zinc palette, sections 1-4)
- [x] Added **theme switcher** to the docs site header
- [x] Added 15 priority components (table, accordion, toast, popover, radio group, slider, combobox, navbar, pagination, command palette, toggle group, context menu, hover card, menubar, banner)
- [x] Added axe-core a11y testing to vitest setup
- [x] Replaced tailwind-merge with plain clsx
- [x] All components are fully theme-agnostic (CSS Modules + CSS custom properties)
- [x] Upgraded to fumadocs v16, Next.js 16, React 19.2
- [x] Added minimal MDX documentation for all components

## Phase 1b: Remaining Components + Deck — COMPLETE

Completed the component library and added the deck category.

**Completed work:**
- [x] Added remaining general-purpose components (stepper, code block, timeline, heading, text, date picker, file upload, carousel, lightbox, image)
- [x] Added 12 deck components as a separate registry category (`npx visor add --category deck`)
- [x] Moved tests from reference-nextjs-app to Visor — 100% coverage target
- [x] Added component composition tests (dialog + form, sidebar + nav, dropdown in table)

## Phase 2: AI Agent Consumability — COMPLETE

Made Visor understandable and usable by AI agents.

See [ai-consumability.md](./ai-consumability.md) for the full spec.

**Completed work:**
- [x] Component metadata manifests — structured YAML/JSON per component
- [x] Single registry manifest (`visor-manifest.json`)
- [x] Composition patterns/recipes

**Remaining (deferred to later phase):**
- Agent-first CLI enhancements — `--json` flag on all commands, rich `--help`, composable commands, structured output

## Phase 2.5: Foundation Hardening — IN PROGRESS

Stabilize the design system contract, complete the form system, add blocks infrastructure, and build a live design system specimen. This foundation must be solid before the interchange format can codify it.

**Key work:**
- **Token contract audit & fixes** — Fix circular token references, slate-to-gray fallback violations, missing theme contract tokens, fumadocs CSS bridge cleanup. Iterative — tokens will expand as new components surface gaps.
- **Form system completion** — Document all undocumented form components (checkbox, input, label, select, switch, textarea, field). Add missing specialized inputs: password (show/hide), search (with clear), number (+/- controls), phone, OTP/PIN, tags/chip input, fieldset/legend grouping.
- **Form validation research spike** — Evaluate React Hook Form + Zod vs Conform + Zod vs other approaches for a Form wrapper component with schema validation support.
- **Blocks infrastructure** — Add "blocks" concept to the registry (multi-component composed patterns, distinct from individual components). CLI support, own docs sidebar section. Blocks are copy-and-own like components but represent complete UI patterns (login form, settings page, dashboard panel).
- [x] **Design system specimen block** — Live interactive showcase in the docs site that responds to the active theme. Visual specimen for colors, typography, spacing, shadows, elevation, radius, motion, accessibility contrast. Pull patterns from reference-nextjs-app (12-slide specimen) and Veronica (form/button/chip specimens, ComponentShowcase with force-state system).

**Source material:**
- Reference NextJS App: `~/Code/low-orbit/low-orbit-playbook/reference-nextjs-app/` — ColorSwatchGrid, ElevationGrid, SpacingScale, TypeRow, AccessibilitySpecimen, etc.
- Veronica Planning: `~/Code/veronica/veronica-planning/` — FormSpecimen, ButtonSpecimen, ChipSpecimen, ComponentShowcase

## Phase 3: Interchange Format, Import/Export, Validation & Basic Font Resolution

Define the `.visor.yaml` spec, build adapter layers, create a theme validator, and add basic font infrastructure.

See [interchange-format.md](./interchange-format.md) for the format spec and adapter design.

**Key work:**
- ~~**Design spike first:** Document the exact algorithm for `.visor.yaml` flat colors → 3-tier token mapping~~ **DONE** (VI-47) — see [`interchange-format.md`](./interchange-format.md) for complete mapping algorithm, JSON Schema, and edge cases
- ~~Finalize the interchange format spec with a formal JSON Schema~~ **DONE** (VI-47) — see [`visor-theme.schema.json`](./visor-theme.schema.json)
- Reconcile the draft spec with the actual 3-tier token system (the draft uses flat color names; tokens use primitives → semantic → adaptive)
- ~~Build `packages/theme-engine/` — shared package housing:~~ **DONE** (VI-48)
  - ~~JSON Schema for `.visor.yaml` validation~~ **DONE** (VI-48)
  - ~~Shade generation algorithm (OKLCH-based, generates 50–950 scale from a base hex)~~ **DONE** (VI-48)
  - ~~Import: parse `.visor.yaml` → generate CSS custom property overrides~~ **DONE** (VI-48)
  - ~~Export: read current theme tokens → produce `.visor.yaml`~~ **DONE** (VI-48)
  - ~~Mapping layer: flat `.visor.yaml` colors → primitive shade scales → semantic/adaptive token assignment~~ **DONE** (VI-48)
- ~~**Basic font infrastructure:** Google Fonts URL resolution from family name, `font-display` strategy, preload hint generation (the interchange format needs this to be complete)~~ **DONE** (VI-51) — see `packages/theme-engine/src/fonts/`
- CLI commands:
  - `npx visor theme apply <file>` — reads `.visor.yaml`, generates full CSS token overrides
  - `npx visor theme export [--format yaml|json|figma]` — exports current theme
  - `npx visor theme validate <file> [--json]` — runs full validation ruleset
- ~~Build adapters: NextJS, fumadocs, decks~~ **DONE** (VI-52) — see `packages/theme-engine/src/adapters/`
- Ensure any valid theme file completely transforms a Visor project (light + dark)
- ~~**Minimal `npx visor init`:** Single starter template proving the end-to-end flow (theme file → working project)~~ **DONE** (VI-52) — `npx visor init --template nextjs`
- ~~Decide on CSS `@layer` strategy for token output specificity~~ **DONE** (VI-52) — 4-layer strategy: visor-primitives, visor-semantic, visor-adaptive, visor-bridge
- ~~Add FOWT (Flash of Wrong Theme) prevention: blocking `<script>` snippet for consumer projects + SSR guidance~~ **DONE** (VI-52) — see `packages/theme-engine/src/fowt.ts`

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
- [x] CLI: `npx visor theme extract [--from <path>] [--json]` — deterministic static analysis
  - Scan targets: CSS custom properties, globals.css, CSS module files, tailwind config, package.json
  - Output: best-effort `.visor.yaml` with confidence annotations (high/medium/low per mapped token)
  - Ambiguous mappings flagged for human/AI review
- [x] Claude Code skill: registered in `~/.claude/skills/` following playbook patterns
  - Wraps the CLI extract command
  - Uses AI to resolve ambiguities (e.g., which blue is "primary"?)
  - Interprets design intent from variable naming and usage patterns
  - Produces a complete, validated `.visor.yaml`
- [x] Test against real projects: Kaiah, Blacklight, reference-nextjs-app
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
