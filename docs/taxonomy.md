# Docs Taxonomy

> Category placement for all Visor components and hooks. This document is the source of truth for where each component's docs page lives in the sidebar hierarchy.

## Guiding Principles

1. **Alphabetize everything** — sidebar groups and pages within groups are A-Z (project convention)
2. **No tiny categories** — avoid groups with only 1-2 items; merge into broader groups
3. **Intuitive browsing** — categories should match how consumers think about components
4. **Hooks are peers, not children** — hooks get their own top-level docs section alongside components

## Component Categories

### data-display/

Components that present information to the user without accepting input.

| Component | Status | Notes |
|-----------|--------|-------|
| accordion | ✅ Documented | Expandable content sections |
| avatar | ❌ Needs page | Displays user identity (image, initials, fallback) |
| badge | ❌ Needs page | Small label for status, count, or category |
| card | ❌ Needs page | Content container for grouped information |
| carousel | ✅ Documented | Scrollable content panels |
| chart | ❌ Needs page | Data visualization (bar, line, pie, etc.) |
| code-block | ✅ Documented | Syntax-highlighted code display |
| collapsible | ✅ Documented | Single expandable section |
| image | ✅ Documented | Image with loading states |
| table | ✅ Documented | Tabular data display |
| timeline | ✅ Documented | Vertical timeline with status indicators |

### deck/

Presentation deck components — slide layouts, navigation, and deck-specific patterns.

| Component | Status | Notes |
|-----------|--------|-------|
| card-grid | ✅ Documented | Grid layout for slide cards |
| carousel-gallery | ✅ Documented | Image gallery with lightbox |
| closing-slide | ✅ Documented | Final slide template |
| concept-slide | ✅ Documented | Concept explanation layout |
| deck-footer | ✅ Documented | Persistent deck footer |
| deck-layout | ✅ Documented | Top-level deck wrapper |
| deck-renderer | ✅ Documented | Config-driven slide renderer |
| dot-nav | ✅ Documented | Dot-style slide navigation |
| hero-slide | ✅ Documented | Hero/title slide template |
| slide | ✅ Documented | Base slide wrapper |
| slide-header | ✅ Documented | Slide header bar |
| toc-slide | ✅ Documented | Table of contents slide |

### feedback/

Components that communicate status, progress, or alerts to the user.

| Component | Status | Notes |
|-----------|--------|-------|
| alert | ❌ Needs page | Inline status message (info, warning, error, success) |
| banner | ✅ Documented | Prominent site-wide notification |
| progress | ❌ Needs page | Bar/ring showing completion percentage |
| skeleton | ❌ Needs page | Loading placeholder that mimics content shape |
| toast | ✅ Documented | Temporary notification (Sonner-style) |

### form/

Interactive controls that accept user input.

| Component | Status | Notes |
|-----------|--------|-------|
| calendar | ✅ Documented | Date selection calendar |
| checkbox | ✅ Documented | Boolean toggle input |
| combobox | ✅ Documented | Searchable select with autocomplete |
| date-picker | ✅ Documented | Date input with calendar popup |
| field | ✅ Documented | Label + input + error message wrapper |
| fieldset | ✅ Documented | Group of related form fields |
| file-upload | ✅ Documented | File selection with drag-and-drop |
| form | ✅ Documented | Form container with validation |
| input | ✅ Documented | Single-line text input |
| label | ✅ Documented | Form field label |
| number-input | ✅ Documented | Numeric input with increment/decrement |
| otp-input | ✅ Documented | One-time password input |
| password-input | ✅ Documented | Password input with visibility toggle |
| phone-input | ✅ Documented | Phone number input with country code |
| radio-group | ✅ Documented | Single-select from a group of options |
| search-input | ✅ Documented | Search field with icon and clear button |
| select | ✅ Documented | Dropdown selection |
| slider | ✅ Documented | Range value input |
| slider-control | ❌ Needs page | Interactive slider with thumb control (distinct from display slider) |
| switch | ✅ Documented | Toggle switch input |
| tag-input | ✅ Documented | Multi-value tag entry |
| textarea | ✅ Documented | Multi-line text input |
| toggle-group | ✅ Documented | Multi-option toggle buttons |

### general/

Foundational utility components that don't fit a specific domain.

| Component | Status | Notes |
|-----------|--------|-------|
| button | ✅ Documented | Primary action trigger |
| scroll-area | ❌ Needs page | Custom scrollbar container |
| separator | ❌ Needs page | Visual divider (horizontal/vertical) |

### navigation/

Components that help users move through an application.

| Component | Status | Notes |
|-----------|--------|-------|
| breadcrumb | ❌ Needs page | Hierarchical location indicator |
| command | ✅ Documented | Command palette (cmdk-style) |
| menubar | ✅ Documented | Horizontal menu bar |
| navbar | ✅ Documented | Top-level app navigation |
| pagination | ✅ Documented | Page navigation controls |
| sidebar | ❌ Needs page | App-level side navigation |
| stepper | ✅ Documented | Multi-step progress indicator |
| tabs | ❌ Needs page | Tabbed content navigation |

### overlay/

Components that appear above the main content layer.

| Component | Status | Notes |
|-----------|--------|-------|
| context-menu | ✅ Documented | Right-click menu |
| dialog | ❌ Needs page | Modal dialog window |
| dropdown-menu | ❌ Needs page | Trigger-activated dropdown menu |
| fullscreen-overlay | ✅ Documented | Full-viewport overlay |
| hover-card | ✅ Documented | Preview card on hover |
| lightbox | ✅ Documented | Image viewer overlay |
| popover | ✅ Documented | Floating content panel |
| sheet | ❌ Needs page | Slide-out side panel |
| tooltip | ❌ Needs page | Informational hover/focus popup |

### specimen/

Design system showcase components for documenting tokens and design decisions.

| Component | Status | Notes |
|-----------|--------|-------|
| accessibility-specimen | ✅ Documented | Accessibility feature showcase |
| color-swatch | ✅ Documented | Color token display |
| elevation-card | ✅ Documented | Shadow/elevation display |
| icon-grid | ✅ Documented | Icon set browser |
| motion-specimen | ✅ Documented | Animation/transition preview |
| opacity-bar | ✅ Documented | Opacity level display |
| radius-scale | ✅ Documented | Border radius scale |
| spacing-scale | ✅ Documented | Spacing token scale |
| surface-row | ✅ Documented | Surface/background display |
| type-specimen | ✅ Documented | Typography scale display |

### typography/

Text rendering components.

| Component | Status | Notes |
|-----------|--------|-------|
| heading | ✅ Documented | Semantic heading (h1-h6) |
| text | ✅ Documented | Body text with variants |

### visual-elements/

Decorative and ambient visual components.

| Component | Status | Notes |
|-----------|--------|-------|
| sphere | ✅ Documented | 3D sphere animation |

## Hooks Section

Hooks get a **new top-level docs section** at `packages/docs/content/docs/hooks/`, registered as a peer to `components` in the sidebar.

**Rationale:** Hooks are a fundamentally different abstraction from components — they provide stateful logic, not UI. Nesting them under components would confuse the mental model. As a top-level section, they're easy to discover and browse independently.

**Subcategories:** With 14 hooks, a flat list is manageable. No subcategories needed yet. If the count grows past ~20, consider grouping by concern (state, DOM, navigation).

| Hook | Description |
|------|-------------|
| use-boolean | Boolean state with toggle/setTrue/setFalse helpers |
| use-click-outside | Click/touch outside detection |
| use-currency | Locale-aware currency formatting |
| use-debounce | Delayed value updates |
| use-focus-trap | Keyboard focus containment |
| use-intersection-animation | Scroll-driven animation index |
| use-intersection-observer | Viewport visibility tracking |
| use-keyboard-nav | Arrow key index navigation |
| use-keyboard-shortcut | Keyboard shortcut binding |
| use-local-storage | Persistent state with SSR safety |
| use-media-query | CSS media query matching |
| use-previous | Previous render value |
| use-slide-engine | Programmatic section scrolling |
| use-wheel-nav | Wheel-to-index navigation |

## Recategorization Assessment

No existing components need to be moved. Current placements are consistent with the taxonomy above.

## Summary

| Category | Current Pages | After Placement | Net New |
|----------|--------------|-----------------|---------|
| data-display | 7 | 11 | +4 (avatar, badge, card, chart) |
| deck | 12 | 12 | — |
| feedback | 2 | 5 | +3 (alert, progress, skeleton) |
| form | 22 | 23 | +1 (slider-control) |
| general | 1 | 3 | +2 (scroll-area, separator) |
| navigation | 5 | 8 | +3 (breadcrumb, sidebar, tabs) |
| overlay | 5 | 9 | +4 (dialog, dropdown-menu, sheet, tooltip) |
| specimen | 10 | 10 | — |
| typography | 2 | 2 | — |
| visual-elements | 1 | 1 | — |
| **hooks** (new) | — | 14 | +14 |
| **Total** | 67 | 98 | +31 |
