# @loworbit/visor-tokens

CSS custom property design tokens for the Visor design system.

## Installation

```sh
npm install @loworbit/visor-tokens
```

## Usage

Import the full token bundle in your project's entry CSS or JS:

```css
@import "@loworbit/visor-tokens";
```

Or import specific layers:

```css
@import "@loworbit/visor-tokens/primitives";   /* Tier 1: raw values */
@import "@loworbit/visor-tokens/semantic";     /* Tier 2: purpose-named */
@import "@loworbit/visor-tokens/themes/light"; /* Tier 3: light theme */
@import "@loworbit/visor-tokens/themes/dark";  /* Tier 3: dark theme */
```

Then use tokens in your CSS:

```css
.card {
  background: var(--surface-card);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}
```

## Token Architecture

Visor tokens follow a strict 3-tier hierarchy:

### Tier 1: Primitives

Raw values named by what they ARE. Never reference these directly in components — use semantic tokens instead.

```css
--color-gray-900: #111827;
--spacing-4: 1rem;       /* 16px */
--radius-lg: 0.5rem;     /* 8px */
--font-size-base: 1rem;  /* 16px */
```

### Tier 2: Semantic

Named by PURPOSE. Map to primitives.

```css
--text-primary: var(--color-gray-900);
--surface-card: var(--color-white);
--border-default: var(--color-gray-200);
--component-md: var(--spacing-4);
```

### Tier 3: Adaptive

Theme-aware tokens that switch based on the active theme class. Light theme values are set on `:root`. Dark theme values are applied under `.theme-dark`.

```css
:root {
  --text-primary: var(--color-gray-900);
  --surface-page: var(--color-white);
}

.theme-dark {
  --text-primary: var(--color-gray-50);
  --surface-page: var(--color-gray-950);
}
```

To enable the dark theme, add `.theme-dark` to your root element:

```html
<html class="theme-dark">
```

## Consumer Override Mechanism

Override any token by redefining the CSS custom property. No forking required.

**Override a primitive** — all semantic tokens that reference it update automatically:

```css
:root {
  /* Rebrand the accent color */
  --color-blue-500: #your-brand-color;
  --color-blue-600: #your-brand-color-dark;
}
```

**Override a semantic token** — change a specific role without touching primitives:

```css
:root {
  /* Use a custom card background */
  --surface-card: var(--color-gray-50);
}
```

**Override adaptive tokens per theme:**

```css
:root {
  --text-primary: #1a1a2e; /* Custom light mode text */
}

.theme-dark {
  --text-primary: #e8e8f0; /* Custom dark mode text */
}
```

## TypeScript Support

Import token name constants for type-safe usage:

```ts
import {
  TOKEN_TEXT_PRIMARY,
  TOKEN_SURFACE_CARD,
  TOKEN_BORDER_DEFAULT,
} from "@loworbit/visor-tokens/types"

// Use in JS (e.g., for animations or dynamic styles)
element.style.setProperty(TOKEN_TEXT_PRIMARY, "#custom-value")
const value = getComputedStyle(element).getPropertyValue(TOKEN_TEXT_PRIMARY)
```

## Available Token Groups

| Group | Prefix | Example |
|-------|--------|---------|
| Primitive colors | `--color-*` | `--color-gray-900` |
| Spacing | `--spacing-*` | `--spacing-4` (1rem / 16px) |
| Border radius | `--radius-*` | `--radius-lg` |
| Border widths | `--border-width-*` | `--border-width-1` |
| Font families | `--font-*` | `--font-sans` |
| Font sizes | `--font-size-*` | `--font-size-base` |
| Font weights | `--font-weight-*` | `--font-weight-semibold` |
| Line heights | `--line-height-*` | `--line-height-normal` |
| Shadows | `--shadow-*` | `--shadow-md` |
| Z-index | `--z-*` | `--z-modal` |
| Semantic text | `--text-*` | `--text-primary` |
| Semantic surface | `--surface-*` | `--surface-card` |
| Semantic border | `--border-*` | `--border-default` |
| Interactive | `--interactive-*` | `--interactive-primary-bg` |
| Component spacing | `--component-*` | `--component-md` |
| Layout spacing | `--layout-*` | `--layout-lg` |
| Typography roles | `--font-body`, `--size-*`, `--weight-*` | `--size-heading-lg` |

## Development

```sh
# Generate dist/tokens.css from source
npm run build

# Validate all token references
npm run validate

# Run tests
npm run test

# Type check
npm run typecheck
```
