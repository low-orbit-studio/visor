<p align="center">
  <img src="assets/visor-logo-dark.png" alt="Visor — One component system. Total Control. By Low Orbit Studio" width="480" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@loworbitstudio/visor-core"><img src="https://img.shields.io/npm/v/@loworbitstudio/visor-core?label=visor-core" alt="visor-core version" /></a>
  <a href="https://www.npmjs.com/package/@loworbitstudio/visor"><img src="https://img.shields.io/npm/v/@loworbitstudio/visor?label=visor+cli" alt="CLI version" /></a>
  <a href="https://www.npmjs.com/package/@loworbitstudio/visor-theme-engine"><img src="https://img.shields.io/npm/v/@loworbitstudio/visor-theme-engine?label=theme-engine" alt="theme-engine version" /></a>
  <a href="https://github.com/low-orbit-studio/visor/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/low-orbit-studio/visor/ci.yml?branch=main&label=CI" alt="CI" /></a>
  <a href="https://github.com/low-orbit-studio/visor/blob/main/LICENSE"><img src="https://img.shields.io/github/license/low-orbit-studio/visor" alt="License" /></a>
  <a href="https://visor.loworbit.studio">Documentation</a>
</p>

---

## What is Visor?

Visor is a theming-first React component library built by [Low Orbit Studio](https://loworbit.studio). It uses a two-layer distribution model that gives you full control over your components while keeping design consistency effortless:

**Layer 1 — Components (copy-and-own).** Run `npx visor add button` and the source files are copied directly into your project. You own them. Edit them freely. No runtime dependency on Visor.

**Layer 2 — Tokens (`@loworbitstudio/visor-core`).** The only npm package. It provides all the CSS custom properties that Visor components reference. Update the package and design changes cascade to every component automatically — without touching a single component file.

This model is inspired by shadcn/ui's copy-and-own approach, combined with a shared token layer that keeps multi-project consistency without locking you in.

---

## Quick Start

### Option A: Next.js (recommended)

Initialize Visor with the Next.js template — this creates `visor.json`, `.visor.yaml`, and `app/globals.css` with all design tokens generated inline. No npm token package required.

```sh
npx @loworbitstudio/visor init --template nextjs
```

Add your first component:

```sh
npx visor add button
```

That's it. The component source lands in your project and you own it.

### Option B: Manual setup

For non-Next.js projects or custom token management:

**1. Initialize Visor**

```sh
npx @loworbitstudio/visor init
```

This creates a `visor.json` in your project root with default path mappings:

```json
{
  "paths": {
    "components": "components/ui",
    "hooks": "hooks",
    "lib": "lib"
  }
}
```

**2. Import tokens into your global CSS**

```css
/* app/globals.css or src/index.css */
@import "@loworbitstudio/visor-core";
```

**3. Add your first component**

```sh
npx visor add button
```

---

## Adding Components

Add components one at a time or in bulk:

```sh
npx visor add input
npx visor add card
npx visor add button input label card
```

### Available Components

The registry ships 83+ UI components across 6 categories, plus admin compounds, blocks, and hooks.

**Form (24)**
`button` · `calendar` · `checkbox` · `combobox` · `date-picker` · `field` · `fieldset` · `file-upload` · `form` · `input` · `label` · `number-input` · `otp-input` · `password-input` · `phone-input` · `radio-group` · `search-input` · `select` · `slider` · `slider-control` · `switch` · `tag-input` · `textarea` · `toggle-group`

**Data Display (12)**
`accordion` · `avatar` · `carousel` · `code-block` · `collapsible` · `heading` · `image` · `progress` · `separator` · `skeleton` · `text` · `timeline`

**Navigation (5)**
`breadcrumb` · `command` · `navbar` · `pagination` · `stepper`

**Overlay (7)**
`context-menu` · `dialog` · `fullscreen-overlay` · `hover-card` · `lightbox` · `menubar` · `popover`

**Feedback (6)**
`alert` · `banner` · `chart` · `table` · `toast` · `tooltip`

**Layout (4)**
`badge` · `card` · `sheet` · `sidebar`

Add an entire category at once:

```sh
npx visor add --category form      # Add all form components
npx visor add --category overlay   # Add all overlay components
```

### Admin Components

10 compound components for data-heavy admin UIs. Add with `--category admin`:

```sh
npx visor add --category admin
```

| Component | CLI Name | Description |
|-----------|----------|-------------|
| Activity Feed | `activity-feed` | Timestamped event stream |
| Bulk Action Bar | `bulk-action-bar` | Floating bar for multi-select actions |
| Confirm Dialog | `confirm-dialog` | Destructive action confirmation modal |
| Data Table | `data-table` | Sortable, filterable table with pagination |
| Empty State | `empty-state` | Zero-data placeholder with CTA |
| Filter Bar | `filter-bar` | Composable filter chip row |
| Kbd | `kbd` | Keyboard shortcut display |
| Page Header | `page-header` | Title + actions header for admin pages |
| Stat Card | `stat-card` | KPI metric card with trend |
| Status Badge | `status-badge` | Semantic status indicator |

### Blocks

19 full-page and section-level blocks. Add with `--block`:

```sh
npx visor add admin-dashboard --block
npx visor add hero-section --block
```

| Block | CLI Name | Category |
|-------|----------|----------|
| Admin Dashboard | `admin-dashboard` | Admin |
| Admin Detail Drawer | `admin-detail-drawer` | Admin |
| Admin List Page | `admin-list-page` | Admin |
| Admin Settings Page | `admin-settings-page` | Admin |
| Admin Shell | `admin-shell` | Admin |
| Admin Tabbed Editor | `admin-tabbed-editor` | Admin |
| Admin Wizard | `admin-wizard` | Admin |
| CTA Section | `cta-section` | Marketing |
| Features Grid | `features-grid` | Marketing |
| Footer Section | `footer-section` | Marketing |
| Hero Section | `hero-section` | Marketing |
| Pricing Section | `pricing-section` | Marketing |
| Steps Section | `steps-section` | Marketing |
| Testimonial Section | `testimonial-section` | Marketing |
| Login Form | `login-form` | Auth |
| Configuration Panel | `configuration-panel` | Configuration |
| Design System Deck | `design-system-deck` | Documentation |
| Design System Specimen | `design-system-specimen` | Documentation |
| Sphere Playground | `sphere-playground` | Visual |

### Available Hooks

**General (10)**
`use-boolean` · `use-click-outside` · `use-currency` · `use-debounce` · `use-focus-trap` · `use-intersection-observer` · `use-keyboard-shortcut` · `use-local-storage` · `use-media-query` · `use-previous`

**Deck (4)**
`use-intersection-animation` · `use-keyboard-nav` · `use-slide-engine` · `use-wheel-nav`

```sh
npx visor add use-boolean
npx visor add use-debounce
npx visor add use-slide-engine
```

---

## How It Works

When you run `npx visor add button`, two files land in your project:

```
your-project/
├── components/
│   └── ui/
│       └── button/
│           ├── button.tsx           ← React component (yours to edit)
│           └── button.module.css    ← Component styles (yours to edit)
└── lib/
    └── utils.ts                     ← cn() helper, added once and shared
```

Components use CSS Modules for scoped class names and CSS custom properties from the tokens package for all design values:

```css
/* button.module.css */
.base {
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.variantDefault {
  background-color: var(--interactive-primary-bg);
  color: var(--interactive-primary-text);
}
```

Variants are managed with [CVA](https://cva.style):

```tsx
// button.tsx
const buttonVariants = cva(styles.base, {
  variants: {
    variant: {
      default: styles.variantDefault,
      secondary: styles.variantSecondary,
    },
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
    },
  },
  defaultVariants: { variant: "default", size: "md" },
})
```

---

## Theming

Theming is Visor's core differentiator. Every component references CSS custom properties — never hard-coded values. Swap the token values and the entire UI follows.

### The 3-Tier Token Architecture

```
Tier 1: Primitives         Tier 2: Semantic          Tier 3: Adaptive
--color-gray-900    ──→    --text-primary      ──→   :root { --text-primary }
--color-gray-50     ──→    --surface-page      ──→   .theme-dark { ... }
--radius-lg         ──→    --border-default
```

Components only reference Tier 2 (semantic) tokens. This means overriding a single semantic token updates every component that uses it.

### Dark Mode

Visor ships with a dark theme out of the box. Apply it by adding `.theme-dark` to your root element:

```html
<html class="theme-dark">
```

### Overriding Tokens

Override any token after your `@import` statement — no forking required:

```css
/* globals.css */
@import "@loworbitstudio/visor-core";

:root {
  /* Rebrand the primary color across the entire system */
  --interactive-primary-bg: #6366f1;
  --interactive-primary-bg-hover: #4f46e5;
}

.theme-dark {
  --interactive-primary-bg: #818cf8;
}
```

### Creating a Custom Theme

```css
/* styles/theme-brand.css */
.theme-brand {
  --surface-page: #0a0a14;
  --surface-card: #12121f;
  --text-primary: #f0f0ff;
  --text-secondary: #a0a0c0;
  --interactive-primary-bg: #6366f1;
  --interactive-primary-text: #ffffff;
  --border-default: rgba(255, 255, 255, 0.1);
}
```

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="theme-brand">
      <body>{children}</body>
    </html>
  )
}
```

### Creating a Theme from `.visor.yaml`

Define your theme in a YAML file and generate framework-specific CSS:

```yaml
# .visor.yaml
name: my-brand
version: 1
colors:
  primary: "#6366f1"
```

```bash
# Generate Next.js globals.css with @layer support
npx @loworbitstudio/visor theme apply .visor.yaml --adapter nextjs

# Generate fumadocs bridge tokens
npx @loworbitstudio/visor theme apply .visor.yaml --adapter fumadocs

# Generate scoped deck CSS
npx @loworbitstudio/visor theme apply .visor.yaml --adapter deck

# Generate docs-site CSS (class-scoped, includes fumadocs bridge)
npx @loworbitstudio/visor theme apply .visor.yaml --adapter docs
```

Register a theme in the Visor docs site in one command:

```bash
# Creates CSS file, updates globals.css and theme-config.ts
npx @loworbitstudio/visor theme register .visor.yaml --group "Client"

# Preview changes without writing
npx @loworbitstudio/visor theme register .visor.yaml --group "Client" --dry-run

# Remove a theme
npx @loworbitstudio/visor theme unregister my-brand
```

Or scaffold a complete themed project:

```bash
npx @loworbitstudio/visor init --template nextjs
```

### FOWT Prevention

Prevent flash of wrong theme by adding a blocking script to your `<head>`:

```typescript
import { FOWT_SCRIPT } from '@loworbitstudio/visor-theme-engine/fowt';

// In your layout.tsx <head>:
<script>{FOWT_SCRIPT}</script>
```

### Importing Specific Token Layers

```css
@import "@loworbitstudio/visor-core/primitives";   /* Tier 1: raw values */
@import "@loworbitstudio/visor-core/semantic";     /* Tier 2: purpose-named */
@import "@loworbitstudio/visor-core/themes/light"; /* Tier 3: light theme */
@import "@loworbitstudio/visor-core/themes/dark";  /* Tier 3: dark theme */
```

---

## Updating

### Updating a Component

Re-run the CLI with `--overwrite` to pull the latest upstream version:

```sh
npx visor add button --overwrite
```

Because you own the files, the CLI shows a diff before overwriting. If you've customized the component, use git to merge:

1. Commit your customizations.
2. Run `npx visor add button --overwrite`.
3. Use `git diff` to review what changed.
4. Merge your customizations into the updated version.
5. Commit the result.

### Updating Tokens

Token updates are standard npm updates:

```sh
npm update @loworbitstudio/visor-core
```

Token updates propagate automatically to all components. No component files change.

---

## CLI Reference

```sh
# Setup
npx @loworbitstudio/visor init                              # Create visor.json config
npx @loworbitstudio/visor init --template nextjs            # Initialize with Next.js template

# Components
npx @loworbitstudio/visor add <component>                   # Add a component, hook, or lib entry
npx @loworbitstudio/visor add <c1> <c2> <c3>                # Add multiple at once
npx @loworbitstudio/visor add --category <name>             # Add all items in a category
npx @loworbitstudio/visor add <component> --block           # Add a block
npx @loworbitstudio/visor add <component> --overwrite       # Update an existing component
npx @loworbitstudio/visor list                              # List all available components
npx @loworbitstudio/visor list --category <name>            # List by category
npx @loworbitstudio/visor diff [component]                  # Show local vs. registry differences
npx @loworbitstudio/visor suggest --for "<use case>"        # Find components for a use case
npx @loworbitstudio/visor suggest --for "<use case>" --json # JSON output (for AI agents)

# Themes
npx @loworbitstudio/visor theme apply <file>                # Generate CSS from .visor.yaml
npx @loworbitstudio/visor theme apply <file> --adapter nextjs     # Next.js adapter
npx @loworbitstudio/visor theme apply <file> --adapter fumadocs   # fumadocs adapter
npx @loworbitstudio/visor theme apply <file> --adapter deck       # Deck adapter
npx @loworbitstudio/visor theme validate <file>             # Validate a .visor.yaml theme
npx @loworbitstudio/visor theme export [file]               # Export theme to YAML/JSON
npx @loworbitstudio/visor theme extract                     # Extract .visor.yaml from existing CSS
npx @loworbitstudio/visor theme register <file>             # Register theme in the docs site
npx @loworbitstudio/visor theme unregister <slug>           # Remove a theme from the docs site
npx @loworbitstudio/visor theme sync                        # Re-generate CSS for all themes

# Fonts
npx @loworbitstudio/visor fonts add <path> --org <name>     # Upload woff2 to Visor Fonts CDN
```

All commands support `--json` for structured output (useful for AI agents and scripts).

---

## AI Agent Consumability

Visor includes structured metadata that makes it easy for AI agents to discover, understand, and compose components without reading source code.

**Per-component metadata** — Each component has a `.visor.yaml` file alongside its source with props, variants, slots, dependencies, usage examples, and "when to use" / "when not to use" guidance.

**Registry manifest** — `visor-manifest.json` is auto-generated during build, aggregating all component metadata (including auto-extracted CSS tokens) into a single file an agent can load.

**Composition patterns** — Pattern files in `patterns/` document how components combine for common use cases (form with validation, dashboard layout, CRUD table).

See [docs/ai-consumability.md](docs/ai-consumability.md) for the full spec.

---

## Stack

- **React + TypeScript**
- **CSS Modules** + CSS custom properties (no Tailwind, no CSS-in-JS)
- **[CVA](https://cva.style)** for variant management
- **[Radix UI](https://radix-ui.com)** for accessible primitives
- **[Phosphor Icons](https://phosphoricons.com)**
- **[Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react)** for testing
- **[fumadocs](https://fumadocs.vercel.app)** for the documentation site

---

## Documentation

Full documentation, component previews, and a props reference are available at:

**[visor.loworbit.studio](https://visor.loworbit.studio)**

---

## Built with Visor

Using Visor in your project? [Open a PR](https://github.com/low-orbit-studio/visor/edit/main/README.md) to add it here.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting components, token changes, and bug fixes.

To develop locally:

```sh
git clone https://github.com/loworbit/visor.git
cd visor
npm install

npm test               # Run tests
npm run typecheck      # Type check
npm run lint           # Lint
npm run build          # Build all packages
npm run docs:dev       # Start docs site
npm run widgetbook:dev # Start Flutter widgetbook preview (requires Flutter SDK)
```

### Repository Structure

```
visor/
├── components/ui/     # Component source + .visor.yaml metadata
├── hooks/             # Hook source (registry entries)
├── lib/               # Utility source (registry entries)
├── patterns/          # Composition patterns (.visor-pattern.yaml)
├── registry/          # Registry schema and definitions
└── packages/
    ├── cli/           # @loworbitstudio/visor CLI + manifest builder
    ├── tokens/        # @loworbitstudio/visor-core npm package
    └── docs/          # fumadocs documentation site
```

---

## Sustainability

Visor is free and open-source, built and maintained by [Low Orbit Studio](https://loworbit.studio). If it's useful to you, here's how to support it:

- **Use it and share it** — the best support is adoption and word of mouth.
- **Contribute** — bug reports, PRs, and Discussions participation all help.
- **Hire us** — Low Orbit Studio takes on product and design system work. [Get in touch](https://loworbit.studio).

---

## License

See [LICENSE](LICENSE) for details.

---

Built by [Low Orbit Studio](https://loworbit.studio) — Brooklyn, NY.
