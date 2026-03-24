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

## Target Components to Add (~30)

### Navigation
- [ ] Navbar
- [ ] Pagination
- [ ] Command Palette (cmdk-style)
- [ ] Stepper / Wizard

### Data Display
- [ ] Table / DataTable
- [ ] Accordion / Collapsible
- [ ] Code Block (with syntax highlighting)
- [ ] Timeline

### Feedback
- [ ] Toast (Sonner-style)
- [ ] Popover
- [ ] Banner / Callout

### Form
- [ ] Radio Group
- [ ] Slider / Range
- [ ] Date Picker
- [ ] Combobox / Autocomplete
- [ ] File Upload
- [ ] Toggle Group

### Overlay
- [ ] Context Menu
- [ ] Hover Card
- [ ] Menubar

### Media
- [ ] Carousel
- [ ] Lightbox / Image Viewer
- [ ] Image (with loading states)

### Typography
- [ ] Heading
- [ ] Text / Prose

## Deck Components (Separate Category)

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

- Move tests from reference-nextjs-app to Visor (not copy — Visor becomes source of truth)
- 100% test coverage for all components
- Vitest + React Testing Library
