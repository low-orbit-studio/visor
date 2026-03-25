# Component Inventory

## Current Components (53)

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

## Current Hooks (9)

- use-boolean, use-click-outside, use-debounce, use-focus-trap
- use-intersection-observer, use-keyboard-shortcut, use-local-storage
- use-media-query, use-previous

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
