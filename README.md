<p align="center">
  <img src="assets/visor-logo-dark.png" alt="Visor — One component system. Total Control. By Low Orbit Studio" width="480" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@loworbitstudio/visor"><img src="https://img.shields.io/npm/v/@loworbitstudio/visor?label=%40loworbit%2Fvisor-tokens" alt="npm version" /></a>
  <a href="https://visor.loworbit.studio">Documentation</a>
</p>

---

## What is Visor?

Visor is a theming-first React component library built by [Low Orbit Studio](https://loworbit.studio). It uses a two-layer distribution model that gives you full control over your components while keeping design consistency effortless:

**Layer 1 — Components (copy-and-own).** Run `npx visor add button` and the source files are copied directly into your project. You own them. Edit them freely. No runtime dependency on Visor.

**Layer 2 — Tokens (`@loworbitstudio/visor`).** The only npm package. It provides all the CSS custom properties that Visor components reference. Update the package and design changes cascade to every component automatically — without touching a single component file.

This model is inspired by shadcn/ui's copy-and-own approach, combined with a shared token layer that keeps multi-project consistency without locking you in.

---

## Quick Start

### 1. Install the tokens package

```sh
npm install @loworbitstudio/visor
```

### 2. Import tokens into your global CSS

```css
/* app/globals.css or src/index.css */
@import "@loworbitstudio/visor";
```

### 3. Initialize Visor

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

### 4. Add your first component

```sh
npx visor add button
```

That's it. The component source lands in your project and you own it.

---

## Adding Components

Add components one at a time or in bulk:

```sh
npx visor add input
npx visor add card
npx visor add button input label card
```

### Available Components

| Component | CLI Name | Description |
|-----------|----------|-------------|
| Alert | `alert` | Contextual alert messages |
| Avatar | `avatar` | User avatar with fallback |
| Badge | `badge` | Status and category badge |
| Breadcrumb | `breadcrumb` | Navigation breadcrumb |
| Button | `button` | Multi-variant button with CVA |
| Card | `card` | Surface container with slots |
| Chart | `chart` | Chart wrapper (Recharts) |
| Checkbox | `checkbox` | Checkbox with indeterminate state |
| Dialog | `dialog` | Modal dialog (Radix UI) |
| Dropdown Menu | `dropdown-menu` | Dropdown menu (Radix UI) |
| Field | `field` | Form field wrapper — label + input + error |
| Input | `input` | Text input field |
| Label | `label` | Form label (Radix UI) |
| Progress | `progress` | Progress indicator |
| Scroll Area | `scroll-area` | Styled scrollable container (Radix UI) |
| Select | `select` | Dropdown select (Radix UI) |
| Separator | `separator` | Visual divider |
| Sheet | `sheet` | Slide-over panel (Radix UI) |
| Sidebar | `sidebar` | App sidebar layout |
| Skeleton | `skeleton` | Loading placeholder |
| Switch | `switch` | Toggle switch (Radix UI) |
| Tabs | `tabs` | Tab navigation (Radix UI) |
| Textarea | `textarea` | Multi-line text input |
| Tooltip | `tooltip` | Hover tooltip (Radix UI) |

### Available Hooks

```sh
npx visor add use-boolean
npx visor add use-click-outside
npx visor add use-debounce
npx visor add use-focus-trap
npx visor add use-intersection-observer
npx visor add use-keyboard-shortcut
npx visor add use-local-storage
npx visor add use-media-query
npx visor add use-previous
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
@import "@loworbitstudio/visor";

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

### Importing Specific Token Layers

```css
@import "@loworbitstudio/visor/primitives";   /* Tier 1: raw values */
@import "@loworbitstudio/visor/semantic";     /* Tier 2: purpose-named */
@import "@loworbitstudio/visor/themes/light"; /* Tier 3: light theme */
@import "@loworbitstudio/visor/themes/dark";  /* Tier 3: dark theme */
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
npm update @loworbitstudio/visor
```

Token updates propagate automatically to all components. No component files change.

---

## CLI Reference

```sh
npx @loworbitstudio/visor init                   # Create visor.json config
npx @loworbitstudio/visor add <component>         # Add a component or hook
npx @loworbitstudio/visor add <component> --overwrite  # Update an existing component
npx @loworbitstudio/visor list                    # List all available components
npx @loworbitstudio/visor diff [component]        # Show local vs. registry differences
```

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting components, token changes, and bug fixes.

To develop locally:

```sh
git clone https://github.com/loworbit/visor.git
cd visor
npm install

npm test          # Run tests
npm run typecheck # Type check
npm run lint      # Lint
npm run build     # Build all packages
npm run docs:dev  # Start docs site
```

### Repository Structure

```
visor/
├── components/ui/     # Component source (registry entries)
├── hooks/             # Hook source (registry entries)
├── lib/               # Utility source (registry entries)
├── registry/          # Registry schema and definitions
└── packages/
    ├── cli/           # @loworbitstudio/visor CLI
    ├── tokens/        # @loworbitstudio/visor npm package
    └── docs/          # fumadocs documentation site
```

---

## License

See [LICENSE](LICENSE) for details.

---

Built by [Low Orbit Studio](https://loworbit.studio) — Brooklyn, NY.
