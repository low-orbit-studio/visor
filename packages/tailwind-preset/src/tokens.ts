/**
 * Visor Tailwind preset — token map
 *
 * Single source of truth for which Visor CSS custom properties are exposed
 * as Tailwind theme keys. Both the Tailwind 3 preset (v3.ts) and the
 * Tailwind 4 @theme CSS export (v4.ts) consume this module.
 *
 * Each entry maps a Tailwind theme path (`colors.text.primary`,
 * `spacing.4`, `boxShadow.md`, etc.) to the underlying Visor CSS variable
 * name (without the leading `--`). Per-theme overrides — like
 * Knowmentum's Char/Bone/Ember palette or Veronica's warmth tokens —
 * flow through the CSS variable layer at runtime, so this preset stays
 * theme-agnostic.
 */

/**
 * A flat mapping from Tailwind theme dot-path to the Visor token name it
 * resolves to (no `--` prefix). E.g. `colors.text.primary -> text-primary`.
 */
export type VisorTokenMap = Record<string, string>

/**
 * Visor color tokens exposed to Tailwind.
 *
 * Three layers, all reachable via Tailwind class names:
 *
 *   - Primitive: `bg-color-primary-500`, `text-color-neutral-900`
 *   - Semantic / adaptive (theme-aware): `bg-surface-card`, `text-text-primary`,
 *     `border-border-default`, `bg-interactive-primary-bg`
 *   - Top-level convenience aliases so consumers can write `bg-card`,
 *     `text-primary`, `border-default`, etc. without the semantic prefix.
 */
export const colorTokens: VisorTokenMap = {
  // ─── Primitive: Neutral / pure ───────────────────────────────
  "color.neutral.50": "color-neutral-50",
  "color.neutral.100": "color-neutral-100",
  "color.neutral.200": "color-neutral-200",
  "color.neutral.300": "color-neutral-300",
  "color.neutral.400": "color-neutral-400",
  "color.neutral.500": "color-neutral-500",
  "color.neutral.600": "color-neutral-600",
  "color.neutral.700": "color-neutral-700",
  "color.neutral.800": "color-neutral-800",
  "color.neutral.900": "color-neutral-900",
  "color.neutral.950": "color-neutral-950",
  "color.white": "color-white",
  "color.black": "color-black",

  // ─── Primitive: Primary scale ────────────────────────────────
  "color.primary.50": "color-primary-50",
  "color.primary.100": "color-primary-100",
  "color.primary.200": "color-primary-200",
  "color.primary.300": "color-primary-300",
  "color.primary.400": "color-primary-400",
  "color.primary.500": "color-primary-500",
  "color.primary.600": "color-primary-600",
  "color.primary.700": "color-primary-700",
  "color.primary.800": "color-primary-800",
  "color.primary.900": "color-primary-900",

  // ─── Primitive: Status ramps ─────────────────────────────────
  "color.success.50": "color-success-50",
  "color.success.100": "color-success-100",
  "color.success.500": "color-success-500",
  "color.success.600": "color-success-600",
  "color.success.700": "color-success-700",
  "color.success.900": "color-success-900",

  "color.warning.50": "color-warning-50",
  "color.warning.100": "color-warning-100",
  "color.warning.500": "color-warning-500",
  "color.warning.600": "color-warning-600",
  "color.warning.700": "color-warning-700",
  "color.warning.900": "color-warning-900",

  "color.error.50": "color-error-50",
  "color.error.100": "color-error-100",
  "color.error.500": "color-error-500",
  "color.error.600": "color-error-600",
  "color.error.700": "color-error-700",
  "color.error.900": "color-error-900",

  "color.info.50": "color-info-50",
  "color.info.100": "color-info-100",
  "color.info.500": "color-info-500",
  "color.info.600": "color-info-600",
  "color.info.700": "color-info-700",
  "color.info.900": "color-info-900",

  // ─── Semantic: text ──────────────────────────────────────────
  "text.primary": "text-primary",
  "text.secondary": "text-secondary",
  "text.tertiary": "text-tertiary",
  "text.disabled": "text-disabled",
  "text.inverse": "text-inverse",
  "text.inverse-secondary": "text-inverse-secondary",
  "text.link": "text-link",
  "text.link-hover": "text-link-hover",
  "text.success": "text-success",
  "text.warning": "text-warning",
  "text.error": "text-error",
  "text.info": "text-info",

  // ─── Semantic: surface ───────────────────────────────────────
  "surface.page": "surface-page",
  "surface.card": "surface-card",
  "surface.subtle": "surface-subtle",
  "surface.muted": "surface-muted",
  "surface.overlay": "surface-overlay",
  "surface.popover": "surface-popover",
  "surface.interactive-default": "surface-interactive-default",
  "surface.interactive-hover": "surface-interactive-hover",
  "surface.interactive-active": "surface-interactive-active",
  "surface.interactive-disabled": "surface-interactive-disabled",
  "surface.selected": "surface-selected",
  "surface.accent-subtle": "surface-accent-subtle",
  "surface.accent-default": "surface-accent-default",
  "surface.accent-strong": "surface-accent-strong",
  "surface.success-subtle": "surface-success-subtle",
  "surface.success-default": "surface-success-default",
  "surface.warning-subtle": "surface-warning-subtle",
  "surface.warning-default": "surface-warning-default",
  "surface.error-subtle": "surface-error-subtle",
  "surface.error-default": "surface-error-default",
  "surface.info-subtle": "surface-info-subtle",
  "surface.info-default": "surface-info-default",
  "surface.elev-0": "surface-elev-0",
  "surface.elev-1": "surface-elev-1",
  "surface.elev-2": "surface-elev-2",
  "surface.elev-3": "surface-elev-3",
  "surface.elev-4": "surface-elev-4",

  // ─── Semantic: border ────────────────────────────────────────
  "border.default": "border-default",
  "border.muted": "border-muted",
  "border.strong": "border-strong",
  "border.focus": "border-focus",
  "border.disabled": "border-disabled",
  "border.input": "border-input",
  "border.success": "border-success",
  "border.warning": "border-warning",
  "border.error": "border-error",
  "border.info": "border-info",

  // ─── Semantic: interactive ───────────────────────────────────
  "interactive.primary-bg": "interactive-primary-bg",
  "interactive.primary-bg-hover": "interactive-primary-bg-hover",
  "interactive.primary-bg-active": "interactive-primary-bg-active",
  "interactive.primary-text": "interactive-primary-text",
  "interactive.secondary-bg": "interactive-secondary-bg",
  "interactive.secondary-bg-hover": "interactive-secondary-bg-hover",
  "interactive.secondary-bg-active": "interactive-secondary-bg-active",
  "interactive.secondary-text": "interactive-secondary-text",
  "interactive.secondary-border": "interactive-secondary-border",
  "interactive.destructive-bg": "interactive-destructive-bg",
  "interactive.destructive-bg-hover": "interactive-destructive-bg-hover",
  "interactive.destructive-text": "interactive-destructive-text",
  "interactive.ghost-bg": "interactive-ghost-bg",
  "interactive.ghost-bg-hover": "interactive-ghost-bg-hover",

  // ─── Semantic: chart palette (--chart-1..5) ──────────────────
  "chart.1": "chart-1",
  "chart.2": "chart-2",
  "chart.3": "chart-3",
  "chart.4": "chart-4",
  "chart.5": "chart-5",

  // ─── Semantic: sidebar palette ───────────────────────────────
  "sidebar.bg": "sidebar-bg",
  "sidebar.text": "sidebar-text",
  "sidebar.primary-bg": "sidebar-primary-bg",
  "sidebar.primary-text": "sidebar-primary-text",
  "sidebar.accent-bg": "sidebar-accent-bg",
  "sidebar.accent-text": "sidebar-accent-text",
  "sidebar.border": "sidebar-border",
  "sidebar.ring": "sidebar-ring",
  "sidebar.text-muted": "sidebar-text-muted",
}

/** Visor spacing scale, surfaced as `gap-N`, `p-N`, `m-N`, etc. */
export const spacingTokens: VisorTokenMap = {
  "0": "spacing-0",
  "1": "spacing-1",
  "2": "spacing-2",
  "3": "spacing-3",
  // Tailwind class names cannot contain `_`; `3.5` is the conventional Tailwind name.
  "3.5": "spacing-3_5",
  "4": "spacing-4",
  "4.5": "spacing-4_5",
  "5": "spacing-5",
  "6": "spacing-6",
  "8": "spacing-8",
  "10": "spacing-10",
  "12": "spacing-12",
  "16": "spacing-16",
  "20": "spacing-20",
  "24": "spacing-24",
}

/** Visor font-family slots. */
export const fontFamilyTokens: VisorTokenMap = {
  sans: "font-sans",
  mono: "font-mono",
  body: "font-body",
  heading: "font-heading",
  display: "font-display",
}

/** Visor type scale. */
export const fontSizeTokens: VisorTokenMap = {
  "2xs": "font-size-2xs",
  xs: "font-size-xs",
  sm: "font-size-sm",
  base: "font-size-base",
  lg: "font-size-lg",
  xl: "font-size-xl",
  "2xl": "font-size-2xl",
  "3xl": "font-size-3xl",
  "4xl": "font-size-4xl",
}

/** Visor font weight scale. */
export const fontWeightTokens: VisorTokenMap = {
  normal: "font-weight-normal",
  medium: "font-weight-medium",
  semibold: "font-weight-semibold",
  bold: "font-weight-bold",
}

/** Visor line-height scale. */
export const lineHeightTokens: VisorTokenMap = {
  none: "line-height-none",
  tight: "line-height-tight",
  snug: "line-height-snug",
  normal: "line-height-normal",
  relaxed: "line-height-relaxed",
  loose: "line-height-loose",
}

/** Visor border radius scale (matches Tailwind's sm/md/lg/xl/2xl/3xl/full + none). */
export const borderRadiusTokens: VisorTokenMap = {
  none: "radius-none",
  sm: "radius-sm",
  md: "radius-md",
  lg: "radius-lg",
  xl: "radius-xl",
  "2xl": "radius-2xl",
  "3xl": "radius-3xl",
  full: "radius-full",
  // Convenience alias — many consumer apps already write `rounded-pill`.
  pill: "radius-full",
}

/** Visor border-width scale. */
export const borderWidthTokens: VisorTokenMap = {
  "1": "border-width-1",
  "2": "border-width-2",
  "3": "border-width-3",
  "4": "border-width-4",
  thin: "stroke-width-thin",
  regular: "stroke-width-regular",
  medium: "stroke-width-medium",
  thick: "stroke-width-thick",
}

/** Visor elevation / shadow scale. */
export const boxShadowTokens: VisorTokenMap = {
  xs: "shadow-xs",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
}

/** Visor opacity scale. */
export const opacityTokens: VisorTokenMap = {
  "5": "opacity-5",
  "10": "opacity-10",
  "12": "opacity-12",
  "20": "opacity-20",
  "40": "opacity-40",
  "50": "opacity-50",
  "60": "opacity-60",
  "80": "opacity-80",
}

/** Visor z-index scale. */
export const zIndexTokens: VisorTokenMap = {
  base: "z-base",
  raised: "z-raised",
  dropdown: "z-dropdown",
  sticky: "z-sticky",
  modal: "z-modal",
  popover: "z-popover",
  toast: "z-toast",
}

/** Visor motion duration scale (semantic). */
export const transitionDurationTokens: VisorTokenMap = {
  fast: "motion-duration-fast",
  normal: "motion-duration-normal",
  slow: "motion-duration-slow",
}

/** Visor motion easing scale (semantic). */
export const transitionTimingFunctionTokens: VisorTokenMap = {
  DEFAULT: "motion-easing-default",
  enter: "motion-easing-enter",
  exit: "motion-easing-exit",
  spring: "motion-easing-spring",
}

/** Visor ring-width / focus-ring tokens. */
export const ringWidthTokens: VisorTokenMap = {
  DEFAULT: "focus-ring-width",
  offset: "focus-ring-offset",
}

/**
 * Set a deep property on a nested object using a dot path.
 * Tailwind 3's `theme.extend.colors` accepts nested objects, so we expand
 * the flat `"color.primary.500"` keys into `{ color: { primary: { 500: ... } } }`.
 */
export function setDeep(
  target: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const segments = path.split(".")
  let cursor: Record<string, unknown> = target
  for (let i = 0; i < segments.length - 1; i += 1) {
    const key = segments[i]
    const next = cursor[key]
    if (!next || typeof next !== "object") {
      const fresh: Record<string, unknown> = {}
      cursor[key] = fresh
      cursor = fresh
    } else {
      cursor = next as Record<string, unknown>
    }
  }
  cursor[segments[segments.length - 1]] = value
}

/**
 * Convert a nested-path map (`"color.primary.500": "color-primary-500"`)
 * into a deep Tailwind theme object: `{ color: { primary: { 500: "var(--color-primary-500)" } } }`.
 *
 * Only `colorTokens` uses multi-segment paths today — every other Visor
 * Tailwind theme key is a leaf-only flat map, so `expandFlatMap` below
 * is the right tool for those.
 */
export function expandNestedMap(map: VisorTokenMap): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [path, varName] of Object.entries(map)) {
    setDeep(out, path, `var(--${varName})`)
  }
  return out
}

/**
 * Convert a leaf-only `{ "4": "spacing-4", "3.5": "spacing-3_5" }` map into
 * `{ "4": "var(--spacing-4)", "3.5": "var(--spacing-3_5)" }`. Keys are
 * preserved verbatim — no dot-splitting — so Tailwind utilities like
 * `gap-3.5` and `p-4.5` resolve to the right variable.
 */
export function expandFlatMap(map: VisorTokenMap): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, varName] of Object.entries(map)) {
    out[key] = `var(--${varName})`
  }
  return out
}

/**
 * Backwards-compatible alias — defaults to nested expansion so callers
 * that historically pointed at `expandMap` for color tokens keep working.
 */
export function expandMap(map: VisorTokenMap): Record<string, unknown> {
  return expandNestedMap(map)
}

/**
 * All token maps grouped by Tailwind theme key.
 *
 * The shape of this object is the contract the validator checks: every
 * Visor token that the preset claims to expose must appear here at least
 * once, and the v3 preset is built mechanically from it.
 */
export const visorTokenMaps = {
  colors: colorTokens,
  spacing: spacingTokens,
  fontFamily: fontFamilyTokens,
  fontSize: fontSizeTokens,
  fontWeight: fontWeightTokens,
  lineHeight: lineHeightTokens,
  borderRadius: borderRadiusTokens,
  borderWidth: borderWidthTokens,
  boxShadow: boxShadowTokens,
  opacity: opacityTokens,
  zIndex: zIndexTokens,
  transitionDuration: transitionDurationTokens,
  transitionTimingFunction: transitionTimingFunctionTokens,
  ringWidth: ringWidthTokens,
} as const

export type VisorTokenMaps = typeof visorTokenMaps

/**
 * Flat list of every Visor CSS variable this preset exposes (without `--`).
 * Useful for validation: every entry should match a token emitted by
 * `@loworbitstudio/visor-core` or `@loworbitstudio/visor-theme-engine`.
 */
export function listExposedTokens(): string[] {
  const seen = new Set<string>()
  for (const map of Object.values(visorTokenMaps)) {
    for (const tokenName of Object.values(map)) {
      seen.add(tokenName)
    }
  }
  return [...seen].sort()
}
