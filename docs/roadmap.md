# Visor Roadmap

> **Roadmap has moved to Linear.** Active roadmap tracking is now in Linear Projects
> under the Visor (VI) team — see https://linear.app/low-orbit-studio/team/VI/projects
>
> This file is a historical snapshot kept for context. For current status, progress,
> and upcoming work, use Linear.

---

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

**Completed (initially deferred, now done):**
- [x] Agent-first CLI enhancements — `--json` flag on ALL commands, rich `--help` via Commander, `--category` filtering
- [x] `CONSUMER_CLAUDE.md` — comprehensive AI agent context file for downstream project consumers
- [x] `visor info <component> --json` — single-component metadata query
- [x] `visor pattern list` / `visor pattern info` — pattern discovery CLI commands
- [x] `visor suggest --for "use case"` — AI-driven component suggestion

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
- Extracted themes are local `.visor.yaml` files (private by default; cloud storage comes in Phase 12)

## Phase 5: Docs Site & Theme Experience — COMPLETE

Made the docs site a world-class showcase with live theme previews, visual comparison, and regression testing.

**Completed work:**
- [x] Global theme switcher dropdown in docs header — every page is a live preview
- [x] Four-quadrant theme comparator (`/compare`) — 2 themes × light/dark showing real components (VI-91)
- [x] Full MDX documentation for every component
- [x] All examples respond to the active theme
- [x] Visual regression testing — Playwright screenshots across all themes × light/dark (VI-88)

## Phase 5.5: Internal Adoption Readiness — COMPLETE

Unblocked Visor consumption across Low Orbit projects. `npm install` and `npx visor add` are fully functional for internal use.

**Completed work:**
- [x] **First npm publish** — Release workflow rewritten to use changesets/action (push-to-main trigger, all 3 packages). First publish via `changeset publish` — requires OTP or automation token (VI-124)
- [x] **Fix theme-engine raw TS export** — Removed broken `./fonts` subpath export; fonts already re-exported from main entry (VI-145)
- [x] **Theme distribution strategy** — Separated stock themes (shipped in public repo) from proprietary themes (gitignored, locally discoverable). `custom-themes/` path with `.gitignore` support (VI-148)
- [x] **Post-npm docs cleanup** — Removed stale pre-publish warnings, filled block prop docs gaps, fixed "use client" annotations surfaced in dogfood runs (VI-149)
- [x] **Research spike: proprietary theme strategy** — Theme distribution strategy researched and implemented (VI-148)
- [x] **Dogfood testing** — Admin blocks tested rigorously through multiple rounds (VI-141/142, VI-146/147)

## Phase 5.5b: Open Source Readiness

Prepare Visor for public adoption. Not required for internal use — do this when ready to market Visor externally.

**Key work:**
- [x] **Proprietary theme implementation** — Stock vs custom theme separation shipped in VI-148; custom-themes gitignored, CLI discovers both
- [x] **Fonts CDN CORS** — Restrict `fonts.visor.design` to allowed origins via Cloudflare R2/Workers (VI-175)
- [ ] **Community infrastructure** — FUNDING.yml, GitHub Discussions, good-first-issue labels still pending (VI-176); issue/PR templates already done
- [x] **Changelog & releases** — Wire up changesets auto-publish workflow, generate first CHANGELOG.md
- [x] **Getting-started guide** — Standalone "zero to first component" page (migration guide covers retrofits, not new projects)
- [x] **Competitive analysis** — Study shadcn/ui, Radix, Mantine, Park UI for gaps ✓ ([VI-122](https://linear.app/low-orbit-studio/issue/VI-122) → `docs/research/token-architecture-spike.md`)
- [x] **Governance & sustainability** — GOVERNANCE.md, CONTRIBUTING.md, MAINTAINERS.md all at repo root (VI-177)
- [x] **Marketing surface** — README badges, social preview, npm README, "used by" section, GitHub topics (VI-178)

## Phase 6: Admin UI Category — COMPLETE

Added a first-class `admin` registry category so Visor consumers can assemble internal tools and CRUD apps fast. Ships 10 admin-flavored compounds and 7 drop-in blocks, all theme-agnostic, fully documented, and installable via `npx visor add --category admin`.

See [component-inventory.md](./component-inventory.md) for the full list.

**Completed work:**
- [x] 10 admin compounds: activity-feed, bulk-action-bar, confirm-dialog, data-table, empty-state, filter-bar, kbd, page-header, stat-card, status-badge (VI-139, VI-140)
- [x] 7 admin blocks: admin-shell, admin-dashboard, admin-list-page, admin-detail-drawer, admin-tabbed-editor, admin-settings-page, admin-wizard (VI-141)
- [x] Per-component and per-block MDX docs with live demos, props tables, and metadata
- [x] Registry entries tagged `category: "admin"`; `npx visor list --category admin` surfaces the whole set
- [x] Cross-references to existing `patterns/*.visor-pattern.yaml` (dashboard-layout, crud-table, data-table-with-filters, settings-page)
- [x] Admin UI section added to `docs/component-inventory.md`
- [x] VI-138 epic closed by VI-142

## Phase 7: Visual Theme Creator — COMPLETE

A visual theme creation experience in the docs site with harmonious color generation and clone-to-modify workflow.

**Completed work:**
- [x] Lives in the docs site at `/create`
- [x] Color picker with shade generation: pick base primary + accent colors, OKLCH algorithm generates full shade palettes
- [x] Typography section: Google Fonts API selector, weight picker, scale preview
- [x] Spacing/radius/shadow controls with sensible defaults
- [x] "Start from" dropdown: blank theme, or clone any existing theme (loads `.visor.yaml` as starting state)
- [x] Real-time preview panel showing actual Visor components (button, card, input, badge, alert, dialog) with in-progress theme applied via CSS custom property injection
- [x] Light/dark mode toggle in preview
- [x] Live validation: runs Phase 3 validator continuously, shows warnings/errors inline
- [x] Export button: downloads `.visor.yaml` file
- [x] "Apply to project" shortcut: copies CLI command to clipboard
- [x] Depends on `packages/theme-engine/` (shade generator, validator, mapper)

## Phase 8: Advanced Font Infrastructure

Blacklight font library and font pairing intelligence. Basic font resolution (Google Fonts, `font-display`) ships in Phase 3.

**Key work:**
- ~~Visor Fonts CDN support (`visor-fonts` source type in .visor.yaml): R2-hosted fonts with @font-face generation~~ **DONE** (VI-81) — see `packages/theme-engine/src/fonts/`
- ~~Font upload CLI (`visor fonts add`): upload woff2 files to R2 CDN~~ **DONE** (VI-80) — see `packages/cli/src/commands/fonts-add.ts`
- ~~R2 CDN setup (fonts.visor.design)~~ **DONE** (VI-79) — Cloudflare R2 bucket with custom domain
- Font pairing with mood tags (leverage Blacklight's `epk_theme_font_pairing` system)
- Advanced font loading optimizations (subsetting, variable font support)
- Font weight/variant discovery from CDN (manifest-based)

## Phase 9: Project Templates & Starters

`npx visor init --template <name>` scaffolds a complete, themed, working app. A minimal single-template `npx visor init` ships in Phase 3; this phase expands to a full template gallery.

**Templates:**
- `dashboard` — Sidebar nav, header, main content area, cards
- `marketing` — Landing page with hero, features, CTA, footer
- `admin` — Table views, forms, CRUD patterns
- `docs` — Documentation site (fumadocs-based)
- `deck` — Pitch deck with slide framework

## Phase 10: Flutter Token Distribution — IN PROGRESS (Phase 10a)

Generate Dart `ThemeData` from `.visor.yaml` so Flutter projects consume the same design system.

Active execution underway: VI-185 (M2: Full Token Emission), VI-202 (visor add --target flutter), VI-203 (Widgetbook preview app), VI-205 (Flutter docs), VI-206 (pub.dev publish), VI-216–219 (theme foundation, widget survey).

**Key work:**
- Build `visor-adapter-flutter` (reference: Blacklight's `generate-flutter.ts`)
- Colors, typography, spacing, radius, shadows all map to Flutter equivalents
- Evaluate need for a full Flutter component library based on usage across projects

## Phase 11: Figma Integration

Bi-directional sync between Visor themes and Figma.

**Key work:**
- Export `.visor.yaml` to Figma Variables JSON
- Import Figma Variables to `.visor.yaml`

## Phase 12: User Accounts & Theme Marketplace

Users can save, share, and browse themes. Private themes supported.

**Key work:**
- Architecture TBD (web app, API, or hybrid)
- Private theme support (hard requirement)
- Public theme browsing without auth
- Authenticated users: save favorites, create private themes, access licensed fonts

**Note:** Phases 3–8 produce and consume local `.visor.yaml` files. This phase adds cloud persistence, sharing, and private theme storage with authentication.

---

## Migration Plan

Once Phases 1-4 are complete:

1. **Kaiah** — First retrofit (already referenced as source material)
2. **Reference NextJS App** — Migrate to Visor components + interchange format
3. **Low Orbit Decks** — Retrofit to use Visor deck category
4. **New projects** (Sked, Reboot, etc.) — Start on Visor from day one
5. **Existing projects** (Veronica, ~~SoleSpark~~ ✓, ENTR, Blacklight) — Migrate as capacity allows
