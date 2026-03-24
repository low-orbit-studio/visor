# Component Inventory

## Current Components (25)

### Form (8)
- button, input, label, textarea, checkbox, select, switch, field

### Container / Layout (4)
- card, badge, sidebar, sheet

### Content Display (4)
- avatar, separator, skeleton, progress

### Interaction (5)
- dialog, dropdown-menu, tabs, breadcrumb, scroll-area

### Feedback (3)
- alert, tooltip, chart

## Phase 1a: Priority Components (~15)

Highest-value general-purpose components. Built alongside the second standard theme to validate theming across each new component.

### Navigation
- [ ] Navbar
- [ ] Pagination
- [ ] Command Palette (cmdk-style)

### Data Display
- [ ] Table / DataTable
- [ ] Accordion / Collapsible

### Feedback
- [ ] Toast (Sonner-style)
- [ ] Popover
- [ ] Banner / Callout

### Form
- [ ] Radio Group
- [ ] Slider / Range
- [ ] Combobox / Autocomplete
- [ ] Toggle Group

### Overlay
- [ ] Context Menu
- [ ] Hover Card
- [ ] Menubar

## Phase 1b: Remaining Components + Deck

### Remaining General-Purpose
- [ ] Stepper / Wizard
- [ ] Code Block (with syntax highlighting)
- [ ] Timeline
- [ ] Date Picker
- [ ] File Upload
- [ ] Carousel
- [ ] Lightbox / Image Viewer
- [ ] Image (with loading states)
- [ ] Heading
- [ ] Text / Prose

### Deck Components (Separate Category)

Accessible via `npx visor add --category deck` or individually.

- [ ] Slide (base wrapper)
- [ ] DeckLayout
- [ ] DeckHeroSlide
- [ ] SlideHeader
- [ ] CardGrid
- [ ] DotNav
- [ ] TOCSlide
- [ ] ClosingSlide
- [ ] ConceptSlide
- [ ] CarouselGallery
- [ ] ImageLightbox
- [ ] Footer (deck variant)

## Current Hooks (9)

- use-media-query, use-debounce, use-click-outside, use-local-storage
- use-intersection-observer, use-keyboard-shortcut, use-focus-trap
- use-previous, use-boolean

## Source Material

| Source | Path | Use |
|--------|------|-----|
| Reference NextJS App | `~/Code/low-orbit/low-orbit-playbook/reference-nextjs-app/` | 69 test files to migrate, deck components, design system specimens |
| Low Orbit Decks | `~/Code/low-orbit/low-orbit-decks/` | Deck framework, config-driven slides, per-client theming |
| Kaiah UI | `~/Code/kaiah/kaiah-app/packages/ui/src/components/ui/` | Component implementations |
| Blacklight tokens | `~/Code/blacklight/packages/design-tokens/` | Token generation pipeline |

## Testing Strategy

- **Phase 1a:** Add axe-core a11y testing to vitest setup; all new components include a11y tests from day one
- **Phase 1b:** Move tests from reference-nextjs-app to Visor (not copy — Visor becomes source of truth). Verify reference-nextjs-app doesn't depend on these tests for its own CI before moving.
- 100% test coverage for all components
- Vitest + React Testing Library
- Add component composition tests (dialog + form, sidebar + nav, dropdown in table)
