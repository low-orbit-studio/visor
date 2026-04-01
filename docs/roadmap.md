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

## Phase 2.5: Foundation Hardening — COMPLETE

Stabilized the design system contract, completed the form system, added blocks infrastructure, and built a live design system specimen.

**Completed work:**
- [x] **Token contract audit & fixes** — Circular token references fixed, slate-to-gray fallback violations resolved, fumadocs CSS bridge cleaned up (VI-42, VI-23)
- [x] **Form system completion** — All form components documented. Specialized inputs added: password (show/hide), search (with clear), number (+/- controls), phone, OTP/PIN, tags/chip input, fieldset/legend grouping (VI-43, VI-30, VI-38)
- [x] **Form validation research spike** — Evaluated RHF + Zod vs Conform + Zod. **Decision: Conform + Zod** for server-first architecture, progressive enhancement, and better composability with Visor's Field pattern. ADR at `docs/decisions/001-form-validation-approach.md`. Form wrapper component implementation deferred to a future phase. (VI-44)
- [x] **Blocks infrastructure** — Registry supports blocks category, CLI support, 5+ blocks implemented including login-form, configuration-panel, design-system-deck, design-system-specimen, sphere-playground (VI-45)
- [x] **Design system specimen block** — Live interactive showcase responding to active theme (VI-46)

## Phase 3: Interchange Format, Import/Export, Validation & Basic Font Resolution — COMPLETE

Defined the `.visor.yaml` spec, built adapter layers, created a strict theme validator, and added basic font infrastructure.

See [interchange-format.md](./interchange-format.md) for the format spec and adapter design.

**Completed work:**
- [x] Design spike: `.visor.yaml` flat colors → 3-tier token mapping algorithm (VI-47) — see [`interchange-format.md`](./interchange-format.md)
- [x] Formal JSON Schema for `.visor.yaml` (VI-47) — see [`visor-theme.schema.json`](./visor-theme.schema.json)
- [x] Reconciled draft spec with actual 3-tier token system — interchange-format.md documents the full 4-stage pipeline (shade generation → semantic assignment → adaptive assembly → override application), implementation matches exactly
- [x] `packages/theme-engine/` — shared package with JSON Schema validation, OKLCH shade generation, import/export, mapping layer (VI-48)
- [x] Basic font infrastructure — Google Fonts URL resolution, `font-display`, preload hints (VI-51)
- [x] CLI commands: `theme apply`, `theme export`, `theme validate` — all implemented with tests and `--json` support
- [x] Adapters: NextJS, fumadocs, decks (VI-52)
- [x] Valid theme file completely transforms a Visor project (light + dark) — strict validator (VI-85) `checkResolvedCompleteness()` guarantees every token the design system needs is present in resolved output
- [x] `npx visor init --template nextjs` — end-to-end flow proven (VI-52)
- [x] CSS `@layer` strategy — 4-layer: visor-primitives, visor-semantic, visor-adaptive, visor-bridge (VI-52)
- [x] FOWT prevention — blocking `<script>` snippet + SSR guidance (VI-52)
- [x] Validator rules: completeness, WCAG contrast, type scale coherence, structural integrity, warnings (VI-49, VI-85)

## Phase 4: Theme Extraction — COMPLETE

Extracted design systems from existing projects into `.visor.yaml` themes. Both a deterministic CLI tool and an AI-powered Claude Code skill.

**Completed work:**
- [x] CLI: `npx visor theme extract [--from <path>] [--json]` — deterministic static analysis (VI-76)
- [x] Claude Code skill: registered in `~/.claude/skills/`, wraps CLI extract with AI ambiguity resolution (VI-77)
- [x] Test against real projects: Kaiah, Blacklight, reference-nextjs-app (VI-78)
- [x] Font extraction fixes: `@font-face` parsing, `var(--font-sans)` resolution, quote artifact cleanup (VI-82)
- Extracted themes are local `.visor.yaml` files (private by default; cloud storage comes in Phase 11)

## Phase 5: Docs Site & Theme Experience

Make the docs site a world-class showcase.

**Key work:**
- [x] Global theme switcher dropdown in docs header — every page is a live preview
- Upgrade the basic theme switcher (Phase 1a) to a polished global dropdown
- [x] Four-quadrant theme comparator (`/compare`) — 2 themes x light/dark showing real components
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
- ~~Visor Fonts CDN support (`visor-fonts` source type in .visor.yaml): R2-hosted fonts with @font-face generation~~ **DONE** (VI-81) — see `packages/theme-engine/src/fonts/`
- ~~Font upload CLI (`visor fonts add`): upload woff2 files to R2 CDN~~ **DONE** (VI-80) — see `packages/cli/src/commands/fonts-add.ts`
- ~~R2 CDN setup (fonts.visor.design)~~ **DONE** (VI-79) — Cloudflare R2 bucket with custom domain
- Font pairing with mood tags (leverage Blacklight's `epk_theme_font_pairing` system)
- Advanced font loading optimizations (subsetting, variable font support)
- Font weight/variant discovery from CDN (manifest-based)

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
