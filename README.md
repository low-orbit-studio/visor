# Visor

> Low Orbit Studio's shared design system — a two-layer distribution model: components via a shadcn-style registry (copy-and-own) and tokens via an npm package (`@loworbit/visor-tokens`).

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [How It Works](#how-it-works)
3. [Making Updates](#making-updates)
4. [Theming & Customization](#theming--customization)
5. [Migration Guide](#migration-guide)
6. [AI Consumption](#ai-consumption)

---

## Installation & Setup

### Prerequisites

- Node.js 18+
- A React project (Next.js, Vite, etc.)
- npm

### Step 1 — Install the tokens package

The tokens package is the only npm-distributed piece of Visor. It provides all CSS custom properties that Visor components reference.

```sh
npm install @loworbit/visor-tokens
```

### Step 2 — Import tokens into your project

In your global CSS entry point (e.g., `app/globals.css`, `src/index.css`):

```css
@import "@loworbit/visor-tokens";
```

This imports the full token bundle: primitives, semantic tokens, and both light and dark theme adaptive tokens.

Or import specific layers if you need fine-grained control:

```css
@import "@loworbit/visor-tokens/primitives";   /* Tier 1: raw values */
@import "@loworbit/visor-tokens/semantic";     /* Tier 2: purpose-named */
@import "@loworbit/visor-tokens/themes/light"; /* Tier 3: light theme (on :root) */
@import "@loworbit/visor-tokens/themes/dark";  /* Tier 3: dark theme (on .theme-dark) */
```

### Step 3 — Configure the Visor registry

Create a `components.json` file at your project root to point the CLI at the Visor registry:

```json
{
  "$schema": "https://visor.loworbit.studio/schema.json",
  "registry": "https://visor.loworbit.studio/registry",
  "aliases": {
    "components": "@/components/ui",
    "hooks": "@/hooks",
    "lib": "@/lib"
  }
}
```

> **Note:** The registry URL `https://visor.loworbit.studio/registry` is the canonical source. Until the hosted registry is live, see the [docs site](packages/docs/) for the current distribution URL.

### Step 4 — Add your first component

```sh
npx visor add button
```

This copies the Button component source files into your project at the path configured in `components.json`. You now own those files.

### Adding more components

```sh
npx visor add input
npx visor add card
npx visor add dialog
```

Or add multiple at once:

```sh
npx visor add button input label card
```

### Available Components

| Component | CLI Name | Description |
|-----------|----------|-------------|
| Button | `button` | Multi-variant button with CVA |
| Input | `input` | Text input field |
| Label | `label` | Form label |
| Checkbox | `checkbox` | Checkbox with indeterminate state |
| Select | `select` | Dropdown select (Radix UI) |
| Switch | `switch` | Toggle switch |
| Textarea | `textarea` | Multi-line text input |
| Field | `field` | Form field wrapper (label + input + error) |
| Card | `card` | Surface container with slots |
| Badge | `badge` | Status/category badge |
| Avatar | `avatar` | User avatar with fallback |
| Separator | `separator` | Visual divider |
| Skeleton | `skeleton` | Loading placeholder |
| Tooltip | `tooltip` | Hover tooltip (Radix UI) |
| Alert | `alert` | Contextual alert messages |
| Progress | `progress` | Progress indicator |
| Dialog | `dialog` | Modal dialog (Radix UI) |
| Sheet | `sheet` | Slide-over panel (Radix UI) |
| Dropdown Menu | `dropdown-menu` | Dropdown menu (Radix UI) |
| Tabs | `tabs` | Tab navigation (Radix UI) |
| Breadcrumb | `breadcrumb` | Navigation breadcrumb |
| Sidebar | `sidebar` | App sidebar layout |
| Scroll Area | `scroll-area` | Styled scrollable container |
| Chart | `chart` | Chart wrapper |

### Available Hooks

```sh
npx visor add use-debounce
npx visor add use-click-outside
npx visor add use-local-storage
npx visor add use-media-query
npx visor add use-intersection-observer
npx visor add use-keyboard-shortcut
npx visor add use-focus-trap
npx visor add use-previous
npx visor add use-boolean
```

---

## How It Works

### Two-Layer Architecture

Visor has two distinct distribution layers that serve different purposes:

```
┌─────────────────────────────────────────────────────────┐
│                     Your Project                         │
│                                                         │
│  components/ui/button/        ← You own this (copied)   │
│    button.tsx                                           │
│    button.module.css                                    │
│                                                         │
│  node_modules/@loworbit/visor-tokens/  ← npm package    │
│    dist/index.css             ← CSS custom properties   │
└─────────────────────────────────────────────────────────┘
```

**Layer 1 — Components (copy-and-own):** When you run `npx visor add button`, the component source is copied directly into your project. You own the files. You can edit them freely. There is no runtime dependency on Visor for components.

**Layer 2 — Tokens (`@loworbit/visor-tokens`):** This is an actual npm dependency. It provides the CSS custom properties that all Visor components reference. Updating this package propagates design changes automatically — without you touching any component files.

### What Files Get Created

When you run `npx visor add button`, the CLI creates:

```
your-project/
├── components/
│   └── ui/
│       └── button/
│           ├── button.tsx           ← React component
│           └── button.module.css    ← Component styles
└── lib/
    └── utils.ts                     ← cn() helper (added once)
```

The `utils.ts` file provides the `cn()` utility (clsx + tailwind-merge) used by all components. It is added automatically on first use and shared across all components.

### CSS Modules + CSS Custom Properties

Components use CSS Modules for scoped class names combined with CSS custom properties from the tokens package for design values:

```css
/* button.module.css — uses CSS custom properties, not hard-coded values */
.base {
  border-radius: var(--radius-md, 0.375rem);
  font-size: var(--text-sm, 0.875rem);
}

.variantDefault {
  background-color: var(--color-primary, #0f172a);
  color: var(--color-primary-foreground, #f8fafc);
}
```

The fallback values (e.g., `0.375rem`) ensure components work even if the tokens import is missing, but importing `@loworbit/visor-tokens` is required for theming to work correctly.

### How Components Reference Tokens

The TypeScript component uses CVA (class-variance-authority) with CSS Module class names:

```tsx
// button.tsx
import { cva } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./button.module.css"

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

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
  )
)
```

### The 3-Tier Token Architecture

Tokens are organized in three tiers. Components only use Tier 2 (semantic) and Tier 3 (adaptive) — never Tier 1 (primitives) directly.

```
Tier 1: Primitives         Tier 2: Semantic          Tier 3: Adaptive
--color-gray-900    ──→    --text-primary      ──→   :root { --text-primary }
--color-gray-50     ──→    --surface-page      ──→   .theme-dark { ... }
--spacing-4         ──→    --component-md
--radius-lg         ──→    --border-default
```

This indirection is what makes theming work: override a semantic token and every component that references it updates automatically — without touching any component files.

---

## Making Updates

### Updating a Component

If the Visor registry ships an updated version of a component you've added, re-run the CLI with the `--force` flag to pull the latest version:

```sh
npx visor add button --force
```

Because you own your component files, the CLI will show a diff of what changed before overwriting. Review the diff and decide whether to accept, reject, or manually merge the changes.

**If you've customized the component:**

The recommended workflow is to use git as your merge tool:

1. Commit your current customizations.
2. Run `npx visor add button --force` to pull the upstream version.
3. Use `git diff` to review what changed.
4. Manually merge your customizations into the updated version.
5. Commit the merged result.

This is by design — you own your components. Visor ships updates as suggestions, not automatic overwrites.

### Updating Tokens

Token updates are just npm updates:

```sh
npm update @loworbit/visor-tokens
```

Or pin to a specific version:

```sh
npm install @loworbit/visor-tokens@0.2.0
```

Token updates propagate automatically to all components without any file changes. This is the core advantage of the two-layer model: design consistency updates (spacing adjustments, color refinements, new themes) flow through without requiring you to touch component code.

**Example scenario:** The Visor team updates `--radius-md` from `0.375rem` to `0.5rem`. You run `npm update @loworbit/visor-tokens`. Every component that references `var(--radius-md)` — buttons, inputs, cards, dialogs — updates immediately. No component files change.

### Contributing Changes Back

If you improve a component and want to contribute back to the Visor registry:

1. Make your changes in your project's copied component files.
2. Open the Visor repo and find the corresponding source file.
3. Apply your improvement to the registry source.
4. Submit a pull request to the Visor repo.

The Visor team reviews, merges, and the updated component becomes available via the CLI for all consumers.

---

## Theming & Customization

### Overriding Tokens

Override any token by redefining the CSS custom property in your project's CSS. No forking required.

**Override a primitive** — cascades to all semantic tokens that reference it:

```css
/* globals.css — after your @import "@loworbit/visor-tokens" */

:root {
  /* Rebrand the accent color across the entire design system */
  --color-blue-500: #6366f1;  /* your brand color */
  --color-blue-600: #4f46e5;  /* darker shade for hover states */
}
```

**Override a semantic token** — change a specific role without touching primitives:

```css
:root {
  /* Give cards a slightly warm background instead of pure white */
  --surface-card: var(--color-warm-gray-50);
}
```

**Override adaptive tokens per theme:**

```css
:root {
  --text-primary: #1a1a2e;   /* Custom light mode text */
}

.theme-dark {
  --text-primary: #e8e8f0;   /* Custom dark mode text */
}
```

### Creating Project-Specific Themes

Create a custom theme CSS file in your project:

```css
/* styles/theme-brand.css */

.theme-brand {
  /* Surface tokens */
  --surface-page: #0a0a14;
  --surface-card: #12121f;
  --surface-overlay: #1a1a2e;

  /* Text tokens */
  --text-primary: #f0f0ff;
  --text-secondary: #a0a0c0;
  --text-muted: #606080;

  /* Interactive tokens */
  --interactive-primary-bg: #6366f1;
  --interactive-primary-bg-hover: #4f46e5;
  --interactive-primary-text: #ffffff;

  /* Border tokens */
  --border-default: rgba(255, 255, 255, 0.1);
  --border-muted: rgba(255, 255, 255, 0.05);
}
```

Apply the theme by adding the class to your root element:

```tsx
// In Next.js: app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="theme-brand">
      <body>{children}</body>
    </html>
  )
}
```

### Enabling Dark Mode

Visor ships with a dark theme out of the box. Apply it by adding `.theme-dark` to your root element:

```html
<html class="theme-dark">
```

To implement a user-controlled theme toggle in Next.js:

```tsx
"use client"

import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", dark)
  }, [dark])

  return (
    <button onClick={() => setDark(!dark)}>
      {dark ? "Light mode" : "Dark mode"}
    </button>
  )
}
```

### Customizing Copied Components

Because you own your component files, you can edit them freely. Common customizations:

**Add a new variant:**

```tsx
// In your project's button.tsx
const buttonVariants = cva(styles.base, {
  variants: {
    variant: {
      default: styles.variantDefault,
      secondary: styles.variantSecondary,
      outline: styles.variantOutline,
      ghost: styles.variantGhost,
      destructive: styles.variantDestructive,
      brand: styles.variantBrand,    // ← add this
    },
    // ...
  },
})
```

```css
/* In your project's button.module.css */
.variantBrand {
  background-color: var(--interactive-primary-bg);
  color: var(--interactive-primary-text);
}

.variantBrand:hover {
  background-color: var(--interactive-primary-bg-hover);
}
```

**Add new props or behaviors:**

Since you own the component, just edit the TypeScript file directly. No API constraints.

---

## Migration Guide

See [`docs/MIGRATION.md`](docs/MIGRATION.md) for full migration guides:

- **From shadcn/ui** — Replace shadcn components one-by-one or all at once
- **From kaiah-app's `@kaiah/ui`** — Migrate from the internal package to copy-and-own

---

## AI Consumption

### For AI Agents Working in Projects That Use Visor

If you are an AI agent (Claude, Cursor, Copilot, etc.) working in a project that consumes Visor components, here is the authoritative summary of how Visor works:

**Adding a component:** Run `npx visor add <name>`. This copies source files into the project. The files are now owned by the project — edit them directly.

**The tokens package** (`@loworbit/visor-tokens`) is an npm dependency that provides CSS custom properties. It is imported once in the global CSS entry point. Never import it in component files.

**Styling convention:** Components use CSS Modules (`.module.css` files). Custom properties (e.g., `var(--surface-card)`) come from the tokens package. When adding styles to a copied component, follow the same pattern — use CSS custom properties, never hard-coded values.

**Do not modify** `node_modules/@loworbit/visor-tokens`. Token customizations go in your project's global CSS file, after the `@import "@loworbit/visor-tokens"` statement.

**Component structure after `npx visor add button`:**

```
components/ui/button/
├── button.tsx           ← React component (edit this)
└── button.module.css    ← Styles (edit this)
```

**Available CLI commands:**

```sh
npx visor add <component>           # Add a component
npx visor add <component> --force   # Update an existing component
npx visor list                      # List all available components
npx visor info <component>          # Show component details and dependencies
```

### CLAUDE.md Template for Consuming Projects

Copy `CONSUMER_CLAUDE.md` from this repository into your project as `CLAUDE.md` (or merge the Visor section into your existing `CLAUDE.md`). It provides AI agents with the exact context needed to work effectively with Visor components.

See [`CONSUMER_CLAUDE.md`](CONSUMER_CLAUDE.md) in this repository.

### Registry Structure for Automated Tooling

The Visor registry exposes a JSON API at:

```
GET https://visor.loworbit.studio/registry/index.json
```

Each component is available at:

```
GET https://visor.loworbit.studio/registry/<name>.json
```

The response follows the registry schema defined in [`registry/schema.ts`](registry/schema.ts):

```ts
{
  name: string
  type: "registry:ui" | "registry:hook" | "registry:lib"
  description?: string
  dependencies?: string[]          // npm packages to install
  devDependencies?: string[]
  registryDependencies?: string[]  // other registry items required
  files: Array<{
    path: string      // relative path in the registry source
    type: string      // mirrors the item type
  }>
}
```

**Example response for `button`:**

```json
{
  "name": "button",
  "type": "registry:ui",
  "description": "A button component with multiple variants and sizes using CVA.",
  "dependencies": ["class-variance-authority", "@loworbit/visor-tokens"],
  "registryDependencies": ["utils"],
  "files": [
    { "path": "components/ui/button/button.tsx", "type": "registry:ui" },
    { "path": "components/ui/button/button.module.css", "type": "registry:ui" }
  ]
}
```

When automating component installation, install `dependencies` via npm and install `registryDependencies` via `npx visor add` before the target component.

---

## Development

This section is for contributors to the Visor repo itself.

```sh
# Install dependencies
npm install

# Run all tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint

# Build all packages
npm run build

# Start docs site
npm run docs:dev
```

### Repository Structure

```
visor/
├── components/ui/          # Component source (registry entries)
│   └── button/
│       ├── button.tsx
│       └── button.module.css
├── hooks/                  # Hook source (registry entries)
├── lib/                    # Utility source (registry entries)
├── registry/               # Registry schema and definitions
│   ├── schema.ts
│   ├── registry-ui.ts
│   ├── registry-hooks.ts
│   └── registry-lib.ts
├── packages/
│   ├── tokens/             # @loworbit/visor-tokens npm package
│   └── docs/               # fumadocs documentation site
└── docs/
    └── wisdom/             # Project-specific lessons
```

### Package: `@loworbit/visor-tokens`

See [`packages/tokens/README.md`](packages/tokens/README.md) for full token documentation including the 3-tier architecture, available token groups, and consumer override patterns.
