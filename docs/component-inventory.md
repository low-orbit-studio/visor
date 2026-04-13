# Component Inventory

## Current Components (83)

### Form (22)
- button, calendar, checkbox, combobox, date-picker, field, fieldset, file-upload, input, label, number-input, otp-input, password-input, phone-input, radio-group, search-input, select, slider, switch, tag-input, textarea, toggle-group

### Container / Layout (4)
- badge, card, sheet, sidebar

### Content Display (8)
- accordion, avatar, carousel, collapsible, image, progress, separator, skeleton

### Navigation (4)
- breadcrumb, command, navbar, pagination

### Interaction (3)
- dropdown-menu, scroll-area, tabs

### Overlay (6)
- context-menu, dialog, hover-card, lightbox, menubar, popover

### Feedback (6)
- alert, banner, chart, table, toast, tooltip

## Phase 1a: Priority Components — COMPLETE

All 15 priority components shipped.

### Navigation
- [x] Navbar
- [x] Pagination
- [x] Command Palette (cmdk-style)

### Data Display
- [x] Table / DataTable
- [x] Accordion / Collapsible

### Feedback
- [x] Toast (Sonner-style)
- [x] Popover
- [x] Banner / Callout

### Form
- [x] Radio Group
- [x] Slider / Range
- [x] Combobox / Autocomplete
- [x] Toggle Group

### Overlay
- [x] Context Menu
- [x] Hover Card
- [x] Menubar

## Phase 1b: Remaining Components + Deck

### Remaining General-Purpose
- [x] Stepper / Wizard
- [x] Code Block (with syntax highlighting)
- [x] Timeline
- [x] Date Picker
- [x] File Upload
- [x] Carousel
- [x] Lightbox / Image Viewer
- [x] Image (with loading states)
- [x] Heading
- [x] Text / Prose

### Deck Components (Separate Category)

Accessible via `npx visor add --category deck` or individually.

- [x] Slide (base wrapper)
- [x] DeckLayout
- [x] DeckHeroSlide
- [x] SlideHeader
- [x] CardGrid
- [x] DotNav
- [x] TOCSlide
- [x] ClosingSlide
- [x] ConceptSlide
- [x] CarouselGallery
- [x] ImageLightbox (covered by existing Visor Lightbox — CarouselGallery uses it)
- [x] Footer (deck variant)

## Admin UI

Admin-flavored compounds and blocks for building internal tools fast. Installable via `npx visor add --category admin`. See [docs/roadmap.md](./roadmap.md) Phase 6 — Admin UI Category.

### Compounds (10)

- **activity-feed** — vertical list of timestamped events for dashboards, audit logs, and notification views
- **bulk-action-bar** — sticky or inline toolbar that appears when rows are selected, with live-announced selection count and dismiss affordance
- **confirm-dialog** — severity-driven confirmation dialog with optional confirm-text gate and async-aware confirm handler
- **data-table** — Tanstack-powered table compound with sorting, pagination, selection, global filter, loading, and empty states
- **empty-state** — placeholder for empty lists, tables, search results, and dashboard regions with icon, heading, description, and action slots
- **filter-bar** — search input, filter controls slot, removable active-filter chips, results count, and clear-all affordance above a data-table
- **kbd** — tiny primitive for rendering keyboard shortcuts using the semantic `<kbd>` element
- **page-header** — eyebrow, title, description, breadcrumb, and actions slots with container-query responsive collapse
- **stat-card** — dashboard metric card with label, value, delta, trend, and footer slots
- **status-badge** — semantic wrapper over Badge mapping admin status names (healthy, degraded, down, running, pending, failed, etc.) to visual variants with optional indicator dot

### Blocks (7)

- **admin-shell** — foundational admin layout with sidebar, topbar, and main content area; slot-driven for logo, navigation, breadcrumbs, user menu, and status indicators
- **admin-dashboard** — drop-in overview composition with PageHeader, responsive stat grid, optional secondary region, and ActivityFeed with empty-state fallback
- **admin-list-page** — CRUD list archetype composing PageHeader, FilterBar, DataTable, BulkActionBar, and EmptyState into a single drop-in page
- **admin-detail-drawer** — right-side slide-out panel for viewing or editing a single record, with sticky save/cancel footer and unsaved-changes guard
- **admin-tabbed-editor** — full-page editor with horizontal tabs, tab-scoped content panels, sticky save/cancel footer, and unsaved-changes guard
- **admin-settings-page** — long scrollable settings archetype with labeled sections, optional sticky left-side nav, and global-or-per-section save modes
- **admin-wizard** — guided multi-step flow composing PageHeader, Stepper, and Button with per-step async validation, final submit, and cancel guard

## Current Hooks (14)

- use-boolean, use-click-outside, use-currency, use-debounce, use-focus-trap
- use-intersection-animation, use-intersection-observer, use-keyboard-nav
- use-keyboard-shortcut, use-local-storage, use-media-query, use-previous
- use-slide-engine, use-wheel-nav

## Source Material

| Source | Path | Use |
|--------|------|-----|
| Reference NextJS App | `~/Code/low-orbit/low-orbit-playbook/reference-nextjs-app/` | 69 test files to migrate, deck components, design system specimens |
| Low Orbit Decks | `~/Code/low-orbit/low-orbit-decks/` | Deck framework, config-driven slides, per-client theming |
| Kaiah UI | `~/Code/kaiah/kaiah-app/packages/ui/src/components/ui/` | Component implementations |
| Blacklight tokens | `~/Code/blacklight/packages/design-tokens/` | Token generation pipeline |

## Testing Strategy

- **Phase 1a:** ~~Add axe-core a11y testing to vitest setup~~ — DONE
- **Phase 1b:** Move tests from reference-nextjs-app to Visor (not copy — Visor becomes source of truth). Verify reference-nextjs-app doesn't depend on these tests for its own CI before moving.
- 100% test coverage for all components
- Vitest + React Testing Library
- Add component composition tests (dialog + form, sidebar + nav, dropdown in table)
