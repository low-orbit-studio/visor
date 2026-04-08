# Token Rules & Theme Contract

> Prescriptive rules for authoring components and themes in Visor. Every component and theme must comply with these rules. No exceptions unless explicitly noted.
>
> **shadcn/ui v4 compatibility:** Visor's token system covers all 31 shadcn/ui v4 tokens — text, surface, border, interactive, chart (1-5), and sidebar. Consumers porting shadcn components find a 1:1 token mapping. `--sidebar-text-muted` is a Visor extension not present in shadcn.

## Token Rules

### 1. Fallback Rule

All CSS `var()` fallbacks in component CSS must use **Tailwind Gray** palette hex values (not Slate, Zinc, or any other neutral). The Gray palette defined in `packages/tokens/src/tokens/primitives.ts` is the single source of truth.

```css
/* Correct — Tailwind Gray */
color: var(--text-primary, #111827);
background: var(--surface-card, #ffffff);
border-color: var(--border-default, #e5e7eb);

/* Wrong — Slate palette */
color: var(--text-primary, #0f172a);
border-color: var(--border-default, #e2e8f0);
```

Reference values (primitive token names use role-based naming — `neutral-*`, `primary-*`, `success-*`, `warning-*`, `error-*`, `info-*`):

| Token | Hex |
|-------|----------|
| neutral-50 | `#f9fafb` |
| neutral-100 | `#f3f4f6` |
| neutral-200 | `#e5e7eb` |
| neutral-300 | `#d1d5db` |
| neutral-400 | `#9ca3af` |
| neutral-500 | `#6b7280` |
| neutral-600 | `#4b5563` |
| neutral-700 | `#374151` |
| neutral-800 | `#1f2937` |
| neutral-900 | `#111827` |
| neutral-950 | `#030712` |

### 2. Shadow Rule

All `box-shadow` declarations must use `var(--shadow-*)` tokens. No inline `rgba()` shadow values.

```css
/* Correct */
box-shadow: var(--shadow-sm);
box-shadow: var(--shadow-md);

/* Wrong */
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
```

Available shadow tokens: `xs`, `sm`, `md`, `lg`, `xl`.

**Exception:** Focus ring shadows using the `color-mix()` pattern are acceptable when implementing the box-shadow-based focus ring variant (see Rule 6).

### 3. Spacing Rule

All `padding`, `gap`, and `margin` values must use spacing tokens on the 4px grid: `var(--spacing-N)` where N maps to the primitive scale.

```css
/* Correct */
padding: var(--spacing-4);           /* 16px */
gap: var(--spacing-2);               /* 8px */
margin-bottom: var(--spacing-6);     /* 24px */

/* Wrong */
padding: 1rem;
gap: 8px;
margin-bottom: 1.5rem;
```

Scale reference:

| Token | Value |
|-------|-------|
| `--spacing-0` | 0 |
| `--spacing-1` | 4px |
| `--spacing-2` | 8px |
| `--spacing-3` | 12px |
| `--spacing-4` | 16px |
| `--spacing-5` | 20px |
| `--spacing-6` | 24px |
| `--spacing-8` | 32px |
| `--spacing-10` | 40px |
| `--spacing-12` | 48px |
| `--spacing-16` | 64px |
| `--spacing-20` | 80px |
| `--spacing-24` | 96px |

**Exception:** `height`, `width`, and sidebar-specific sizing values are deferred and may use explicit values until component sizing tokens are introduced.

### 4. Motion Rule

All transitions must use `var(--motion-duration-*)` for timing and `var(--motion-easing-*)` for easing. No hard-coded duration or easing values.

```css
/* Correct */
transition: color var(--motion-duration-fast) var(--motion-easing-default);
transition: transform var(--motion-duration-normal) var(--motion-easing-enter);
transition: opacity var(--motion-duration-slow) var(--motion-easing-exit);

/* Wrong */
transition: color 0.15s ease;
transition: transform 150ms ease-in-out;
transition: opacity 200ms;
```

**Duration tokens:**

| Semantic | Primitive | Value | Use case |
|----------|-----------|-------|----------|
| `--motion-duration-fast` | `--motion-duration-100` | 100ms | Tooltips, hovers, micro-interactions |
| — | `--motion-duration-150` | 150ms | Small state changes |
| `--motion-duration-normal` | `--motion-duration-200` | 200ms | Modals, drawers, standard transitions |
| — | `--motion-duration-300` | 300ms | Complex transitions |
| `--motion-duration-slow` | `--motion-duration-500` | 500ms | Page transitions, choreography |
| — | `--motion-duration-800` | 800ms | Large animations |

**Easing tokens:**

| Semantic | Value | Use case |
|----------|-------|----------|
| `--motion-easing-default` | ease-in-out | General purpose |
| `--motion-easing-enter` | ease-out | Elements appearing |
| `--motion-easing-exit` | ease-in | Elements leaving |
| `--motion-easing-spring` | cubic-bezier(0.34, 1.56, 0.64, 1) | Bouncy/playful |

### 5. Overlay Rule

Modal and dialog backdrops must use `var(--overlay-bg)` for the translucent background. Themes can override this token to customize overlay appearance.

```css
/* Correct */
background: var(--overlay-bg);

/* Wrong */
background: rgba(0, 0, 0, 0.5);
background: hsla(0, 0%, 0%, 0.5);
```

### 6. Focus Ring Rule

Focus rings must use `var(--focus-ring-width)` for ring width and `var(--focus-ring-offset)` for offset. Two patterns are supported:

**Outline-based** (buttons, tabs, nav items):

```css
.button:focus-visible {
  outline: var(--focus-ring-width) solid var(--border-focus);
  outline-offset: var(--focus-ring-offset);
}
```

**Box-shadow-based** (form inputs):

```css
.input:focus-visible {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 var(--focus-ring-width) color-mix(in srgb, var(--border-focus) 25%, transparent);
}
```

Components must use one of these two patterns. Do not invent custom focus ring implementations.

### 7. Color Format Rule

Use the following color formats in the designated contexts:

- **Hex values** from the Tailwind Gray palette for `var()` fallbacks (Rule 1).
- **`color-mix()`** for dynamic color derivation in theme files (blending accent colors, creating translucent variants).
- **`rgba()`** only within primitive token definitions (e.g., shadows, overlay).

HSL conversion for token values is deferred to Phase 5 (theme builder). Do not introduce HSL-based token values until that phase.

```css
/* Correct — color-mix for theme derivation */
--surface-card: color-mix(in srgb, var(--accent) 6%, #0e0e18);
--border-default: color-mix(in srgb, var(--accent) 12%, transparent);

/* Correct — hex fallback */
color: var(--text-primary, #111827);

/* Wrong — HSL token value (deferred) */
--text-primary: hsl(222, 47%, 11%);
```

### 8. Theme Structure Rule

All themes must follow the 5-section template (see [Theme Template](#5-section-theme-template) below):

1. **Shared tokens** (mode-independent) — accent colors, custom fonts, theme-specific primitives
2. **Dark mode overrides** — all visor-core token overrides for dark
3. **Light mode overrides** — all visor-core token overrides for light
4. **Framework bridge** — fumadocs/Next.js HSL triplets or similar framework-specific values
5. **Creative extensions** — starfield, glass, gradients, animations (theme-unique features)

Sections 1-3 are required for all themes. Section 4 is required when the theme is used with a specific framework that needs bridged values. Section 5 is only present in creative themes.

### 9. No Magic Numbers Rule

Every value in component CSS must trace to a token or be documented as intentional. No unexplained pixel values, rem values, or percentages.

```css
/* Wrong — magic numbers */
padding: 0.625rem;
height: 2.375rem;
margin-top: 7px;

/* Correct — token reference */
padding: var(--spacing-3);

/* Correct — documented intentional value */
height: 2.25rem; /* 36px — component size-md, sizing tokens deferred */
```

If a value cannot use a token yet (e.g., component sizing), add a CSS comment explaining the value and why it is not tokenized.

---

## CSS @layer Strategy

Adapter-generated CSS uses `@layer` declarations for specificity ordering. This ensures theme overrides work without `!important`.

```css
@layer visor-primitives, visor-semantic, visor-adaptive, visor-bridge;
```

| Layer | Contents | Specificity |
|-------|----------|-------------|
| `visor-primitives` | Color scales, spacing, radius, typography, shadows, motion | Lowest |
| `visor-semantic` | Purpose-named tokens (text-*, surface-*, border-*, interactive-*) | ↑ |
| `visor-adaptive` | Light/dark mode token values | ↑ |
| `visor-bridge` | Framework bridge tokens (fumadocs --color-fd-*) | Highest |

**Important:** The `@layer` strategy is adapter-only. The base `generateFullBundleCss` output and existing hand-authored theme files do not use layers — this maintains backward compatibility.

When using adapters (`npx visor theme apply .visor.yaml --adapter nextjs`), layers are automatically included.

---

## Theme Contract

The theme contract defines which tokens a theme must, may, and can extend. This ensures components render correctly with any compliant theme.

### Required Tokens

A theme **must** override all of the following tokens to be valid. These are the semantic tokens that components directly depend on. (~35 tokens)

**Text tokens:**

| Token | Purpose |
|-------|---------|
| `--text-primary` | Primary body text |
| `--text-secondary` | Secondary/supporting text |
| `--text-tertiary` | Tertiary/placeholder text |
| `--text-disabled` | Disabled state text |
| `--text-inverse` | Text on inverted backgrounds |
| `--text-inverse-secondary` | Secondary text on inverted backgrounds |
| `--text-link` | Link text |
| `--text-link-hover` | Link hover state |
| `--text-success` | Success feedback text |
| `--text-warning` | Warning feedback text |
| `--text-error` | Error feedback text |
| `--text-info` | Informational feedback text |

**Surface tokens:**

| Token | Purpose |
|-------|---------|
| `--surface-page` | Page background |
| `--surface-card` | Card/panel background |
| `--surface-subtle` | Subtle background differentiation |
| `--surface-muted` | Muted background areas |
| `--surface-overlay` | Overlay surface base color |
| `--surface-interactive-default` | Interactive element resting state |
| `--surface-interactive-hover` | Interactive element hover |
| `--surface-interactive-active` | Interactive element active/pressed |

**Border tokens:**

| Token | Purpose |
|-------|---------|
| `--border-default` | Standard borders |
| `--border-muted` | Subtle/light borders |
| `--border-strong` | Emphasized borders |
| `--border-focus` | Focus ring color |
| `--border-disabled` | Disabled state borders |

**Interactive tokens:**

> **Architecture note:** Interactive tokens are currently defined only in the semantic layer (`semantic.ts`) where they reference blue primitives directly. They need to be promoted to the adaptive layer (`adaptive.ts`) with light/dark pairs so that themes can override the primary/secondary/destructive colors without bypassing the token architecture. This is a Phase 1a priority — without it, a theme cannot change its primary color cleanly.

| Token | Purpose |
|-------|---------|
| `--interactive-primary-bg` | Primary button background |
| `--interactive-primary-bg-hover` | Primary button hover |
| `--interactive-primary-text` | Primary button text |
| `--interactive-secondary-bg` | Secondary button background |
| `--interactive-secondary-bg-hover` | Secondary button hover |
| `--interactive-secondary-text` | Secondary button text |
| `--interactive-destructive-bg` | Destructive button background |
| `--interactive-destructive-bg-hover` | Destructive button hover |
| `--interactive-destructive-text` | Destructive button text |

### Optional Tokens

A theme **may** override these tokens. They have sensible defaults from visor-core that work for most themes. (~15 tokens)

**Accent/status surfaces:**

| Token | Default source |
|-------|---------------|
| `--surface-accent-subtle` | primary-50 / primary-900 |
| `--surface-accent-default` | primary-500 |
| `--surface-accent-strong` | primary-600 / primary-400 |
| `--surface-popover` | white / neutral-900 |
| `--surface-success-subtle` | success-50 / success-900 |
| `--surface-success-default` | success-500 |
| `--surface-warning-subtle` | warning-50 / warning-900 |
| `--surface-warning-default` | warning-500 |
| `--surface-error-subtle` | error-50 / error-900 |
| `--surface-error-default` | error-500 |
| `--surface-info-subtle` | info-50 / info-900 |
| `--surface-info-default` | info-500 |

**Status borders:**

| Token | Default source |
|-------|---------------|
| `--border-input` | neutral-200 / neutral-700 |
| `--border-success` | success-500 |
| `--border-warning` | warning-500 |
| `--border-error` | error-500 |
| `--border-info` | info-500 |

**Chart tokens:**

| Token | Default source |
|-------|---------------|
| `--chart-1` | primary-500 / primary-400 |
| `--chart-2` | success-500 / success-400 |
| `--chart-3` | warning-500 / warning-400 |
| `--chart-4` | info-500 / info-400 |
| `--chart-5` | error-500 / error-400 |

**Sidebar tokens:**

| Token | Default source |
|-------|---------------|
| `--sidebar-bg` | neutral-50 / neutral-900 |
| `--sidebar-text` | neutral-700 / neutral-300 |
| `--sidebar-primary-bg` | primary-600 / primary-500 |
| `--sidebar-primary-text` | white / white |
| `--sidebar-accent-bg` | neutral-100 / neutral-800 |
| `--sidebar-accent-text` | neutral-900 / neutral-50 |
| `--sidebar-border` | neutral-200 / neutral-700 |
| `--sidebar-ring` | primary-500 / primary-400 |
| `--sidebar-text-muted` | neutral-500 / neutral-400 (Visor extension) |

### Extension Tokens (Namespaced)

Theme-specific tokens use a `--{theme-name}-*` prefix. These are NOT part of the contract and components must never depend on them directly. They are consumed only by theme-specific CSS in section 5 (creative extensions).

Examples from the space theme:

```css
/* Space theme extensions */
--space-glass: color-mix(in srgb, var(--accent) 15%, rgba(0, 0, 0, 0.3));
--space-glass-border: rgba(255, 255, 255, 0.2);
--space-muted: #6b6b80;
--space-surface-elevated: color-mix(in srgb, var(--accent) 8%, #121220);
```

A hypothetical Veronica theme:

```css
/* Veronica theme extensions */
--veronica-warmth: hsl(24, 80%, 55%);
--veronica-accent2: hsl(180, 60%, 45%);
```

---

## 5-Section Theme Template

Every theme file must follow this structure. Copy this template as a starting point.

```css
/* ── {Theme Name} theme — visor-core adapter ── */

/* ═══════════════════════════════════════════════
   Section 1: Shared tokens (mode-independent)
   ═══════════════════════════════════════════════ */

.{theme-name}-theme {
  /* Accent / brand colors */
  --accent: #5b6fff;

  /* Custom font stacks (if any) */
  /* --font-heading: "Custom Font", system-ui, sans-serif; */

  /* Base styles */
  min-height: 100vh;
  background: var(--surface-page);
  color: var(--text-primary);
}

/* ═══════════════════════════════════════════════
   Section 2: Dark mode overrides
   ═══════════════════════════════════════════════ */

.dark .{theme-name}-theme {
  /* ── Text ── */
  --text-primary: /* ... */;
  --text-secondary: /* ... */;
  --text-tertiary: /* ... */;
  --text-disabled: /* ... */;
  --text-inverse: /* ... */;
  --text-inverse-secondary: /* ... */;
  --text-link: /* ... */;
  --text-link-hover: /* ... */;
  --text-success: /* ... */;
  --text-warning: /* ... */;
  --text-error: /* ... */;
  --text-info: /* ... */;

  /* ── Surfaces ── */
  --surface-page: /* ... */;
  --surface-card: /* ... */;
  --surface-subtle: /* ... */;
  --surface-muted: /* ... */;
  --surface-overlay: /* ... */;
  --surface-interactive-default: /* ... */;
  --surface-interactive-hover: /* ... */;
  --surface-interactive-active: /* ... */;

  /* ── Borders ── */
  --border-default: /* ... */;
  --border-muted: /* ... */;
  --border-strong: /* ... */;
  --border-focus: /* ... */;
  --border-disabled: /* ... */;

  /* ── Interactive ── */
  --interactive-primary-bg: /* ... */;
  --interactive-primary-bg-hover: /* ... */;
  --interactive-primary-text: /* ... */;
  --interactive-secondary-bg: /* ... */;
  --interactive-secondary-bg-hover: /* ... */;
  --interactive-secondary-text: /* ... */;
  --interactive-destructive-bg: /* ... */;
  --interactive-destructive-bg-hover: /* ... */;
  --interactive-destructive-text: /* ... */;
}

/* ═══════════════════════════════════════════════
   Section 3: Light mode overrides
   ═══════════════════════════════════════════════ */

html:not(.dark) .{theme-name}-theme {
  /* Same token categories as Section 2, with light-appropriate values */
  /* ... */
}

/* ═══════════════════════════════════════════════
   Section 4: Framework bridge
   ═══════════════════════════════════════════════ */

/* fumadocs HSL triplets (if using fumadocs) */
.dark .{theme-name}-theme {
  --fd-background: /* H S% L% */;
  --fd-foreground: /* H S% L% */;
  --fd-card: /* H S% L% */;
  /* ... */
}

html:not(.dark) .{theme-name}-theme {
  --fd-background: /* H S% L% */;
  --fd-foreground: /* H S% L% */;
  --fd-card: /* H S% L% */;
  /* ... */
}

/* ═══════════════════════════════════════════════
   Section 5: Creative extensions (creative themes only)
   ═══════════════════════════════════════════════ */

/* Namespaced extension tokens */
.dark .{theme-name}-theme {
  --{theme-name}-glass: /* ... */;
  --{theme-name}-glass-border: /* ... */;
}

/* Custom CSS — animations, gradients, effects */
/* .{theme-name}-theme .starfield { ... } */
/* @keyframes ... { ... } */
```

---

## Theme Tiers

Visor supports two tiers of themes, each with different authoring and distribution characteristics.

### Standard Themes

Standard themes are describable entirely via a `.visor.yaml` configuration file. They contain only token overrides — no custom CSS, no animations, no creative effects.

**Characteristics:**
- Token overrides only (sections 1-4 of the template)
- Can be generated, validated, and distributed programmatically
- Compatible with the theme builder (Phase 5)
- Can be described in the interchange format
- Suitable for brand-alignment themes (e.g., "match my brand colors")

**Example `.visor.yaml`:**

```yaml
name: "Corporate Blue"
version: 1
colors:
  primary: "#1e40af"
  accent: "#3b82f6"
# All other values (neutral, status colors, typography, spacing, etc.)
# use Visor defaults. The theme engine generates the full 3-tier token
# set from these two colors.
#
# For per-token control, use the overrides: escape hatch:
# overrides:
#   light:
#     surface-page: "#f8fafc"
#   dark:
#     surface-page: "#0a0a0f"
```

See [`interchange-format.md`](./interchange-format.md) for the complete `.visor.yaml` spec, mapping algorithm, and JSON Schema.

### Creative Themes

Creative themes are hand-authored CSS files that go beyond token overrides. They include visual effects, animations, custom layouts, or other features that cannot be expressed as token values alone.

**Characteristics:**
- Full 5-section template including section 5 (creative extensions)
- Must still satisfy the full theme contract (all required tokens)
- Use namespaced extension tokens (`--{theme-name}-*`)
- Cannot be fully generated from `.visor.yaml` — require manual CSS authoring
- May include `@keyframes`, gradients, `color-mix()` derivations, glass effects

**The space theme is a creative theme.** It extends the contract with starfield animations, glass effects, sunrise gradients, and custom font faces.

**Distinguishing rule:** If a theme needs anything in section 5, it is a creative theme. If sections 1-4 fully describe it, it is a standard theme.
