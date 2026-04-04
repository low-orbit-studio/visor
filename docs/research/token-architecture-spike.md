# Token Architecture Research Spike

**Status:** Accepted
**Ticket:** [VI-122](https://linear.app/low-orbit-studio/issue/VI-122/token-architecture-research-spike)

## Problem

Visor's primitive token layer hardcodes Tailwind color palettes — `--color-gray-900`, `--color-blue-600`, etc. — as the foundation for all semantic tokens. A separate theme engine generates OKLCH shade scales from role-based `.visor.yaml` configs. These two systems conflict architecturally: the primitives layer locks color names to Tailwind conventions while the theme engine abstracts them into roles (`primary`, `neutral`, `accent`).

Before the `@loworbitstudio/visor-core` package reaches a stable npm release, the primitives layer must be redesigned. This spike researches 6 best-in-class design systems to inform that decision.

## Current State

**3-tier architecture (all layers exist and work):**

1. **Primitives** (`packages/tokens/src/tokens/primitives.ts`) — 47 hardcoded Tailwind hex values: gray (11 shades), blue (10), green (6), amber (6), red (6), sky (6). The problem tier.
2. **Semantic** (`packages/tokens/src/tokens/semantic.ts`) — 12 text + 19 surface + 9 border + 14 interactive tokens. Named by role, not palette. This tier is solid.
3. **Adaptive** (`packages/tokens/src/tokens/adaptive.ts`) — light/dark switching for all color categories. Works correctly.

**Theme engine** (`packages/theme-engine/`) — takes `.visor.yaml`, generates OKLCH shade scales for each color role (primary, accent, neutral, success, warning, error, info), assigns them to semantic tokens via `semantic-map.ts`, outputs CSS. Already works — this is the intended future architecture.

**The mismatch:** `semantic-map.ts` uses `{role: "neutral", shade: 9}` tuples internally, while the static tokens package uses `var(--color-gray-900)`. Same intent, incompatible encoding.

---

## Systems Researched

### shadcn/ui

**Architecture:** Pure role-based semantic tokens, no primitive layer at all.

**Color tokens:** ~30 variables covering surface+foreground pairs:
```css
--background / --foreground
--card / --card-foreground
--popover / --popover-foreground
--primary / --primary-foreground
--secondary / --secondary-foreground
--muted / --muted-foreground
--accent / --accent-foreground
--destructive
--border / --input / --ring
--chart-1 … --chart-5
--sidebar (+ 7 counterparts)
```

**CSS format:** Moved from HSL channels (`0 0% 100%`) to full OKLCH (`oklch(1 0 0)`) in v4.

**Primitives:** None shipped. Consumers map their own brand colors directly into the role variables.

**Dark mode:** `.dark` class on `<html>` — same variable names, redefined inside `.dark {}`. No `prefers-color-scheme` fallback by default.

**Non-color tokens:** `--radius` + derived scale (`--radius-sm` … `--radius-4xl` via `calc()`). Nothing else.

**Admin components:** Data Table (TanStack Table pattern + guide), Command palette, Combobox (pattern), sidebar blocks, dashboard blocks.

**Key insight:** shadcn eliminates the primitive tier entirely. Every token is a role. Consumers who need a specific shade must define it themselves. Clean API, maximum simplicity, minimum flexibility for palette-level work.

---

### Radix Themes

**Architecture:** Scale-based color system where the primitive and semantic tiers collapse into one 12-step scale.

**Color system:** `<Theme accentColor="indigo" grayColor="auto">` — two props drive the whole palette. All 27 accent colors and 6 gray scales from Radix Colors are available.

**Generated CSS variables:**
```css
/* Both primitives and aliases simultaneously */
--accent-1 … --accent-12         /* semantic roles by step number */
--accent-a1 … --accent-a12       /* alpha variants */
--accent-surface, --accent-indicator, --accent-track, --accent-contrast
--gray-1 … --gray-12
--[colorname]-1 … --[colorname]-12  /* raw named palettes still exposed */
```

**Step semantics (encoded in scale position, not variable name):**
- Steps 1–2: App/component backgrounds
- Steps 3–5: Interactive component backgrounds (hover, active)
- Steps 6–8: Borders and separators
- Steps 9–10: Solid fills (primary buttons, badges)
- Steps 11–12: Accessible text

**Dark mode:** `.dark` / `.dark-theme` CSS class. Radix Colors handles automatic dark/light values per scale.

**Admin components:** Table, DataList, Progress, Skeleton, Segmented Control, form inputs. No Command palette, no pre-built DataTable with sorting.

**Key insight:** Primitives and semantics collapse into a single numbered scale. The semantic meaning lives in the step convention, not the variable name. Powerful for building custom UIs, but requires knowing that step 9 = solid fill and step 11 = text.

---

### Open Props

**Architecture:** Comprehensive primitive token library only. Semantic layer is explicitly out of scope.

**Color system:** 18 color families (gray, stone, red, pink, indigo, blue, cyan, teal, green, lime, yellow, orange, etc.) × 13 shades (0–12). Also ships a dynamic OKLCH palette via 3 control variables:
```css
--palette-hue: 250;
--palette-chroma: 0.89;
--palette-hue-rotate-by: 25;
```

**Naming:** `--{color}-{0-12}` (`--blue-5`, `--gray-9`), `--size-{000-15}`, `--font-size-{00-8}`, `--shadow-{1-6}`, `--ease-spring-3`.

**Semantic tokens:** None shipped. The community pattern:
```css
--surface-1: var(--gray-0);  /* base background */
--surface-2: var(--gray-1);
--text-1: var(--gray-9);
--text-2: var(--gray-7);
```

**Dark mode:** Aliasing pattern via `prefers-color-scheme` media query or `.dark`/`.light` class selectors. CSS `light-dark()` function is the modern approach.

**Admin components:** None. Pure CSS custom property library.

**Key insight:** Best primitive token system in the ecosystem — comprehensively scaled, professionally calibrated. Intentionally stops at Tier 1. This is the reference for what a well-designed primitive layer looks like.

---

### Park UI

**Architecture:** Radix Colors primitives + virtual semantic palette abstraction, distributed copy-and-own via CLI. Built on Ark UI (headless) + Panda CSS (build-time CSS).

**Token system:**
```css
/* Primitives (Radix Colors) */
--colors-blue-1 … --colors-blue-12
--colors-blue-a1 … --colors-blue-a12

/* Virtual semantic palette */
--colors-color-palette-solid-bg
--colors-color-palette-solid-bg-hover
--colors-color-palette-subtle-bg
--colors-color-palette-surface-bg
--colors-color-palette-outline-border
--colors-color-palette-fg
```

**Theming:** Data-attribute driven — `data-accent-color="blue"` and `data-gray-color="slate"` on `<html>`. The `colorPalette` abstraction maps whichever accent color is active into the palette slots.

**Dark mode:** `color-scheme` property + Radix Colors auto-switching. No explicit `.dark` override per variable needed.

**Naming:** Panda CSS namespace convention — `--colors-{palette}-{variant}`, `--radii-l1/l2/l3`.

**Admin components:** 30–50 components including form inputs, table (basic), dialog, drawer, date picker, color picker. No DataTable with sorting/pagination.

**Key insight:** The virtual `colorPalette` abstraction is interesting — one set of component styles handles all accent colors without per-color duplication. Framework-agnostic (React + Solid + Vue via Ark UI).

---

### Mantine

**Architecture:** Palette-first. 10-shade tuples per color, with a thin semantic layer on top via variant variables.

**CSS variables — three tiers:**
```css
/* Tier 1: Raw palette (static) */
--mantine-color-blue-0 … --mantine-color-blue-9

/* Tier 2: Variant roles per color */
--mantine-color-blue-filled
--mantine-color-blue-filled-hover
--mantine-color-blue-light
--mantine-color-blue-light-hover
--mantine-color-blue-light-color
--mantine-color-blue-outline
--mantine-color-blue-outline-hover

/* Tier 3: Global semantic roles */
--mantine-color-text
--mantine-color-body
--mantine-color-anchor
--mantine-color-error
--mantine-color-dimmed
```

**Color customization:** `MantineColorsTuple` — exactly 10 hex strings. `primaryColor` + `primaryShade` (`{ light: 6, dark: 8 }` — different shade per mode).

**Dark mode:** `data-mantine-color-scheme="light|dark"` on `<html>`. `defaultColorScheme="auto"` defers to `prefers-color-scheme`.

**Admin components:** Table, Progress, RingProgress, Badge, Card. Official `@mantine/charts` with 14 chart types (Recharts-based). Community `mantine-datatable` (excellent — async, sortable, paginated, row selection, context menus).

**Key insight:** The `primaryShade: { light: 6, dark: 8 }` pattern — using a lighter shade in dark mode from the same palette — is a design detail most systems don't expose. Good for fine-grained theming without separate dark color definitions.

---

### Chakra UI v3

**Architecture:** Semantic-first with condition-based tokens. Closest analog to Visor's adaptive layer.

**Two tiers:**
```css
/* Tier 1: Base tokens */
--chakra-colors-gray-50: #f9fafb;
--chakra-colors-gray-500: #6b7280;

/* Tier 2: Semantic tokens (condition-aware) */
--chakra-colors-bg: white;           /* resolves to dark value in .dark */
--chakra-colors-fg: black;
--chakra-colors-bg-subtle: var(--chakra-colors-gray-50);
--chakra-colors-border: var(--chakra-colors-gray-200);
```

**Per-palette semantic slots (7 per color):**
`solid`, `muted`, `subtle`, `emphasized`, `contrast`, `fg`, `focus-ring`

**Dark mode:** `.dark` class on `<html>` (next-themes). Semantic tokens automatically resolve to dark values — components using `bg="bg.subtle"` work in both modes with zero extra code.

**Admin components:** First-party `Stat` + subcomponents (unique — no other system ships this). Table (basic, not DataTable). DataList, Progress, ProgressCircle, EmptyState, ActionBar.

**Key insight:** Chakra's condition-based semantic tokens (`{ _light: ..., _dark: ... }`) are the closest model to Visor's adaptive layer. The structural difference: Chakra bakes light/dark into the token definition itself (compiled by Panda CSS), while Visor uses explicit CSS class-scoped blocks per theme. Chakra's approach works well for two modes; Visor's class-per-theme approach scales cleanly to N named themes.

---

## Comparison Matrix

| | shadcn/ui | Radix Themes | Open Props | Park UI | Mantine | Chakra UI v3 |
|---|---|---|---|---|---|---|
| **Color approach** | Roles only, no primitives | Scale aliases (1–12 = role) | Primitives only (0–12 per family) | Radix Colors + virtual palette | Palette-first, 10-shade tuples | Semantic-first, conditions |
| **Primitive layer** | None | Named scales exposed (`--red-1`…`--red-12`) | Comprehensive (18 families × 13 shades) | Radix Colors full set | 10 shades per color | 11 Tailwind-style shades |
| **Semantic layer** | Rich role names (`--background`, `--muted-foreground`) | Number-based scale positions | None shipped | Virtual `colorPalette` slots | Thin (8 global roles + variant system) | Rich (`bg`, `fg`, `border`, 7 slots/color) |
| **CSS format** | OKLCH (v4), HSL channels (v3) | Hex (Radix Colors source) | HSL / OKLCH (dynamic palette) | Radix Colors hex | Hex | Hex |
| **Dark mode trigger** | `.dark` class | `.dark` / `.dark-theme` class | Media query or `.dark` class | `color-scheme` + Radix auto | `data-mantine-color-scheme` attr | `.dark` class (next-themes) |
| **Multi-theme** | Manual CSS override | Not first-class | Manual | data-accent-color attr | virtualColor aliases | `data-theme` scoping |
| **Fixed vs theme-controlled** | Only `--radius` is fixed; all colors are roles | accentColor + grayColor drive everything; radius is fixed | Everything is primitive; user decides what's fixed | radius levels fixed; colors via accent/gray attrs | spacing/font/radius/shadow fixed; colors theme-controlled | spacing/type/radius fixed; all colors semantic |
| **Non-color tokens** | `--radius` only | Full set (spacing, radius, shadows) via Radix Props | Comprehensive (spacing, type, shadows, motion, z-index) | Full Panda CSS token set | Full set (spacing, font, shadow, radius, breakpoints) | Full set via Panda CSS |
| **Admin: DataTable** | Guide + TanStack Table | None | N/A | None | Community `mantine-datatable` (excellent) | Community only |
| **Admin: Charts** | None | None | N/A | None | Official `@mantine/charts` (14 types) | Third-party (4 types) |
| **Admin: Stat** | None | None | N/A | None | None | First-party `Stat` component |
| **Distribution** | CLI copy-and-own | npm package | npm / CDN | CLI copy-and-own | npm package | npm package |
| **Framework** | React | React | Framework-agnostic CSS | React + Solid + Vue | React | React |

---

## Architectural Recommendation

### Recommendation: Role-named generated primitives + preserve existing semantic layer

Replace the hardcoded Tailwind primitive layer with a **generated OKLCH primitive layer** using role-based names. Expose these as CSS custom properties. Keep the semantic layer unchanged.

**New primitive layer output:**
```css
/* Generated from theme engine — replaces hardcoded Tailwind values */
--color-primary-1: oklch(0.98 0.01 265);
--color-primary-2: oklch(0.95 0.02 265);
/* … */
--color-primary-12: oklch(0.18 0.08 265);

--color-neutral-1: oklch(0.98 0.005 270);
/* … */
--color-neutral-12: oklch(0.12 0.005 270);

--color-accent-1 … --color-accent-12
--color-success-1 … --color-success-12
--color-warning-1 … --color-warning-12
--color-error-1 … --color-error-12
--color-info-1 … --color-info-12
```

**Semantic layer becomes transparent references:**
```css
--text-primary: var(--color-neutral-12);
--surface-card: var(--color-neutral-1);
--interactive-primary-bg: var(--color-primary-9);
/* etc. — same token names, different variable targets */
```

### Rationale

1. **Eliminates the naming mismatch.** `semantic-map.ts` already uses `{role: "neutral", shade: 9}` tuples internally. Exposing `--color-neutral-9` as a CSS variable makes the semantic layer's logic visible in DevTools — no more opaque `var(--color-gray-900)` that obscures which theme role it came from.

2. **Aligns with OKLCH.** shadcn/ui moved to OKLCH in v4. Visor's theme engine already generates OKLCH shades. Role-named OKLCH primitives are the current best practice.

3. **Role names, not palette names.** The problem with the current primitives is that `gray` and `blue` are palette-coupled — they lock the semantic layer to specific hue families. `neutral` and `primary` are theme-agnostic: a theme can make `neutral` warm brown or cool slate without renaming anything.

4. **Escape hatch for admin/chart work.** Admin dashboards need direct palette access — chart datasets, status badge variants, heat map tints. With `--color-success-3` available, a chart can use a subtle success background without adding a new semantic token. Without primitives (pure shadcn approach), every one-off use requires a new semantic token or an inline hardcoded value.

5. **The semantic layer stays intact.** The 54 existing semantic tokens (`--text-primary`, `--surface-card`, `--border-default`, etc.) have good names and correct coverage. Components reference these, not primitives — so the component layer needs no changes. Only the values the semantic tokens resolve to will change (from `--color-gray-900` to `--color-neutral-12`).

6. **Consistent with the theme engine's existing model.** The theme engine already generates 12-shade scales per role. Exposing them as `--color-{role}-{1-12}` CSS variables is not adding architecture — it's surfacing what already exists.

### Convention: Components use semantic tokens only

Primitive variables are utility-tier. Visor components must reference `--text-primary`, `--surface-card`, etc. — never `--color-neutral-9` directly. This is enforced by convention and documented in `token-rules.md`. The 43 existing primitive color leaks (concentrated in sidebar + deck components) must be resolved as part of the primitives migration.

### What does NOT change

- Semantic token names (`--text-primary`, `--surface-card`, etc.) — unchanged
- Adaptive layer mechanics (theme class switching, light/dark) — unchanged
- Theme engine pipeline — unchanged
- `.visor.yaml` format — unchanged
- Non-color primitive tokens (spacing, radius, shadows, typography, motion, focus ring, overlay) — unchanged, these are already role-named

### shadcn naming compatibility

shadcn's naming convention (`--primary`, `--background`, `--foreground`, `--muted-foreground`, etc.) is worth acknowledging: it uses bare, unprefixed names that are extremely short. Visor's `--text-primary`, `--surface-card` pattern is more verbose but more self-documenting (the category prefix makes it clear whether a token is text, surface, or border without needing to know the conventions).

Adopting shadcn's exact names (`--background`, `--foreground`, `--primary`) would aid consumer familiarity but create a naming conflict with any project that already uses shadcn. Visor's category-prefixed names are the better choice for a design system used alongside other tools.

---

## Admin UI Component Gap Analysis

Visor's current roadmap places admin components in **Phase 8** — tables, CRUD forms, stat cards, dashboard layouts. Based on this research, here's the sourcing strategy:

### DataTable

**Recommendation: TanStack Table v8 (headless) + Visor Table component (shell)**

All surveyed systems use TanStack Table for feature-rich data tables. shadcn provides the best documented pattern — a guide that combines Visor's `Table` component shell with TanStack Table for sorting, filtering, pagination, and row selection. Mantine's `mantine-datatable` community package is the most complete implementation in any ecosystem and is worth studying for API design.

The Visor registry `data-table` component should follow shadcn's copy-and-own pattern: TanStack Table provides behavior, Visor Table provides styling. Consumers install and own the integration code.

### Charts

**Recommendation: Recharts (via community recipes)**

Mantine's `@mantine/charts` is built on Recharts and represents the most complete first-party chart offering in the ecosystem. Visor does not need to ship charts as registry components — the token layer (`--color-primary-9`, `--color-success-9`, etc.) is what matters for theming. Recipes showing how to wire Recharts to Visor tokens are more valuable than wrapping Recharts components.

### Stat Card

**Recommendation: Build as a Visor registry component**

Chakra UI is the only system with a first-party `Stat` component — and it's well-designed (label, value, helper text, indicator subcomponents). Visor should build a `StatCard` component following Chakra's structure. No headless library is needed — this is pure layout + typography tokens.

### Dashboard Layouts

**Recommendation: Blocks (shadcn pattern)**

shadcn's block system (`dashboard-01`, `sidebar-01` … `sidebar-16`) is the right model. Visor blocks are installable compositions of registry components. Build after the core component set is complete.

### Summary

| Component | Source Strategy | Priority |
|---|---|---|
| DataTable | TanStack Table v8 + Visor Table shell (shadcn pattern) | Phase 8 |
| Charts | Recharts recipes wired to Visor tokens | Phase 8 |
| StatCard | Build new (Chakra UI stat structure as reference) | Phase 8 |
| Dashboard blocks | Visor blocks system (shadcn blocks pattern) | Phase 8 |
| Command palette | shadcn Command (cmdk) — registry component | Phase 7 or 8 |

---

## Appendix: Visor's Current Token Counts

| Category | Count | Example |
|---|---|---|
| Primitive colors | 47 | `--color-gray-900: #111827` |
| Semantic text | 12 | `--text-primary` |
| Semantic surface | 19 | `--surface-card` |
| Semantic border | 9 | `--border-default` |
| Semantic interactive | 14 | `--interactive-primary-bg` |
| Non-color primitives | ~60 | `--spacing-4`, `--radius-md`, `--shadow-sm` |
| Primitive color leaks in components | 43 | sidebar + deck components using `--color-gray-*` |
