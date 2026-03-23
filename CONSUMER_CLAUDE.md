# Visor — AI Agent Context

> Copy this file into your consuming project as `CLAUDE.md` (or merge the Visor section below into your existing `CLAUDE.md`). This tells AI agents everything they need to work correctly with Visor components.

---

## Visor Design System

This project uses **Visor** — Low Orbit Studio's shared design system. Visor uses a two-layer distribution model:

1. **Components** — shadcn-style registry (copy-and-own). Source files live in this project and are fully editable.
2. **Tokens** — `@loworbitstudio/visor` npm package. CSS custom properties for design consistency. Updated via `npm update`.

### Key Principle

Components are **owned by this project**. They were copied in from the Visor registry and are now local source files. Editing them is expected and encouraged.

---

## Adding a New Component

To add a Visor component to this project:

```sh
npx visor add <component-name>
```

Example:

```sh
npx visor add button
npx visor add input label card
```

After running this command, the component source files will appear at:

```
components/ui/<component-name>/
├── <component-name>.tsx
└── <component-name>.module.css
```

The first component added also creates `lib/utils.ts` (the `cn()` utility).

Available components: `button`, `input`, `label`, `checkbox`, `select`, `switch`, `textarea`, `field`, `card`, `badge`, `avatar`, `separator`, `skeleton`, `tooltip`, `alert`, `progress`, `dialog`, `sheet`, `dropdown-menu`, `tabs`, `breadcrumb`, `sidebar`, `scroll-area`, `chart`

Available hooks: `use-debounce`, `use-click-outside`, `use-local-storage`, `use-media-query`, `use-intersection-observer`, `use-keyboard-shortcut`, `use-focus-trap`, `use-previous`, `use-boolean`

---

## Updating a Component

To pull the latest upstream version of a component:

```sh
npx visor add <component-name> --force
```

This overwrites the local file with the registry version. Use git to review and merge your customizations.

---

## Tokens Package

`@loworbitstudio/visor` is imported once in the global CSS entry point. Do not import it in individual component files.

```css
/* globals.css or app/globals.css */
@import "@loworbitstudio/visor";
```

To update tokens:

```sh
npm update @loworbitstudio/visor
```

Token updates propagate to all components automatically — no file changes required.

---

## Styling Conventions

### Always use CSS custom properties — never hard-coded values

```css
/* Correct */
.card {
  background: var(--surface-card);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}

/* Incorrect — breaks theming */
.card {
  background: #ffffff;
  color: #111827;
  border: 1px solid #e2e8f0;
}
```

### Use CSS Modules for component styles

All component styles live in `.module.css` files alongside the component. Do not use inline styles, Tailwind classes, or CSS-in-JS for Visor component styling.

### Token naming conventions

| Prefix | Purpose | Examples |
|--------|---------|---------|
| `--color-*` | Primitive color values | `--color-gray-900`, `--color-blue-500` |
| `--spacing-*` | Spacing scale | `--spacing-4` (1rem), `--spacing-8` (2rem) |
| `--radius-*` | Border radius scale | `--radius-sm`, `--radius-md`, `--radius-lg` |
| `--text-*` | Semantic text colors | `--text-primary`, `--text-secondary`, `--text-muted` |
| `--surface-*` | Background surfaces | `--surface-page`, `--surface-card`, `--surface-overlay` |
| `--border-*` | Border colors | `--border-default`, `--border-muted` |
| `--interactive-*` | Interactive element tokens | `--interactive-primary-bg`, `--interactive-primary-text` |
| `--font-size-*` | Type scale | `--font-size-sm`, `--font-size-base`, `--font-size-lg` |
| `--shadow-*` | Box shadows | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |

### Using CVA for component variants

Components use CVA (class-variance-authority) with CSS Module classes:

```tsx
import { cva } from "class-variance-authority"
import styles from "./component.module.css"

const componentVariants = cva(styles.base, {
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

### The `cn()` utility

Use `cn()` from `lib/utils` to merge class names:

```tsx
import { cn } from "@/lib/utils"

// Merge CVA output with consumer className prop
<div className={cn(componentVariants({ variant, size }), className)} />
```

---

## Theming

Visor uses class-based theming. Apply themes by adding a class to the root HTML element.

```html
<!-- Light (default) -->
<html>

<!-- Dark theme -->
<html class="theme-dark">

<!-- Custom project theme -->
<html class="theme-brand">
```

Override tokens in your global CSS after the import:

```css
@import "@loworbitstudio/visor";

/* Project-level overrides */
:root {
  --interactive-primary-bg: #6366f1;
  --interactive-primary-bg-hover: #4f46e5;
}

.theme-dark {
  --surface-page: #09090b;
  --surface-card: #18181b;
}
```

---

## Project Structure (after adding Visor components)

```
your-project/
├── app/
│   └── globals.css          ← @import "@loworbitstudio/visor" lives here
├── components/
│   └── ui/
│       ├── button/
│       │   ├── button.tsx           ← Edit freely
│       │   └── button.module.css    ← Edit freely
│       └── card/
│           ├── card.tsx
│           └── card.module.css
├── hooks/                   ← Copied Visor hooks live here
├── lib/
│   └── utils.ts             ← cn() utility (copied once)
└── components.json          ← Visor registry configuration
```

---

## Do Not

- Do not modify files in `node_modules/@loworbitstudio/visor` — override tokens in your global CSS instead.
- Do not import `@loworbitstudio/visor` in individual component files — it belongs in the global CSS entry point only.
- Do not use hard-coded color values in component styles — always reference CSS custom properties.
- Do not use Tailwind utility classes in Visor component `.module.css` files — CSS Modules + custom properties is the pattern.

---

## Registry Reference

Visor registry: `https://visor.loworbit.studio/registry`

For programmatic access to the component list and schemas, see the Visor repository README or the docs site.
