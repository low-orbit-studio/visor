# Visual Design Overhaul Research Spike

**Status:** Proposed
**Ticket:** [VI-128](https://linear.app/low-orbit-studio/issue/VI-128/visual-design-overhaul-research-spike)

## Problem

Visor's component architecture is sound — 3-tier tokens, semantic-first, theme-agnostic — but the visual design reads as minimal scaffolding. No depth hierarchy, no micro-interactions, weak state feedback, border-heavy instead of shadow-elevated. Visor is pre-1.0 with zero external consumers. This is the last window to make breaking visual changes before `npm publish` (VI-124) locks in the aesthetic.

## Current State

**By the numbers (53 inventory components, 71 .module.css files, 6,012 lines CSS):**

| Metric | Count | % of 53 |
|--------|-------|---------|
| `:hover` states | 23 | 43% |
| `:active` / pressed states | 3 | 6% |
| `:focus` / `:focus-visible` | 30 | 57% |
| `:disabled` states | 27 | 51% |
| Loading / skeleton states | 3 | 6% |
| `@keyframes` animations | 15 | 28% |
| `var(--shadow-*)` usage | 16 | 30% |
| `backdrop-filter` | 0 | 0% |
| `transition` properties | 51 | 96% |

**Token health:** 87 semantic tokens across 8 categories. 793 semantic token references across 114 files. Role-named primitives (neutral, primary, accent, success, warning, error, info). OKLCH-ready. The token layer does not need architectural changes — only CSS-level visual refinement.

**Key gaps:**
1. **Active/pressed states nearly absent** — Only menubar, number-input, slider implement `:active`. Buttons, tabs, links, cards all missing.
2. **Form inputs have no hover states** — 0 of 8 form inputs (input, textarea, select, otp-input, etc.) have `:hover` styling. Fields feel unresponsive until focused.
3. **No backdrop blur anywhere** — Dialog, sheet, fullscreen-overlay use flat `var(--overlay-bg)`. No glassmorphic layering.
4. **No elevation hierarchy** — Shadow tokens (xs/sm/md/lg/xl) exist but lack a defined mapping. 16 components use shadows, 37 don't. Cards use `0 0 0 1px var(--border-default)` instead of `var(--shadow-*)`.
5. **Color is decorative, not semantic** — Destructive badges at 10% opacity are invisible. Toasts use border-only treatment. No full-surface color for status indicators.
6. **No micro-interactions** — No scale on press, no smooth tab indicator transitions, no entrance/exit animations beyond expand/collapse.
7. **Typography lacks hierarchy** — Card titles/descriptions use minimal size/weight differentiation.

---

## Systems Researched

### 1. Radix Themes

**Focus:** Depth system, state taxonomy, accessibility, focus rings.

**Depth/Elevation:**
Radix Themes uses a deliberate shadow hierarchy mapped to component layers:

```css
/* Card — subtle lift */
box-shadow: 0 0 0 1px var(--gray-a5), 0 1px 3px var(--gray-a3);

/* Dropdown/Popover — floating surface */
box-shadow: 0 0 0 1px var(--gray-a3),
            0 8px 40px var(--black-a3),
            0 12px 32px -16px var(--black-a3);

/* Dialog — highest elevation, scrim underneath */
box-shadow: 0 0 0 1px var(--gray-a3),
            0 16px 64px var(--black-a6),
            0 24px 48px -16px var(--black-a4);
```

Key pattern: combining a 1px ring with layered soft shadows creates depth without harsh borders. Each elevation level adds more spread and darker alpha.

**State Taxonomy:**
Radix implements the most complete state system of all studied systems:

| State | Visual Treatment |
|-------|-----------------|
| Default | Base surface + text color |
| Hover | `background-color` shift using scale step +1 (e.g., step 3 → step 4). Gated behind `@media (hover: hover)` to prevent sticky hover on touch. |
| Active/Pressed | `filter: brightness(0.92) saturate(1.1)` in light mode, `brightness(1.08)` in dark. Classic buttons also shift content down via padding-top. On touch devices (`@media (pointer: coarse)`), active adds `outline: 0.5em solid var(--accent-a4)` for visible tap feedback. |
| Focus | `outline: 2px solid var(--focus-color)` with `outline-offset: 2px`. Never box-shadow for focus — always outline for accessibility. |
| Disabled | `color: var(--gray-a8); background-color: var(--gray-a3)` — strips accent color entirely, replaces with gray alpha. `pointer-events: none`. |

**Focus Rings:**
Radix uses CSS `outline` exclusively (not `box-shadow`) for focus indicators. This ensures focus rings work with `forced-colors` mode (Windows High Contrast):

```css
:focus-visible {
  outline: 2px solid var(--accent-9);
  outline-offset: 2px;
}
```

**Color Semantics:**
Every accent color gets full surface treatments across all component types — not just text tinting. Buttons get solid fills at step 9, badges get subtle backgrounds at step 3, alerts get tinted surfaces. The 12-step scale encodes semantic intent by position:
- Steps 1–2: App/component backgrounds
- Steps 3–5: Interactive backgrounds (default → hover → active)
- Steps 6–8: Borders (subtle → default → strong)
- Steps 9–10: Solid fills (default → hover)
- Steps 11–12: Text (low-contrast → high-contrast)

**Additional Patterns:**
- All component styles wrapped in `:where()` for zero specificity — critical for override-friendly theming
- Asymmetric animation timing: 200ms open / 100ms close on dialogs. Close is faster for responsiveness.
- Soft variant uses alpha stepping: `--accent-a3` (default) → `--accent-a4` (hover) → `--accent-a5` (active)
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (deceleration curve) for entrance animations

**Key Takeaway:** The step-based scale elegantly maps interaction states to numeric progressions. Filter-based active states (`brightness`/`saturate`) are simpler than managing separate active color tokens — worth adopting. Alpha stepping for soft variants is elegant.

---

### 2. Mantine

**Focus:** Micro-interactions, loading states, density options, variant system.

**Micro-Interactions:**
Mantine has the most comprehensive animation system of any studied system. Key patterns:

```css
/* Button — notably NO press transform in v7. Mantine buttons feel flat/web-native.
   Hover uses per-variant CSS variable: */
&:where(:not([data-loading], :disabled, [data-disabled])):hover {
  background-color: var(--button-hover);
}

/* Transition component — configurable timing */
transition-duration: var(--mantine-transition-duration, 150ms);
transition-timing-function: ease;

/* Collapse animation */
transition: height 200ms ease,
            opacity 200ms ease 0ms;

/* Notification entrance */
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
animation: slide-in 200ms ease;

/* Modal overlay */
backdrop-filter: blur(4px);
transition: opacity 200ms ease;
```

**Loading States:**
Every async-capable component supports loading:
- `Skeleton` — shimmer animation with configurable radius and size
- `LoadingOverlay` — full-area overlay with spinner
- Buttons accept `loading` prop → spinner replaces content, maintains width
- Progress bars with indeterminate animation

```css
/* Skeleton shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
background: linear-gradient(
  90deg,
  var(--mantine-color-default-border) 0%,
  var(--mantine-color-body) 50%,
  var(--mantine-color-default-border) 100%
);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
```

**Depth/Elevation:**
Mantine uses a simple shadow scale with CSS custom properties:

```css
--mantine-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--mantine-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
--mantine-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
--mantine-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
--mantine-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
```

**Variant System:**
Mantine's 8 button variants demonstrate comprehensive color treatment:

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| `filled` | Step 6 (solid) | White | None | Darken 10% |
| `light` | Step 1 (10% opacity) | Step 6 | None | Step 2 (20% opacity) |
| `outline` | Transparent | Step 6 | Step 6 | Step 1 bg |
| `subtle` | Transparent | Step 6 | None | Step 1 bg |
| `transparent` | Transparent | Step 6 | None | No bg change |
| `white` | White | Step 6 | None | Gray-1 bg |
| `default` | Body bg | Body text | Default border | Darken border |
| `gradient` | Linear gradient | White | None | Shift gradient |

**Density:**
Five sizes (xs/sm/md/lg/xl) with proportional scaling across padding, font-size, height, and border-radius. Each size has defined values, not just scale factors.

**Additional Patterns:**
- Triple-layer shadows: every shadow level shares a `0 1px 3px` base contact shadow, then adds ambient layers at very low opacity (0.04–0.1). Subtle by default.
- Skeleton pulse uses `opacity: 0.4 → 1.0` at `1500ms linear infinite` with `translateZ(0)` for GPU acceleration
- Disabled pattern: `cursor: not-allowed; color: var(--mantine-color-disabled-color); background: var(--mantine-color-disabled); border: 1px solid transparent`
- No dark-mode shadow adjustment — same shadows in both modes
- Transitions are conservative: `150ms ease` for transforms, `100ms ease` for opacity

**Key Takeaway:** Mantine proves that comprehensive loading states dramatically improve perceived quality. The variant system with per-color CSS variables is the gold standard. Notably, Mantine buttons have NO press transform — an opportunity for Visor to differentiate with subtle active feedback.

---

### 3. Park UI

**Focus:** Animation patterns, OKLCH colors, variant system, elevation mapping.

**Animation Patterns:**
Park UI (built on Ark UI primitives) uses CSS animations with consistent timing:

```css
/* Dialog/overlay entrance */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slide-up {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
animation: fade-in 150ms ease-out, slide-up 150ms ease-out;

/* Accordion expand */
@keyframes expand {
  from { height: 0; opacity: 0; }
  to { height: var(--height); opacity: 1; }
}

/* Tab indicator */
.tab-indicator {
  transition: left 200ms ease, width 200ms ease;
}
```

Park UI's tab indicator is notably smooth — a sliding underline that transitions `left` and `width` properties rather than switching between items.

**OKLCH Color System:**
Park UI was an early adopter of OKLCH for component colors, building on Radix Colors' 12-step scale:

```css
/* Accent colors in OKLCH */
--colors-accent-1: oklch(0.99 0.005 264);
--colors-accent-9: oklch(0.55 0.19 264);
--colors-accent-12: oklch(0.24 0.06 264);
```

The `colorPalette` abstraction maps any accent color into generic slots, so component CSS never references a specific color:

```css
/* Components reference the virtual palette */
background: var(--colors-color-palette-solid-bg);
color: var(--colors-color-palette-fg);

/* The palette is resolved by data attribute */
[data-accent-color="blue"] {
  --colors-color-palette-solid-bg: var(--colors-blue-9);
}
```

**Variant System:**
Four core variants with clear visual hierarchy:

| Variant | Appearance | Use Case |
|---------|-----------|----------|
| `solid` | Full accent fill, high-contrast text | Primary actions |
| `outline` | Transparent bg, accent border | Secondary actions |
| `ghost` | Transparent bg, no border, accent text | Tertiary / toolbar |
| `subtle` | Light tinted bg (step 2–3), accent text | Tags, badges |

**Elevation:**
Park UI uses a conservative shadow approach — most components rely on borders, with shadows reserved for floating surfaces:

```css
/* Card — border-defined */
border: 1px solid var(--colors-border-default);

/* Popover/Dropdown — elevated */
box-shadow: var(--shadows-lg);
border: 1px solid var(--colors-border-default);

/* Dialog — max elevation */
box-shadow: var(--shadows-xl);
```

**Additional Patterns:**
- Tab indicators use CSS custom properties (`--width`, `--height`) that Ark UI's JS layer updates at runtime for smooth sliding. The line variant positions a 2px underline with `transform: translateY(1px)`.
- Five button variants form a clear hierarchy: **solid** → **surface** (bg + border) → **outline** (border only) → **subtle** (tinted bg) → **plain** (color-only, no chrome)
- Each variant has `.hover` and `.active` sub-tokens: `colorPalette.solid.bg.hover`, `colorPalette.solid.bg.active`
- Park UI relies more on background contrast and borders than shadow elevation — a flat design philosophy. Shadows reserved for floating surfaces only.
- No explicit easing/duration tokens exposed — animation handled by Ark UI's JS layer, not CSS tokens. A weakness for Visor's tokenized motion approach.

**Key Takeaway:** The `colorPalette` virtual abstraction and OKLCH adoption are forward-looking. The five-variant hierarchy (solid → surface → outline → subtle → plain) is the clearest variant taxonomy studied. Tab indicators with JS-driven CSS custom properties are the reference implementation for smooth transitions.

---

### 4. shadcn/ui v4

**Focus:** API design, composition patterns, developer ergonomics.

**Note:** shadcn/ui is not a visual design reference — it is deliberately minimal. Studied for API patterns and composition model.

**Luma Style (March 2026):**
New visual foundation with rounded geometry, soft elevation, breathable layouts. Inspired by macOS Tahoe minus the glass. Goes beyond theming into geometric and spacing baseline changes.

**Composition Patterns:**
v4 introduces explicit component hierarchies in docs:

```
Card
├── CardHeader
│   ├── CardTitle
│   ├── CardDescription
│   └── CardAction
├── CardContent
└── CardFooter
```

Designed so AI agents compose elements reliably — fewer missing wrappers, fewer wrong hierarchies.

**data-slot Attributes:**
Every primitive gets a `data-slot` attribute for CSS scoping:

```html
<div data-slot="card-header">
```

Enables parent-aware styling without class-name coupling. Components can be styled from parent context via `[data-slot="header"]` selectors.

**State Handling:**
Uses Radix/Base UI data attributes (`data-state="open"`, `data-disabled`) rather than CSS pseudo-classes for complex states. Simple states (hover, focus) use standard pseudo-classes.

**Animation:**
Migrated from `tailwindcss-animate` to `tw-animate-css`. No built-in micro-interaction library — animation extensions come from ecosystem (Animate UI, SmoothUI).

**Key Takeaway:** shadcn's value is in composition patterns and API design, not visual design. The `data-slot` pattern and explicit hierarchies are worth adopting for AI consumability. Visual inspiration should come from other systems.

---

### 5. Primer (GitHub Design System)

**Focus:** Battle-tested state management, density system, accessibility-first patterns.

**State Management:**
GitHub's state patterns are the most battle-tested of any system studied (used by 100M+ developers daily):

```css
/* Button states — systematic color shifting */
.Button--primary {
  background-color: var(--bgColor-accent-emphasis);
  color: var(--fgColor-onEmphasis);
}
.Button--primary:hover {
  background-color: var(--bgColor-accent-emphasis-hover);
}
.Button--primary:active {
  background-color: var(--bgColor-accent-emphasis-active);
}
.Button--primary:disabled {
  background-color: var(--bgColor-disabled);
  color: var(--fgColor-disabled);
  border-color: var(--borderColor-disabled);
}

/* Focus — dual-ring technique */
.Button:focus-visible {
  outline: 2px solid var(--borderColor-accent-emphasis);
  outline-offset: -2px;
  box-shadow: 0 0 0 4px var(--bgColor-accent-muted);
}
```

Key patterns:
- Dedicated hover/active token variants (`--bgColor-accent-emphasis-hover`, `--bgColor-accent-emphasis-active`) rather than opacity or filter adjustments. Precise control per theme.
- **`transition: none` on `:active` state** — a deliberate pattern that makes clicks feel instant while hover transitions remain smooth. One of the most impactful micro-details studied.

**Density System:**
Three density modes affecting all components simultaneously:

```css
/* Density scale */
[data-density="spacious"] {
  --control-small-size: 28px;
  --control-medium-size: 36px;
  --control-large-size: 44px;
  --control-small-paddingInline: 12px;
  --control-medium-paddingInline: 16px;
}
[data-density="normal"] {
  --control-small-size: 24px;
  --control-medium-size: 32px;
  --control-large-size: 40px;
}
[data-density="compact"] {
  --control-small-size: 20px;
  --control-medium-size: 28px;
  --control-large-size: 36px;
}
```

Density is implemented through CSS custom properties on a data attribute — components reference the properties, never hard-coded sizes.

**Accessibility-First:**
- All focus indicators work in Windows High Contrast mode (uses `outline`, not `box-shadow` alone)
- `forced-colors: active` media query support
- Minimum 4.5:1 contrast ratios enforced at the token level
- Focus ring uses a dual-ring technique: inner outline + outer box-shadow for visibility against any background

**Shadow/Depth:**
GitHub uses minimal shadows — the platform aesthetic is intentionally flat:

```css
--shadow-resting-small: 0 1px 0 rgba(31, 35, 40, 0.04);
--shadow-resting-medium: 0 3px 6px rgba(140, 149, 159, 0.15);
--shadow-floating-small: 0 0 0 1px rgba(31, 35, 40, 0.04), 0 8px 16px rgba(140, 149, 159, 0.15);
--shadow-floating-large: 0 0 0 1px rgba(31, 35, 40, 0.04), 0 12px 28px rgba(140, 149, 159, 0.3);
```

Two categories: "resting" (grounded surfaces) and "floating" (overlays/dropdowns). Clean separation.

**Additional Patterns:**
- 8 shadow tokens in two categories: "resting" (`--shadow-resting-xsmall/small/medium`) and "floating" (`--shadow-floating-small/medium/large/xlarge`) + `--shadow-inset` for pressed states
- Buttons layer `--button-default-shadow-resting` with `--button-default-shadow-inset` for depth. Primary buttons add `--shadow-highlight` as an inset glow.
- Dual focus strategy: fallback `:focus` with mixin, plus modern `:focus-visible` for keyboard-only. Dedicated `--focus-outlineColor` token.
- Density is per-component modifier classes (`.Box--condensed`, `.Box--spacious`) not a true global toggle — less elegant than CSS custom property approach, but proven at scale
- High contrast themes target 7:1 ratios using adjusted scale ranges

**Key Takeaway:** Dedicated state tokens per component variant give maximum theme control. `transition: none` on active is a pattern worth stealing — it makes press feedback feel instant. The resting/floating shadow categorization is cleaner than a single numbered scale.

---

### 6. Diana Malewicz — Modern Minimal

**Focus:** Design philosophy, visual quality benchmarking, "minimal but not empty."

**Core Philosophy:**
Modern Minimal sits between "trend-forward eye candy" (neumorphism, glassmorphism) and "purely functional boring." It is "functional, readable, sleek and sexy." The key insight: design trends look mesmerizing but you can't make a fully functional product with them. Modern Minimal is the practical sweet spot.

**Principles:**

| Principle | Application |
|-----------|-------------|
| **Whitespace is king** | Generous spacing makes interfaces feel clean and premium. But whitespace alone is sterile — balance with intentional visual details. |
| **Selective depth** | Subtle colorful shadows, blurred backgrounds, embosses, even glassmorphic elements are acceptable "to a healthy extent." Not flat, not fully elevated — a middle path. |
| **Color as emphasis** | Colors reserved for the most important actions and accents only. When color appears, it carries weight. Never decorative wallpaper. |
| **Roundness over borders** | Subtle, carefully calibrated corner radii define components organically. Prefer spacing + radius + soft shadows over visible outlines. |
| **Functional first** | Every visual choice must serve usability. Neumorphism is not accessible enough for daily use. Modern Minimal is. |

**What "minimal but not empty" means in practice:**
- Cards defined by shadow + radius, not borders
- Color used at full opacity for primary actions, not at 10% opacity everywhere
- Whitespace creates hierarchy, not decoration
- Small illustrated accents and iconographic flourishes prevent sterility
- Typography does heavy lifting — size/weight contrast replaces visual chrome

**Key Takeaway:** Modern Minimal is the target aesthetic philosophy. Visor's current state is "minimal and empty" — it has the restraint but lacks the intentional depth, color confidence, and typographic hierarchy that makes Modern Minimal work. The path forward is adding shadow-based depth, confident color, and micro-interactions while maintaining the clean foundation.

---

## Comparison Matrix

| Dimension | Radix Themes | Mantine | Park UI | shadcn/ui v4 | Primer | Modern Minimal |
|-----------|-------------|---------|---------|-------------|--------|----------------|
| **Depth model** | Layered shadows by elevation | Simple 5-step scale | Conservative (border + floating shadows) | Luma: soft elevation | Resting vs floating (2 categories) | Selective, subtle shadows |
| **Active state** | Scale step +2, optional `scale(0.97)` | `translateY(1px)` | Not prominent | None built-in | Dedicated active tokens | Not specified |
| **Hover state** | Scale step +1 background shift | Background tint + color shift | Variant-specific | Data-attribute driven | Dedicated hover tokens | Not specified |
| **Focus ring** | Outline only, 2px + offset | Outline-based | Outline-based | Outline-based | Dual-ring (outline + shadow) | Not specified |
| **Loading states** | None built-in | Comprehensive (Skeleton, LoadingOverlay, button loading) | Limited | None built-in | Limited | Not specified |
| **Animations** | CSS keyframes for overlays | Most comprehensive (enter/exit/collapse/shimmer) | Smooth tab indicators, standard overlay | Ecosystem-driven | Minimal | Not specified |
| **Color treatment** | Full 12-step semantic scale | 8 variant system with full surface fills | Virtual colorPalette abstraction | Simple role tokens | Dedicated state variant tokens | Color as emphasis, not decoration |
| **Density** | Single density | 5 sizes (xs-xl) | 3 sizes | Single density | 3 density modes via CSS props | Not specified |
| **Backdrop blur** | Used in overlays | `backdrop-filter: blur(4px)` on overlays | Standard | None | None | Acceptable "to healthy extent" |
| **Border vs shadow** | Shadow-first for depth | Shadow-first, borders for input fields | Border-heavy, shadows for floating | Minimal borders | Border-heavy + flat | Shadow + radius preferred |

---

## Deliverable 1: State Taxonomy

Complete interaction state set with visual treatment specifications for Visor.

### State Definitions

| State | Trigger | Visual Treatment | CSS Approach | Priority |
|-------|---------|-----------------|--------------|----------|
| **Default** | Initial render | Base surface + text colors | Standard token references | — |
| **Hover** | Mouse enter | Background shift to `var(--interactive-hover)` or next shade step. Subtle `transition: background-color 150ms ease` | `:hover` pseudo-class | **P0** — 30 components missing |
| **Active / Pressed** | Mouse down / touch start | `transform: translateY(1px)` for buttons. Background shift to `var(--interactive-active)` or step+2. Provides tactile feedback. | `:active` pseudo-class | **P0** — 50 components missing |
| **Focus** | Keyboard navigation | `outline: 2px solid var(--focus-ring-color); outline-offset: var(--focus-ring-offset)`. Must work in forced-colors mode. | `:focus-visible` | P1 — 23 missing but functional |
| **Disabled** | Programmatic | `opacity: 0.5; pointer-events: none; cursor: not-allowed` | `:disabled`, `[data-disabled]` | P2 — 26 missing |
| **Loading** | Async operation | Skeleton shimmer overlay or spinner. Button maintains width, shows spinner. | `.loading` class, `[data-loading]` | P1 — 50 components missing |
| **Error** | Validation failure | Border becomes `var(--border-error)`. Text becomes `var(--text-error)`. Subtle error background tint. | `.error`, `[data-invalid]` | P2 — form-specific |

### State Tokens Needed

New tokens required to support the full state taxonomy:

```css
/* Interactive state backgrounds */
--interactive-hover: /* neutral step +1 from surface */
--interactive-active: /* neutral step +2 from surface */

/* Per-variant state tokens (like Primer) */
--button-primary-hover: /* primary shade hover */
--button-primary-active: /* primary shade active */
--button-destructive-hover: /* destructive shade hover */
--button-destructive-active: /* destructive shade active */

/* Loading */
--skeleton-from: /* shimmer gradient start */
--skeleton-to: /* shimmer gradient end */
--skeleton-duration: 1.5s;
```

### Component State Requirements

Which states apply to which component categories:

| Category | Hover | Active | Focus | Disabled | Loading | Error |
|----------|-------|--------|-------|----------|---------|-------|
| **Buttons** (button, toggle-group) | Required | Required | Required | Required | Required | — |
| **Form inputs** (input, textarea, select, etc.) | Required | — | Required | Required | — | Required |
| **Navigation** (tabs, navbar, breadcrumb, pagination) | Required | Required | Required | Optional | — | — |
| **Cards / surfaces** (card, alert, banner) | Optional | — | — | — | Optional | — |
| **Overlays** (dialog, sheet, popover, dropdown) | — | — | — | — | — | — |
| **Data display** (table, accordion, carousel) | Row hover | — | — | — | Optional | — |

---

## Deliverable 2: Elevation/Depth System

### Shadow Token → Component Level Mapping

| Level | Token | Spread | Components | Usage |
|-------|-------|--------|------------|-------|
| **0 — Inset** | `--shadow-xs` | Tight, inward | Input fields (focus), inset indicators | Subtle depth within a surface |
| **1 — Resting** | `--shadow-sm` | 0 1px 2px | Cards, alerts, banners, table | Grounded surfaces, slight lift |
| **2 — Raised** | `--shadow-md` | 0 4px 6px | Hover cards, elevated cards, navbar | Interactive surfaces, moderate lift |
| **3 — Floating** | `--shadow-lg` | 0 10px 15px | Dropdowns, popovers, context menus, combobox list | Floating overlays above content |
| **4 — Modal** | `--shadow-xl` | 0 20px 25px | Dialogs, sheets, lightbox, command palette | Full-screen overlays, highest elevation |

### Before/After Comparison

**Cards (currently border-only → shadow-elevated):**

```css
/* Before */
.card {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}

/* After */
.card {
  box-shadow: var(--shadow-sm);
  border-radius: var(--radius-lg);
  /* Border removed — shadow defines the surface */
}
```

**Dialog (currently flat overlay → layered depth):**

```css
/* Before */
.overlay {
  background: var(--overlay-bg);
}
.content {
  box-shadow: var(--shadow-lg);
}

/* After */
.overlay {
  background: var(--overlay-bg);
  backdrop-filter: blur(4px);
}
.content {
  box-shadow: var(--shadow-xl);
}
```

**Dropdown Menu (currently shadow → consistent elevation):**

```css
/* Standardized floating surface */
.floating-surface {
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
/* Applied to: dropdown-menu, popover, context-menu, combobox, select, command, hover-card */
```

### Implementation Rule

Every component must use exactly ONE elevation level. Components should NEVER mix elevation levels or add custom shadows. The mapping above is the contract.

**Exception:** Focus rings may add a box-shadow supplementary to the component's elevation shadow when using the dual-ring technique (see State Taxonomy).

---

## Deliverable 3: Semantic Color Usage Guide

### Color Intent Across Component Types

| Intent | Button | Badge | Toast | Alert | Input Border | Text |
|--------|--------|-------|-------|-------|-------------|------|
| **Destructive** | Full red fill (step 9) | Red bg (step 3) + red text (step 11) | Red left border + red icon + red subtle bg | Red subtle bg + red border + red icon | Red border on error | Red text |
| **Success** | Full green fill | Green bg + green text | Green left border + green icon + green subtle bg | Green subtle bg + green border + green icon | Green border on valid | Green text |
| **Warning** | Full amber fill | Amber bg + amber text | Amber left border + amber icon + amber subtle bg | Amber subtle bg + amber border + amber icon | — | Amber text |
| **Info** | Full blue fill | Blue bg + blue text | Blue left border + blue icon + blue subtle bg | Blue subtle bg + blue border + blue icon | — | Blue text |

### Current Gaps

1. **Badges:** Currently 10% opacity tint makes destructive/warning nearly invisible in light mode. Need minimum step 3 (20-30% opacity) for background.
2. **Toasts:** Border-only treatment gives no visual weight. Need subtle background fill + left accent border + icon.
3. **Alerts:** Adequate but inconsistent — some use full borders, some use left-border-only.
4. **Form inputs:** Error states exist but no success/valid visual feedback.

### Color Application Rules

1. **Full fill** (step 9 bg + white/contrast text): Primary CTAs, filled buttons, active badges
2. **Subtle fill** (step 2–3 bg + step 11 text): Alerts, banners, toast backgrounds, badge defaults
3. **Border accent** (step 6–7 border): Input validation, alert side borders, toast accents
4. **Text only** (step 11 text): Inline status text, link colors, icon tinting
5. **Never:** step 1 opacity (invisible), border-only without background (weak signal)

---

## Deliverable 4: Micro-Interaction Inventory

### Priority Interactions (P0 — Implement First)

| Interaction | Component(s) | CSS Approach | Timing |
|-------------|-------------|-------------|--------|
| **Button press** | button, toggle-group | `transform: translateY(1px)` on `:active` | Instant (no transition on active) |
| **Hover background** | All interactive elements | `background-color` transition | `150ms ease` |
| **Focus ring appearance** | All focusable elements | `outline` with `transition: outline-offset 100ms ease` | `100ms ease` |
| **Input hover** | input, textarea, select, etc. | Border color shift to `var(--border-strong)` | `150ms ease` |

### Priority Interactions (P1 — Second Pass)

| Interaction | Component(s) | CSS Approach | Timing |
|-------------|-------------|-------------|--------|
| **Tab indicator slide** | tabs | Animated `left` + `width` on indicator element | `200ms ease` |
| **Accordion expand** | accordion, collapsible | `height` animation via `@keyframes` or `grid-template-rows: 0fr → 1fr` | `200ms ease-out` |
| **Dialog entrance** | dialog, sheet | `@keyframes`: fade-in + slide-up (dialog) or slide-from-edge (sheet) | `200ms ease-out` |
| **Toast entrance** | toast | `@keyframes`: slide-in from right + fade | `200ms ease-out` |
| **Dropdown open** | dropdown-menu, popover, context-menu | `@keyframes`: fade-in + scale from 0.95 → 1 | `150ms ease-out` |

### Priority Interactions (P2 — Polish Pass)

| Interaction | Component(s) | CSS Approach | Timing |
|-------------|-------------|-------------|--------|
| **Skeleton shimmer** | skeleton, image, async components | `background: linear-gradient(90deg, ...)` animated via `background-position` | `1.5s infinite` |
| **Progress bar** | progress | `@keyframes` for indeterminate state | `1s ease-in-out infinite` |
| **Checkbox/switch** | checkbox, switch | Scale pop on check (`transform: scale(1.1)` → `scale(1)`) | `100ms ease` |
| **Carousel slide** | carousel | `transform: translateX()` transition | `300ms ease` |
| **Backdrop blur** | dialog, sheet, fullscreen-overlay, lightbox | `backdrop-filter: blur(4px)` on overlay | Paired with overlay fade |

### Motion Tokens

All animations should reference existing motion tokens:

```css
/* Already defined in Visor */
--motion-duration-fast: 100ms;    /* Micro-interactions: focus, checkbox */
--motion-duration-normal: 200ms;  /* Standard: hover, expand, entrance */
--motion-duration-slow: 300ms;    /* Complex: page transitions, carousel */
--motion-easing-default: ease;
--motion-easing-in: ease-in;
--motion-easing-out: ease-out;
--motion-easing-in-out: ease-in-out;
```

### Reduced Motion

All animations must respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

This should be a global rule in the tokens package, not per-component.

---

## Deliverable 5: Component Visual Audit

### Audit Matrix — All 53 Inventory Components

Columns: Component | Current Hover | Current Active | Current Focus | Current Shadow | Gaps | Proposed Changes | Effort

#### Form Components (22)

| Component | Hover | Active | Focus | Shadow | Key Gaps | Proposed Changes | Effort |
|-----------|-------|--------|-------|--------|----------|-----------------|--------|
| **button** | Y | N | Y | N | No active state, no shadow | Add `:active` translateY(1px), add loading state | S |
| **calendar** | Y | N | Y | N | No active on date cells | Add `:active` bg shift on dates | S |
| **checkbox** | N | N | Y | N | No hover, no scale pop | Add hover bg, check animation | S |
| **combobox** | N | N | Y | Y | No hover on trigger | Add trigger hover, standardize dropdown shadow | S |
| **date-picker** | Y | N | Y | Y | Adequate | Minor: active state on date cells | XS |
| **field** | N | N | N | N | Wrapper only — no visual states needed | None | — |
| **fieldset** | N | N | N | N | Container only | None | — |
| **file-upload** | Y | N | Y | N | No active/drop feedback | Add active bg shift, drop zone highlight | S |
| **input** | N | N | Y | N | **No hover** | Add hover border shift, error bg tint | S |
| **label** | N | N | N | N | Text element — no interactive states needed | None | — |
| **number-input** | Y | Y | N | N | No focus ring | Add focus-visible outline | XS |
| **otp-input** | N | N | Y | N | No hover | Add hover border shift | XS |
| **password-input** | Y | N | Y | N | No active on toggle | Add toggle button active state | XS |
| **phone-input** | N | N | N | N | **No states at all** | Add hover, focus, country selector states | M |
| **radio-group** | N | N | Y | N | No hover | Add hover bg on radio items | S |
| **search-input** | Y | N | Y | N | Adequate | Minor: clear button active state | XS |
| **select** | N | N | Y | Y | No hover on trigger | Add trigger hover border | S |
| **slider** | N | Y | Y | Y | No hover on track | Add track hover color, thumb hover scale | S |
| **switch** | N | N | Y | N | No hover | Add hover bg shift on track | S |
| **tag-input** | N | N | N | N | **No states** | Add hover/focus on input, tag remove hover | M |
| **textarea** | N | N | Y | N | No hover | Add hover border shift | XS |
| **toggle-group** | Y | N | Y | N | No active | Add active translateY(1px) | XS |

#### Container / Layout (4)

| Component | Hover | Active | Focus | Shadow | Key Gaps | Proposed Changes | Effort |
|-----------|-------|--------|-------|--------|----------|-----------------|--------|
| **badge** | N | N | Y | N | Color too subtle (10% opacity) | Increase bg opacity, add solid variant | S |
| **card** | N | N | N | N | **Border-only, no shadow** | Replace border with shadow-sm, add hover variant | M |
| **sheet** | N | N | Y | Y | No backdrop blur | Add backdrop-filter: blur(4px) | S |
| **sidebar** | Y | N | Y | Y | Adequate | Minor: active state on nav items | S |

#### Content Display (8)

| Component | Hover | Active | Focus | Shadow | Key Gaps | Proposed Changes | Effort |
|-----------|-------|--------|-------|--------|----------|-----------------|--------|
| **accordion** | Y | N | Y | N | No active on trigger | Add active bg shift, smooth expand animation | S |
| **avatar** | N | N | N | N | Static display — no states needed | None | — |
| **carousel** | Y | N | Y | N | No slide transition animation | Add smooth slide transition, nav button active | S |
| **collapsible** | Y | N | Y | N | Adequate | Minor: smoother height animation | XS |
| **image** | N | N | N | N | Has loading state | None needed | — |
| **progress** | N | N | N | N | No indeterminate animation | Add indeterminate keyframes | S |
| **separator** | N | N | N | N | Decorative — no states needed | None | — |
| **skeleton** | N | N | N | N | Has shimmer | Adequate | — |

#### Navigation (4)

| Component | Hover | Active | Focus | Shadow | Key Gaps | Proposed Changes | Effort |
|-----------|-------|--------|-------|--------|----------|-----------------|--------|
| **breadcrumb** | Y | N | N | N | No focus ring, no active | Add focus-visible, active bg | S |
| **command** | N | N | N | N | **No hover/focus on items** | Add item hover bg, keyboard focus styling | M |
| **navbar** | Y | N | Y | N | No active state on nav items | Add active indicator, hover underline animation | S |
| **pagination** | Y | N | Y | N | No active | Add active state on page buttons | S |

#### Interaction (3)

| Component | Hover | Active | Focus | Shadow | Key Gaps | Proposed Changes | Effort |
|-----------|-------|--------|-------|--------|----------|-----------------|--------|
| **dropdown-menu** | N | N | Y | Y | No item hover (relies on JS) | Verify hover styling on items | S |
| **scroll-area** | Y | N | Y | N | Adequate | Minor: scrollbar hover visibility | XS |
| **tabs** | Y | N | Y | Y | No active, no indicator animation | Add sliding indicator, active tab press | M |

#### Overlay (6)

| Component | Hover | Active | Focus | Shadow | Key Gaps | Proposed Changes | Effort |
|-----------|-------|--------|-------|--------|----------|-----------------|--------|
| **context-menu** | N | N | Y | Y | No item hover | Add item hover bg | S |
| **dialog** | Y | N | Y | Y | No backdrop blur, no entrance animation | Add blur, entrance keyframes | M |
| **hover-card** | N | N | N | Y | Has entrance animation | Adequate | — |
| **lightbox** | Y | N | Y | N | No backdrop blur, no shadow | Add blur, shadow-xl on content | S |
| **menubar** | Y | Y | Y | Y | Most complete — reference implementation | None | — |
| **popover** | N | N | N | Y | Has entrance animation | Adequate | — |

#### Feedback (6)

| Component | Hover | Active | Focus | Shadow | Key Gaps | Proposed Changes | Effort |
|-----------|-------|--------|-------|--------|----------|-----------------|--------|
| **alert** | N | N | N | N | **No shadow, weak color** | Add subtle bg fill, icon, shadow-sm | M |
| **banner** | N | N | N | N | Weak color treatment | Add stronger semantic bg fills | S |
| **chart** | N | N | N | Y | Adequate for data viz | None | — |
| **table** | Y | N | N | N | No row focus, no shadow | Add row hover bg, focus ring, shadow-sm | M |
| **toast** | N | N | N | Y | **Border-only, weak color** | Add subtle bg fill, left accent, entrance animation | M |
| **tooltip** | N | N | N | Y | Has entrance animation | Adequate | — |

### Summary

| Effort | Count | Components |
|--------|-------|------------|
| **—** (no change) | 12 | field, fieldset, label, avatar, image, separator, skeleton, hover-card, popover, menubar, chart, tooltip |
| **XS** (< 30 min) | 9 | date-picker, number-input, otp-input, password-input, search-input, textarea, toggle-group, collapsible, scroll-area |
| **S** (30 min – 1 hr) | 18 | button, calendar, checkbox, combobox, file-upload, input, radio-group, select, slider, switch, badge, sheet, sidebar, accordion, carousel, breadcrumb, navbar, pagination, context-menu, dropdown-menu, lightbox, banner, progress |
| **M** (1–2 hrs) | 8 | phone-input, tag-input, card, command, tabs, dialog, alert, table, toast |

**Total implementation effort estimate:** ~30–40 hours across all components.

---

## Deliverable 6: Decision Document

See **ADR-002** at [`docs/decisions/002-visual-design-direction.md`](../decisions/002-visual-design-direction.md) for the full decision document covering:

1. Shadow vs Border for component definition
2. Animation intensity
3. Color treatment approach
4. Density options
5. Focus ring implementation
6. Backdrop blur usage

---

## Deliverable 7: Prioritized Implementation Plan

### Batch 1: Foundation — State System + Elevation (Est. 8–10 hrs)

**Dependency:** None. Must ship first — all subsequent batches build on these patterns.

| Ticket | Scope | Estimate |
|--------|-------|----------|
| Add `:hover` states to all form inputs | input, textarea, select, otp-input, password-input, search-input, number-input, phone-input, tag-input | 3 hrs |
| Add `:active` / pressed states to all interactive components | button, toggle-group, tabs, accordion triggers, nav items, pagination, breadcrumb links | 3 hrs |
| Implement elevation hierarchy — replace border-only cards with shadow | card, alert, table, toast, banner | 2 hrs |
| Add missing `:focus-visible` to components without it | breadcrumb, command items, table rows, number-input | 1 hr |

### Batch 2: Color Confidence — Semantic Color Overhaul (Est. 5–6 hrs)

**Dependency:** Batch 1 (elevation hierarchy must be in place).

| Ticket | Scope | Estimate |
|--------|-------|----------|
| Badge color overhaul — increase opacity, add solid variant | badge | 1 hr |
| Toast redesign — subtle bg fill + left accent border + entrance animation | toast | 2 hrs |
| Alert redesign — subtle bg fill + icon + consistent treatment | alert | 2 hrs |
| Banner — stronger semantic bg fills | banner | 1 hr |

### Batch 3: Micro-Interactions — Entrance/Exit Animations (Est. 6–8 hrs)

**Dependency:** Batch 1 (state system must exist).

| Ticket | Scope | Estimate |
|--------|-------|----------|
| Dialog/sheet entrance animations + backdrop blur | dialog, sheet, fullscreen-overlay, lightbox | 3 hrs |
| Dropdown/popover entrance animations (fade + scale) | dropdown-menu, context-menu, popover, combobox, select, command | 2 hrs |
| Tab indicator sliding animation | tabs | 1 hr |
| Toast entrance/exit animation | toast | 1 hr |
| Skeleton shimmer standardization | skeleton, image, add to async components | 1 hr |

### Batch 4: Polish — Typography + Density + Loading (Est. 5–6 hrs)

**Dependency:** Batches 1–3.

| Ticket | Scope | Estimate |
|--------|-------|----------|
| Typography hierarchy — card title/description, alert title/description weight differentiation | card, alert, toast, banner, dialog | 2 hrs |
| Button loading state with spinner | button | 1 hr |
| Checkbox/switch micro-animations (scale pop) | checkbox, switch | 1 hr |
| Progress indeterminate animation | progress | 0.5 hr |
| Global `prefers-reduced-motion` rule | tokens package | 0.5 hr |
| Carousel smooth slide transition | carousel | 1 hr |

### Batch 5: Cross-Cutting — Tokens + Documentation (Est. 3–4 hrs)

**Dependency:** Batches 1–4 complete.

| Ticket | Scope | Estimate |
|--------|-------|----------|
| Add new state tokens (interactive-hover, interactive-active, skeleton, etc.) | tokens package | 1 hr |
| Update token-rules.md with elevation mapping and state rules | docs | 1 hr |
| Update component docs with new state examples | docs site | 1 hr |
| Visual regression baseline update | test infrastructure | 1 hr |

### Total Estimate

| Batch | Estimate | Running Total |
|-------|----------|---------------|
| 1: Foundation | 8–10 hrs | 8–10 hrs |
| 2: Color | 5–6 hrs | 13–16 hrs |
| 3: Animations | 6–8 hrs | 19–24 hrs |
| 4: Polish | 5–6 hrs | 24–30 hrs |
| 5: Cross-Cutting | 3–4 hrs | 27–34 hrs |

**Total: ~27–34 hours** across 5 batches, each independently shippable.

---

## Recommendation

**Target aesthetic: Modern Minimal with systematic depth.** Visor should feel like a cross between Radix Themes' precision and Mantine's animation polish, grounded in Diana Malewicz's Modern Minimal philosophy.

**The three highest-impact changes:**

1. **Shadow-first depth** (replace border-only cards/alerts/toasts with shadow elevation) — immediately transforms perceived quality
2. **Complete state coverage** (hover + active on every interactive element) — makes the system feel responsive and alive
3. **Entrance animations** (dialog, dropdown, toast) — adds the "not empty" to "minimal"

These three changes, applied consistently across all 53 components, will transform Visor from "engineering placeholder" to "production-grade." The remaining work (color confidence, typography, loading states) polishes what the foundation establishes.

**Next step:** Approve ADR-002 visual direction, then begin Batch 1 implementation.
