# Design System Interchange Format

## Overview

The Visor interchange format is a portable, human-readable file (`.visor.yaml`) that fully describes a visual identity. Applying a theme file to any Visor-powered project completely transforms it — both light and dark mode — with zero manual CSS work.

**Design philosophy:** A `.visor.yaml` file describes design *intent* at the highest useful level. The theme engine expands that intent into Visor's full 3-tier token system (primitives → semantic → adaptive). Minimal input, maximal output — a single brand color is enough to generate a complete, functional theme.

**Key principle:** A project using 100% default Visor components + any valid `.visor.yaml` file should be fully and completely transformed — light and dark mode — with zero manual CSS work.

## Format Specification

### Canonical Structure

```yaml
# --- Required ---
name: "Veronica Home"              # Human-readable theme name
version: 1                         # Schema version (always 1)

# --- Colors (required, only primary is required) ---
colors:
  primary: "#1A5F7A"               # Brand color — drives interactive, accent, link, focus tokens
  accent: "#5BC4BF"                # Secondary brand color (default: same as primary)
  neutral: "#6B7280"               # Base neutral for gray scale generation (default: Tailwind Gray)
  background: "#FFFFFF"            # Page background, light mode (default: #FFFFFF)
  surface: "#FFFFFF"               # Card/panel background, light mode (default: #FFFFFF)
  success: "#22C55E"               # Success status color (default: Tailwind green-500)
  warning: "#F59E0B"               # Warning status color (default: Tailwind amber-500)
  error: "#EF4444"                 # Error status color (default: Tailwind red-500)
  info: "#0EA5E9"                  # Info status color (default: Tailwind sky-500)

# --- Dark mode overrides (optional) ---
colors-dark:
  background: "#0D0D0D"           # Override derived dark background
  surface: "#1E1E1E"              # Override derived dark surface
  # Any key from colors: can be overridden here.
  # Omitted keys inherit from the *derived dark mode value*, not from light.

# --- Typography (optional — defaults to system fonts) ---
typography:
  scale: 1                          # Font-size multiplier (default: 1). Applied to theme wrapper.
  heading:
    family: "Inter"                # Google Fonts name or CSS font stack
    weight: 600                    # Default: 600
  display:
    family: "Playfair Display"     # Display/decorative font for hero text (default: heading family)
    weight: 400                    # Default: 400
  body:
    family: "Inter"
    weight: 400                    # Default: 400
  mono:
    family: "JetBrains Mono"       # Default: system monospace stack
  letter-spacing:
    tight: "-0.02em"
    normal: "0"
    wide: "0.05em"
  # --- Flutter-only: per-slot Material TextTheme overrides (optional) ---
  # Any subset of the 16 slots; omitted slots use the Material 3 2024
  # defaults shipped in `visor_core` (VisorTextStylesData.defaults).
  slots:
    displayLarge:  { size: 56, weight: 500, letter-spacing: -0.5 }
    displayMedium: { size: 32, weight: 600, letter-spacing: -0.25 }
    titleMedium:   { weight: 600 }
    # ...plus headline{Large,Medium,Small}, title{Large,Small},
    # body{Large,Medium,Small}, label{Large,Medium,Small,XSmall}

# --- Spacing (optional) ---
spacing:
  base: 4                         # Base unit in px (default: 4). Generates full scale.

# --- Border Radius (optional, in px) ---
radius:
  sm: 2
  md: 4
  lg: 8
  xl: 12
  pill: 9999

# --- Shadows (optional, CSS box-shadow values) ---
shadows:
  xs: "0 1px 1px 0 rgba(0, 0, 0, 0.04)"
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)"
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)"
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"

# --- Motion (optional) ---
motion:
  duration-fast: "100ms"           # Micro-interactions (default: 100ms)
  duration-normal: "200ms"         # Standard transitions (default: 200ms)
  duration-slow: "500ms"           # Page transitions (default: 500ms)
  easing: "cubic-bezier(0.4, 0, 0.2, 1)"  # Default easing

# --- Per-token escape hatch (optional) ---
overrides:
  light:
    interactive-primary-bg: "#1A5F7A"    # Override a specific light mode token
  dark:
    interactive-primary-bg: "#5BC4BF"    # Override a specific dark mode token
```

### Required vs Optional Fields

| Field | Required | Default |
|-------|----------|---------|
| `name` | Yes | — |
| `version` | Yes | — |
| `colors.primary` | Yes | — |
| `colors.accent` | No | Same as `primary` |
| `colors.neutral` | No | Tailwind Gray (`#6B7280` base) |
| `colors.background` | No | `#FFFFFF` |
| `colors.surface` | No | `#FFFFFF` |
| `colors.success` | No | `#22C55E` |
| `colors.warning` | No | `#F59E0B` |
| `colors.error` | No | `#EF4444` |
| `colors.info` | No | `#0EA5E9` |
| `colors-dark` | No | All dark values derived from shade generation |
| `typography` | No | System font stacks |
| `typography.display` | No | Falls back to heading family |
| `typography.slots` | No | Flutter-only; overrides individual Material type-scale slots (size/weight/letter-spacing). Omitted → Material 3 2024 defaults from `visor_core`. |
| `spacing` | No | 4px base unit |
| `radius` | No | Visor defaults (sm:2, md:4, lg:8, xl:12, pill:9999) |
| `shadows` | No | Visor defaults (5-step scale) |
| `motion` | No | Visor defaults (100/200/500ms, ease-in-out) |
| `overrides` | No | No overrides |

### Formal Schema

See [`visor-theme.schema.json`](./visor-theme.schema.json) for the complete JSON Schema with validation rules.

Color values accept `#RGB`, `#RRGGBB`, or `#RRGGBBAA` hex formats.

## Mapping Algorithm

The theme engine converts a `.visor.yaml` file into Visor's 3-tier token system through a four-stage pipeline.

```
.visor.yaml
    │
    ▼
┌─────────────────────────────┐
│ Stage 1: Shade Generation   │  hex → OKLCH → shade scale (50-950)
│         (Primitives)        │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ Stage 2: Semantic Assignment│  shade scale → purpose-named tokens
│         (Semantic)          │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ Stage 3: Adaptive Assembly  │  light + dark → theme-aware pairs
│         (Adaptive)          │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ Stage 4: Override Application│  overrides: replace derived values
└─────────────────────────────┘
    │
    ▼
  CSS custom properties (per adapter)
```

### Stage 1: Shade Scale Generation (Primitives)

Given a single hex color, the shade generator produces a perceptually uniform shade scale using the OKLCH color space.

**Why OKLCH:** Unlike HSL, OKLCH is perceptually uniform — equal numeric changes in lightness produce equal perceived changes across all hues. This means shade scales generated from a teal, a red, and a purple will all have consistent perceived contrast between steps.

**Algorithm:**

1. Convert the input hex to OKLCH (`L`, `C`, `H`)
2. Anchor the input color at the designated shade step
3. Generate shades 50–950 by adjusting `L` (lightness) to target values while preserving `C` (chroma) and `H` (hue)
4. For extreme shades (50, 100, 900, 950), reduce chroma proportionally to avoid oversaturation
5. Clamp each shade to the sRGB gamut

**Anchor points by color role:**

| Color Role | Anchor Shade | Rationale |
|------------|-------------|-----------|
| `primary` | 600 | The "action" shade — buttons, links, focus rings |
| `accent` | 600 | Same as primary — used for secondary interactive elements |
| `neutral` | 500 | Mid-point of the gray scale |
| `success` | 500 | Standard status color weight |
| `warning` | 500 | Standard status color weight |
| `error` | 500 | Standard status color weight |
| `info` | 500 | Standard status color weight |

**Lightness targets (OKLCH L values):**

These are initial targets tuned to match Tailwind's perceptual distribution. They will be refined during Phase 3 implementation by visual comparison against reference palettes.

| Shade | Target L | Chroma | Use |
|-------|----------|--------|-----|
| 50 | 0.97 | 15% of input | Subtle backgrounds |
| 100 | 0.93 | 25% of input | Light backgrounds |
| 200 | 0.87 | 45% of input | Light accents |
| 300 | 0.78 | 70% of input | Medium accents |
| 400 | 0.65 | 90% of input | — |
| 500 | 0.55 | 100% of input | Status color anchor |
| 600 | Input L | 100% of input | Primary/accent anchor |
| 700 | 0.38 | 100% of input | Hover states, dark text |
| 800 | 0.30 | 85% of input | — |
| 900 | 0.22 | 70% of input | Dark backgrounds |
| 950 | 0.14 | 50% of input | Deepest backgrounds |

*Note: For shades lighter than the anchor, L is interpolated upward toward 0.97. For shades darker than the anchor, L is interpolated downward toward 0.14. The exact formula adjusts if the input color's natural L doesn't match the target L for its anchor shade.*

**Generated scales by color role:**

| Color Role | Shades Generated | Scale Type |
|------------|-----------------|------------|
| `primary` | 50–950 (11 shades) | Full scale |
| `accent` | 50–950 (11 shades) | Full scale |
| `neutral` | 50–950 (11 shades) | Full scale |
| `success` | 50, 100, 500, 600, 700, 900 | Selective |
| `warning` | 50, 100, 500, 600, 700, 900 | Selective |
| `error` | 50, 100, 500, 600, 700, 900 | Selective |
| `info` | 50, 100, 500, 600, 700, 900 | Selective |

**Neutral special case:** If `neutral` is omitted from `.visor.yaml`, the engine uses Tailwind Gray values verbatim (no generation). If `neutral` is specified, the engine generates a custom gray scale with near-zero chroma from the input hue, preserving a subtle tint.

### Stage 2: Semantic Token Assignment

Each semantic token is assigned a value from the generated shade scales. The table below is the complete mapping — every token in Visor's semantic layer with its derivation source for both light and dark modes.

Source references: [`semantic.ts`](../packages/tokens/src/tokens/semantic.ts), [`adaptive.ts`](../packages/tokens/src/tokens/adaptive.ts)

#### Text Tokens

| Token | Light Value | Dark Value | Source |
|-------|------------|------------|--------|
| `text-primary` | neutral-900 | neutral-50 | `neutral` |
| `text-secondary` | neutral-600 | neutral-400 | `neutral` |
| `text-tertiary` | neutral-400 | neutral-500 | `neutral` |
| `text-disabled` | neutral-300 | neutral-600 | `neutral` |
| `text-inverse` | white | neutral-900 | `neutral` |
| `text-inverse-secondary` | neutral-200 | neutral-700 | `neutral` |
| `text-link` | primary-600 | primary-400 | `primary` |
| `text-link-hover` | primary-700 | primary-300 | `primary` |
| `text-success` | success-700 | success-500 | `success` |
| `text-warning` | warning-700 | warning-500 | `warning` |
| `text-error` | error-700 | error-500 | `error` |
| `text-info` | info-700 | info-500 | `info` |

#### Surface Tokens

| Token | Light Value | Dark Value | Source |
|-------|------------|------------|--------|
| `surface-page` | `colors.background` | `colors-dark.background` or neutral-950 | explicit / `neutral` |
| `surface-card` | `colors.surface` | `colors-dark.surface` or neutral-900 | explicit / `neutral` |
| `surface-subtle` | neutral-50 | neutral-800 | `neutral` |
| `surface-muted` | neutral-100 | neutral-700 | `neutral` |
| `surface-overlay` | neutral-900 | neutral-950 | `neutral` |
| `surface-interactive-default` | white | neutral-800 | `neutral` |
| `surface-interactive-hover` | neutral-50 | neutral-700 | `neutral` |
| `surface-interactive-active` | neutral-100 | neutral-600 | `neutral` |
| `surface-interactive-disabled` | neutral-50 | neutral-800 | `neutral` |
| `surface-accent-subtle` | primary-50 | primary-900 | `primary` |
| `surface-accent-default` | primary-500 | primary-500 | `primary` |
| `surface-accent-strong` | primary-600 | primary-400 | `primary` |
| `surface-success-subtle` | success-50 | success-900 | `success` |
| `surface-success-default` | success-500 | success-500 | `success` |
| `surface-warning-subtle` | warning-50 | warning-900 | `warning` |
| `surface-warning-default` | warning-500 | warning-500 | `warning` |
| `surface-error-subtle` | error-50 | error-900 | `error` |
| `surface-error-default` | error-500 | error-500 | `error` |
| `surface-info-subtle` | info-50 | info-900 | `info` |
| `surface-info-default` | info-500 | info-500 | `info` |

#### Border Tokens

| Token | Light Value | Dark Value | Source |
|-------|------------|------------|--------|
| `border-default` | neutral-200 | neutral-700 | `neutral` |
| `border-muted` | neutral-100 | neutral-800 | `neutral` |
| `border-strong` | neutral-300 | neutral-600 | `neutral` |
| `border-focus` | primary-500 | primary-400 | `primary` |
| `border-disabled` | neutral-100 | neutral-800 | `neutral` |
| `border-success` | success-500 | success-500 | `success` |
| `border-warning` | warning-500 | warning-500 | `warning` |
| `border-error` | error-500 | error-500 | `error` |
| `border-info` | info-500 | info-500 | `info` |

#### Interactive Tokens

| Token | Light Value | Dark Value | Source |
|-------|------------|------------|--------|
| `interactive-primary-bg` | primary-600 | primary-500 | `primary` |
| `interactive-primary-bg-hover` | primary-700 | primary-400 | `primary` |
| `interactive-primary-bg-active` | primary-800 | primary-300 | `primary` |
| `interactive-primary-text` | white | white | constant |
| `interactive-secondary-bg` | white | neutral-800 | `neutral` |
| `interactive-secondary-bg-hover` | neutral-50 | neutral-700 | `neutral` |
| `interactive-secondary-bg-active` | neutral-100 | neutral-600 | `neutral` |
| `interactive-secondary-text` | neutral-900 | neutral-50 | `neutral` |
| `interactive-secondary-border` | neutral-300 | neutral-600 | `neutral` |
| `interactive-destructive-bg` | error-600 | error-500 | `error` |
| `interactive-destructive-bg-hover` | error-700 | error-600 | `error` |
| `interactive-destructive-text` | white | white | constant |
| `interactive-ghost-bg` | white | neutral-800 | `neutral` |
| `interactive-ghost-bg-hover` | neutral-100 | neutral-700 | `neutral` |

#### Non-Color Tokens

These tokens are set directly from `.visor.yaml` values (not derived from shade generation):

| Token Category | Source | Behavior if Omitted |
|---------------|--------|-------------------|
| Typography (font families, sizes, weights) | `typography` section | System font defaults |
| Spacing scale | `spacing.base` | 4px base, Visor default scale |
| Border radius | `radius` section | Visor defaults (sm:2 through pill:9999) |
| Shadows | `shadows` section | Visor default 5-step scale |
| Motion durations | `motion` section | 100ms / 200ms / 500ms |
| Motion easing | `motion.easing` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Overlay | — | Always `rgba(0, 0, 0, 0.5)` |
| Focus ring | — | Always `2px` width, `2px` offset |
| Z-index | — | Always Visor defaults (not configurable via `.visor.yaml`) |

### Stage 3: Adaptive Assembly

The adaptive layer is a mechanical step: for each color-based semantic token, emit a `{ light, dark }` pair using the values from the Stage 2 mapping table. This maps 1:1 with the existing [`adaptive.ts`](../packages/tokens/src/tokens/adaptive.ts) structure.

The theme engine outputs CSS with light values on `:root` and dark values on `.dark`, `.theme-dark`, `[data-theme="dark"]`, and `@media (prefers-color-scheme: dark)` selectors.

### Stage 4: Override Application

If the `.visor.yaml` includes an `overrides:` section, those values replace derived values after all three stages complete. This is the escape hatch for themes that need fine-grained control over specific tokens without specifying the entire token set.

```yaml
overrides:
  light:
    interactive-primary-bg: "#1A5F7A"    # Use exact brand color instead of derived shade
    surface-card: "#FAFAF8"              # Custom off-white card background
  dark:
    interactive-primary-bg: "#5BC4BF"    # Different brand treatment in dark mode
```

Override keys are CSS custom property names without the `--` prefix (e.g., `interactive-primary-bg`, not `--interactive-primary-bg`).

## Derived vs Explicit Tokens

Understanding which tokens are auto-derived from base colors and which require explicit specification is critical for theme authors.

### Fully Derived (auto-generated from base colors)

| Token Group | Derived From | Count |
|------------|-------------|-------|
| `text-link`, `text-link-hover` | `primary` | 2 |
| `surface-accent-*` (subtle, default, strong) | `primary` | 3 |
| `border-focus` | `primary` | 1 |
| `interactive-primary-*` (bg, bg-hover, bg-active, text) | `primary` | 4 |
| `text-primary`, `text-secondary`, `text-tertiary`, `text-disabled` | `neutral` | 4 |
| `text-inverse`, `text-inverse-secondary` | `neutral` | 2 |
| `surface-subtle`, `surface-muted`, `surface-overlay` | `neutral` | 3 |
| `surface-interactive-*` (default, hover, active, disabled) | `neutral` | 4 |
| `border-default`, `border-muted`, `border-strong`, `border-disabled` | `neutral` | 4 |
| `interactive-secondary-*` (bg, bg-hover, bg-active, text, border) | `neutral` | 5 |
| `interactive-ghost-*` (bg, bg-hover) | `neutral` | 2 |
| `text-success`, `surface-success-*`, `border-success` | `success` | 4 |
| `text-warning`, `surface-warning-*`, `border-warning` | `warning` | 4 |
| `text-error`, `surface-error-*`, `border-error`, `interactive-destructive-*` | `error` | 7 |
| `text-info`, `surface-info-*`, `border-info` | `info` | 4 |

**Total: ~53 color tokens auto-derived** from at most 9 input colors. With defaults, a single `primary` color generates all 53 tokens.

### Explicit (set directly from `.visor.yaml` values)

| Token Group | Source Field | Behavior |
|------------|-------------|----------|
| `surface-page` | `colors.background` / `colors-dark.background` | Falls back to white/neutral-950 |
| `surface-card` | `colors.surface` / `colors-dark.surface` | Falls back to white/neutral-900 |
| `interactive-primary-text`, `interactive-destructive-text` | — | Always white (constant) |
| Typography tokens | `typography` section | Falls back to system fonts |
| Spacing tokens | `spacing.base` | Falls back to 4px |
| Radius tokens | `radius` section | Falls back to Visor defaults |
| Shadow tokens | `shadows` section | Falls back to Visor defaults |
| Motion tokens | `motion` section | Falls back to Visor defaults |

## Open Question Resolutions

### 1. Adapter Architecture: Build-Time Codegen

**Decision:** Build-time codegen. The theme engine reads `.visor.yaml` at build time and outputs static CSS files containing custom property declarations.

**Rationale:**
- Zero runtime JavaScript cost
- Fully compatible with SSR and static site generation
- Output is cacheable by CDN
- No Flash of Wrong Theme (FOWT) — CSS is available before first paint
- Adapters are thin translation layers, not runtime dependencies

### 2. Font Resolution: Google Fonts Family Name

**Decision:** Use Google Fonts family names as identifiers in `.visor.yaml`. The theme engine resolves family names to Google Fonts CDN URLs at build time.

**Format:**

```yaml
typography:
  heading:
    family: "Inter"          # Resolved via Google Fonts API
  body:
    family: "system-ui"      # Recognized as a CSS keyword, not looked up
```

**Resolution rules:**
1. If the value matches a CSS generic family (`system-ui`, `serif`, `sans-serif`, `monospace`, `cursive`, `fantasy`), use as-is
2. If the value contains a comma (font stack), use as-is — no lookup
3. Otherwise, resolve via Google Fonts API → generate `@import` or `<link>` tag
4. For CDN-hosted fonts (Visor Fonts), use `source: "visor-fonts"` with an `org` namespace:

```yaml
typography:
  heading:
    family: "PP Model Plastic"
    source: "visor-fonts"
    org: "low-orbit"
```

   This generates `@font-face` declarations pointing to `https://fonts.visor.design/{org}/{family-slug}/{file}.woff2`.

5. For self-hosted/local fonts, use `source: "local"`:

```yaml
typography:
  heading:
    family: "CustomBrand"
    source: "local"
```

   This generates placeholder `@font-face` blocks with guidance for manual setup.

6. When `source` is omitted, it defaults to `"google-fonts"` and the family is resolved via the Google Fonts catalog. Unknown families fall back to `"local"`.

### 3. Extended Color Palettes: Primary + Accent

**Decision:** Two brand colors (`primary` and `accent`) each get full shade scales. Additional palette colors beyond these are not supported in the base format — use the `overrides:` escape hatch for edge cases.

**Rationale:** Two brand colors cover the vast majority of real-world themes. Adding arbitrary named palettes would complicate the format without proportional benefit. The `overrides:` section provides an explicit path for themes that need additional colors without bloating the spec.

### 4. Component-Level Overrides: Deferred

**Decision:** Not in v1 of the spec. Component-level overrides (e.g., "button radius different from card radius") are deferred to a future version.

**Rationale:** The token system already enables component-level control through the `overrides:` escape hatch (e.g., override specific radius tokens). A first-class component override syntax adds complexity that should be validated by real usage patterns before committing to a format.

## Edge Cases

### colors-dark Omits a Token

**Behavior:** Inherit from the *derived dark mode value*, not from the light mode value.

The shade generation algorithm always produces both light and dark values for every token. The `colors-dark` section only overrides specific dark-mode derivations when the automatic dark treatment is unsatisfactory.

Example: If `colors-dark` omits `background`, the dark background is derived as `neutral-950` (from the shade generation algorithm), not inherited from the light `background` value.

### Minimum Viable Theme

The smallest valid `.visor.yaml`:

```yaml
name: "My Theme"
version: 1
colors:
  primary: "#2563EB"
```

This produces a complete theme where:
- `primary` generates a full blue shade scale (anchored at 600)
- `accent` defaults to `primary` (same shade scale)
- `neutral` defaults to Tailwind Gray (no generation)
- `background` defaults to `#FFFFFF` (light) / neutral-950 (dark)
- `surface` defaults to `#FFFFFF` (light) / neutral-900 (dark)
- Status colors default to Tailwind values
- Typography uses system font stacks
- Spacing, radius, shadows, motion use Visor defaults

See [Worked Example](#worked-example-minimum-viable-theme) for the full expansion.

### Status Colors and Shade Generation

Status colors (`success`, `warning`, `error`, `info`) generate the selective shade set needed by the token system: 50, 100, 500, 600, 700, 900. These six shades are sufficient because status colors are used in fewer contexts than brand colors.

The shade generator anchors status colors at the 500 shade (mid-weight) rather than 600 (action weight), because status colors are primarily used for backgrounds and text, not interactive elements. The exception is `error`, which also drives `interactive-destructive-*` tokens.

### Neutral Color Omitted

If `neutral` is omitted, Visor uses Tailwind Gray hex values verbatim — no shade generation runs. This is the safest default because:
- Tailwind Gray is battle-tested for readability
- CSS `var()` fallbacks in components use Tailwind Gray hex values (per [token-rules.md](./token-rules.md) Rule 1), so the theme matches fallbacks exactly
- Custom neutrals should be an intentional choice, not an accident

If `neutral` IS specified, the generator produces a custom gray scale with near-zero chroma derived from the input color's hue, giving the neutrals a subtle warm/cool tint.

### Primary Equals Accent

Valid. The system uses the same shade scale for both primary and accent tokens. Validation warns ("primary and accent are identical — consider differentiating them") but does not error.

### Colors with Poor Contrast

The theme validator (Phase 3) checks WCAG contrast ratios:
- `text-primary` on `surface-page` ≥ 4.5:1
- `interactive-primary-bg` contrast ≥ 3:1
- Same checks for dark mode

Validation **warns** but does **not** block theme application. Theme authors may intentionally choose low-contrast aesthetics for decorative contexts.

### OKLCH Gamut Clamping

Some OKLCH colors fall outside the sRGB gamut. The shade generator clamps out-of-gamut colors using the CSS Color Level 4 gamut mapping algorithm: reduce chroma while preserving lightness and hue until the color fits within sRGB. This ensures all generated hex values are valid and renderable.

## Worked Example: Minimum Viable Theme

Input:

```yaml
name: "Teal Brand"
version: 1
colors:
  primary: "#1A5F7A"
```

### Stage 1: Shade Generation

`#1A5F7A` in OKLCH ≈ L:0.42, C:0.06, H:225°

Since the input L (0.42) is close to the 600 anchor target, the generator anchors it directly:

| Shade | Generated Hex | OKLCH L (approx) | Usage |
|-------|--------------|-------------------|-------|
| 50 | `#f0f7fa` | 0.97 | `surface-accent-subtle` (light) |
| 100 | `#d8edf4` | 0.93 | — |
| 200 | `#b0d9e8` | 0.87 | — |
| 300 | `#7bbfd6` | 0.78 | `interactive-primary-bg-active` (dark) |
| 400 | `#4aa1bf` | 0.65 | `text-link` (dark), `interactive-primary-bg-hover` (dark) |
| 500 | `#2d849e` | 0.55 | `border-focus` (dark), `surface-accent-default` |
| 600 | `#1A5F7A` | 0.42 | `interactive-primary-bg` (light), `text-link` (light) |
| 700 | `#134b62` | 0.38 | `interactive-primary-bg-hover` (light), `text-link-hover` (light) |
| 800 | `#0e3a4d` | 0.30 | `interactive-primary-bg-active` (light) |
| 900 | `#092a38` | 0.22 | `surface-accent-subtle` (dark) |
| 950 | `#051b25` | 0.14 | — |

*Note: Hex values shown are illustrative approximations. Exact values will be computed by the shade generator implementation in Phase 3.*

**Defaults applied (no generation):**
- `accent` → same shade scale as `primary`
- `neutral` → Tailwind Gray verbatim
- Status colors → Tailwind defaults (green-500, amber-500, red-500, sky-500 + selective shades)

### Stage 2: Semantic Assignment (selected tokens)

| Token | Light | Dark |
|-------|-------|------|
| `text-primary` | `#111827` (gray-900) | `#f9fafb` (gray-50) |
| `text-link` | `#1A5F7A` (primary-600) | `#4aa1bf` (primary-400) |
| `surface-page` | `#FFFFFF` (default) | `#030712` (gray-950) |
| `surface-accent-subtle` | `#f0f7fa` (primary-50) | `#092a38` (primary-900) |
| `border-focus` | `#2d849e` (primary-500) | `#4aa1bf` (primary-400) |
| `interactive-primary-bg` | `#1A5F7A` (primary-600) | `#2d849e` (primary-500) |
| `interactive-primary-bg-hover` | `#134b62` (primary-700) | `#4aa1bf` (primary-400) |

All neutral tokens (text-primary, text-secondary, surface-subtle, border-default, etc.) use Tailwind Gray defaults. All status tokens use Tailwind defaults.

### Stage 3: Adaptive Assembly

Each token becomes a light/dark pair emitted as CSS:

```css
:root {
  --text-link: var(--color-primary-600);
  --interactive-primary-bg: var(--color-primary-600);
  --surface-accent-subtle: var(--color-primary-50);
  /* ... all tokens ... */
}

.dark, .theme-dark, [data-theme="dark"] {
  --text-link: var(--color-primary-400);
  --interactive-primary-bg: var(--color-primary-500);
  --surface-accent-subtle: var(--color-primary-900);
  /* ... all tokens ... */
}
```

## Relationship to token-rules.md

The `tokens.shared/dark/light` format shown in [`token-rules.md`](./token-rules.md) under "Standard Themes" represents the **internal/generated** token structure — what the theme engine produces as output. It is not the authoring format.

The `.visor.yaml` format defined in this document is the canonical authoring surface. Theme authors write high-level `colors:` values; the theme engine expands them to per-token CSS custom properties.

The `overrides:` section in `.visor.yaml` provides the same per-token control as the `tokens.dark/light` format when needed, but most themes should not need it.

## Adapter Layers

Each consumer type gets an adapter that reads the theme engine's output and formats it appropriately.

| Adapter | Output | Consumer |
|---------|--------|----------|
| `visor-adapter-nextjs` | CSS custom properties file + `@import` for fonts | NextJS projects |
| `visor-adapter-fumadocs` | CSS variables + fumadocs HSL bridge tokens | Docs sites |
| `visor-adapter-deck` | Scoped CSS under `.deck--{name}` class | Pitch decks |
| `visor-adapter-flutter` | Dart `ThemeData` constants | Flutter projects |
| `visor-adapter-figma` | Figma Variables JSON | Design tools |

All adapters consume the same intermediate representation (the expanded 3-tier token set). They differ only in output format.

## CLI Integration

```bash
npx visor theme apply ./my-brand.visor.yaml      # Apply theme to current project
npx visor theme validate ./theme.visor.yaml       # Validate a theme file
npx visor theme generate                           # Interactive theme generator
npx visor theme export --format yaml               # Export current theme to .visor.yaml
npx visor theme export --format figma              # Export for Figma
```
