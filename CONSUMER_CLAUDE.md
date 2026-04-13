# Visor — AI Agent Context

> Copy this file into your consuming project as `CLAUDE.md` (or merge the Visor section below into your existing `CLAUDE.md`). This tells AI agents everything they need to work correctly with Visor components.

---

## Visor Design System

This project uses **Visor** — Low Orbit Studio's shared design system. Visor uses a two-layer distribution model:

1. **Components** — shadcn-style registry (copy-and-own). Source files live in this project and are fully editable.
2. **Tokens** — `@loworbitstudio/visor-core` npm package. CSS custom properties for design consistency. Updated via `npm update`.

### Key Principle

Components are **owned by this project**. They were copied in from the Visor registry and are now local source files. Editing them is expected and encouraged.

---

## Adding Components

```sh
npx visor add <component-name>          # Add one component
npx visor add button input label card   # Add multiple at once
npx visor add --category form           # Add all components in a category
```

After running, source files appear at `components/ui/<component-name>/`.

To pull the latest upstream version:

```sh
npx visor add <component-name> --force
```

---

## Component Catalog (71)

### Data Display (7)

| Component | Description |
| --- | --- |
| `accordion` | Vertically stacked expandable panels |
| `avatar` | User or entity image with fallback initials |
| `badge` | Small status or category label |
| `card` | Contained surface for grouping related content |
| `chart` | Data visualization wrapper using Recharts |
| `table` | Structured data display with header, body, and footer rows |
| `timeline` | Chronological list of events with connectors |

### Feedback (7)

| Component | Description |
| --- | --- |
| `alert` | Inline callout for important messages |
| `banner` | Full-width notification bar |
| `popover` | Floating content panel anchored to a trigger |
| `progress` | Horizontal bar indicating completion |
| `skeleton` | Placeholder shimmer for loading states |
| `toast` | Non-blocking notification that auto-dismisses |
| `tooltip` | Small label shown on hover/focus |

### Form (24)

| Component | Description |
| --- | --- |
| `button` | Primary interactive element for triggering actions |
| `calendar` | Month-view date grid for date selection |
| `checkbox` | Toggleable boolean input |
| `combobox` | Searchable dropdown with free-text input |
| `date-picker` | Calendar-backed date input with popover |
| `field` | Wrapper for label, input, description, and error message |
| `fieldset` | Groups related form fields with optional legend |
| `file-upload` | Drag-and-drop or click-to-upload file input |
| `form` | Form wrapper with validation context |
| `input` | Single-line text input (sizes: sm, md, lg) |
| `label` | Accessible text label for form controls |
| `number-input` | Numeric input with increment/decrement buttons |
| `otp-input` | Multi-digit one-time-password input |
| `password-input` | Masked input with show/hide toggle and strength meter |
| `phone-input` | Phone number input with country code selector |
| `radio-group` | Single-select from a group of options |
| `search-input` | Input with search icon and clear button |
| `select` | Dropdown single-select (sizes: sm, md, lg) |
| `slider` | Range input with track and thumb |
| `slider-control` | Labeled slider with value display |
| `switch` | Toggle between on/off states |
| `tag-input` | Multi-value input with tag chips |
| `textarea` | Multi-line text input |
| `toggle-group` | Multi-option toggle button group |

### Layout (4)

| Component | Description |
| --- | --- |
| `collapsible` | Show/hide content with animated expand/collapse |
| `scroll-area` | Custom scrollbar container |
| `separator` | Visual divider between sections |
| `sidebar` | Collapsible side navigation panel |

### Media (3)

| Component | Description |
| --- | --- |
| `carousel` | Horizontally scrollable content slider |
| `image` | Responsive image with loading states |
| `lightbox` | Full-screen image viewer overlay |

### Navigation (6)

| Component | Description |
| --- | --- |
| `breadcrumb` | Hierarchical page location trail |
| `command` | Command palette for search and actions |
| `navbar` | Horizontal top navigation bar |
| `pagination` | Page navigation with prev/next and page links |
| `stepper` | Multi-step progress indicator |
| `tabs` | Tabbed content switcher |

### Overlay (7)

| Component | Description |
| --- | --- |
| `context-menu` | Right-click contextual menu |
| `dialog` | Modal dialog with backdrop overlay |
| `dropdown-menu` | Button-triggered dropdown menu |
| `fullscreen-overlay` | Full-viewport overlay for immersive content |
| `hover-card` | Content card shown on hover |
| `menubar` | Horizontal menu bar with dropdown sub-menus |
| `sheet` | Slide-in panel from any edge |

### Specimen (10)

| Component | Description |
| --- | --- |
| `accessibility-specimen` | Interactive ARIA attribute showcase |
| `color-swatch` | Color token display with hex/label |
| `elevation-card` | Box-shadow scale demonstration |
| `icon-grid` | Icon catalog grid |
| `motion-specimen` | Animation and transition preview |
| `opacity-bar` | Opacity scale demonstration |
| `radius-scale` | Border-radius scale demonstration |
| `spacing-scale` | Spacing token scale demonstration |
| `surface-row` | Surface token color demonstration |
| `type-specimen` | Typography scale demonstration |

### Typography (3)

| Component | Description |
| --- | --- |
| `code-block` | Syntax-highlighted code display |
| `heading` | Semantic heading (h1–h6) with visual size override |
| `text` | General-purpose text element with size variants |

---

## Hooks (14)

```sh
npx visor add <hook-name>
```

| Hook | Description |
| --- | --- |
| `use-boolean` | Stable toggle/setTrue/setFalse helpers for boolean state |
| `use-click-outside` | Fires callback on click/touch outside a referenced element |
| `use-currency` | Locale-aware currency symbol and price formatter |
| `use-debounce` | Delays value updates for high-frequency events |
| `use-focus-trap` | Traps keyboard focus within a container |
| `use-intersection-animation` | Updates active index based on section visibility |
| `use-intersection-observer` | Tracks element viewport visibility via IntersectionObserver |
| `use-keyboard-nav` | Arrow/Home/End navigation between indexed sections |
| `use-keyboard-shortcut` | Fires callback on keyboard shortcut with modifier keys |
| `use-local-storage` | Persists state to localStorage with SSR safety |
| `use-media-query` | SSR-safe CSS media query match detection |
| `use-previous` | Returns previous render value of a variable |
| `use-slide-engine` | Smooth programmatic scrolling between sections |
| `use-wheel-nav` | Converts wheel events to discrete index navigation |

---

## Blocks (12)

Pre-composed, page-level sections built from Visor components.

```sh
npx visor add --type block <block-name>
```

| Block | Category | Description |
| --- | --- | --- |
| `configuration-panel` | interactive | Floating glassmorphic control panel with collapsible sections |
| `cta-section` | marketing | Centered call-to-action with heading, text, and button |
| `design-system-deck` | presentation | Full design system presentation deck with navigation |
| `design-system-specimen` | presentation | Live interactive token and component showcase |
| `features-grid` | marketing | Responsive grid of feature cards with icons |
| `footer-section` | marketing | Multi-column footer with link groups and copyright |
| `hero-section` | marketing | Full-width hero with background media and CTA |
| `login-form` | authentication | Login form with email/password fields |
| `pricing-section` | marketing | Responsive pricing tier grid with feature lists |
| `sphere-playground` | interactive | Interactive 3D sphere with real-time parameter controls |
| `steps-section` | marketing | Numbered process section with connector lines |
| `testimonial-section` | marketing | Social proof section with quotes and avatars |

---

## Composition Patterns (7)

Recommended component compositions for common UI scenarios. These are not installable — they serve as structural guidance.

| Pattern | Components Used |
| --- | --- |
| Auth Flow | card, input, button, field, alert, tabs |
| CRUD Table | table, button, dropdown-menu, dialog, alert, pagination, badge |
| Dashboard Layout | sidebar, navbar, card, tabs, breadcrumb |
| Data Table with Filters | table, input, select, button, badge, dropdown-menu, pagination |
| Empty State | card, button, heading, text |
| Form with Validation | field, input, label, textarea, button, alert |
| Settings Page | card, input, textarea, select, switch, button, field, fieldset, separator, tabs, avatar |

---

## Theme Operations

Visor uses class-based theming. Apply themes by adding a class to `<html>`:

```html
<html>                        <!-- Light (default) -->
<html class="theme-dark">     <!-- Dark theme -->
<html class="theme-brand">    <!-- Custom theme -->
```

Override tokens in global CSS after the import:

```css
@import "@loworbitstudio/visor-core";

:root {
  --interactive-primary-bg: #6366f1;
}

.theme-dark {
  --surface-page: #09090b;
}
```

CLI theme commands:

```sh
npx visor theme validate ./theme.yaml --json
npx visor theme generate --primary "#1A5F7A" --json
npx visor theme apply ./theme.yaml --json
npx visor theme export --format figma --json
```

---

## Tokens Package

> **`@loworbitstudio/visor-core` is not yet published to npm.** For new Next.js projects, run `npx @loworbitstudio/visor init --template nextjs` — it generates all tokens inline and requires no package install. Do NOT run `npm install @loworbitstudio/visor-core` — it will 404.

`@loworbitstudio/visor-core` is imported once in the global CSS entry point. Do not import it in individual component files.

```css
/* globals.css or app/globals.css */
@import "@loworbitstudio/visor-core";
```

### Available exports

Use only these subpath imports — no others exist:

| Import path | Contents |
| --- | --- |
| `@loworbitstudio/visor-core` | Full bundle (primitives + semantic + light + dark) |
| `@loworbitstudio/visor-core/css` | Alias for the full bundle |
| `@loworbitstudio/visor-core/tokens` | All tokens without theme layers |
| `@loworbitstudio/visor-core/primitives` | Raw color/spacing/type primitives only |
| `@loworbitstudio/visor-core/semantic` | Semantic tokens only |
| `@loworbitstudio/visor-core/themes/light` | Light theme overrides only |
| `@loworbitstudio/visor-core/themes/dark` | Dark theme overrides only |

> **The space theme is docs-site-only.** `@loworbitstudio/visor-core/themes/space` does not exist. The space theme ships with the Visor docs site (`packages/docs/app/space-theme.css`) and is not a package export.

### Token naming

| Prefix | Purpose | Examples |
| --- | --- | --- |
| `--color-*` | Primitive color values | `--color-gray-900`, `--color-blue-500` |
| `--spacing-*` | Spacing scale (4px grid) | `--spacing-4` (1rem), `--spacing-8` (2rem) |
| `--radius-*` | Border radius scale | `--radius-sm`, `--radius-md`, `--radius-lg` |
| `--text-*` | Semantic text colors | `--text-primary`, `--text-secondary`, `--text-muted` |
| `--surface-*` | Background surfaces | `--surface-page`, `--surface-card`, `--surface-overlay` |
| `--border-*` | Border colors | `--border-default`, `--border-muted` |
| `--interactive-*` | Interactive element tokens | `--interactive-primary-bg`, `--interactive-primary-text` |
| `--font-size-*` | Type scale | `--font-size-sm`, `--font-size-base`, `--font-size-lg` |
| `--shadow-*` | Box shadows | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |
| `--motion-*` | Animation timing | `--motion-duration-fast`, `--motion-easing-default` |

---

## Styling Conventions

- **CSS Modules** — All component styles live in `.module.css` files. No Tailwind, no CSS-in-JS.
- **CSS custom properties** — Always use tokens, never hard-coded values.
- **CVA** — Variants use `class-variance-authority` with CSS Module class references.
- **`cn()`** — Import from `@/lib/utils` to merge class names.

---

## AI Metadata Artifacts

Each component ships with a `.visor.yaml` metadata file containing:
- `name`, `description`, `category`
- `extends` — HTML element the component wraps (e.g., `HTMLButtonElement`)
- `when_to_use` / `when_not_to_use` — Decision guidance
- `props` — Typed prop definitions with defaults
- `variants` — Available variant options
- `dependencies` — External package requirements

The full manifest (`visor-manifest.json`) aggregates all component, block, hook, and pattern metadata and is available via the CLI:

```sh
npx visor list --json                     # Full catalog
npx visor list --category form --json     # Filter by category
```

---

## Do Not

- Modify files in `node_modules/@loworbitstudio/visor-core` — override tokens in CSS instead.
- Import `@loworbitstudio/visor-core` in individual component files — global CSS entry point only.
- Use hard-coded color values in component styles — always reference CSS custom properties.
- Use Tailwind utility classes in `.module.css` files — CSS Modules + custom properties is the pattern.

---

## Registry Reference

- Docs: `https://visor.design`
- Registry: `https://visor.design/registry`
