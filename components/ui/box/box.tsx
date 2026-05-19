import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./box.module.css"

// ---------------------------------------------------------------------------
// Token vocabularies — typed so off-system values are type errors.
// ---------------------------------------------------------------------------

/**
 * Spacing token suffixes. These map 1:1 to the `--spacing-*` CSS variables
 * shipped by `@loworbitstudio/visor-core`. We expose the friendly aliases
 * (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`) in addition to the raw
 * numeric suffixes so consumers can write `padding="md"`.
 */
export type SpacingToken =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"

/** Border radius tokens (`--radius-*`). */
export type RadiusToken =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "full"

/**
 * Visor surface tokens — the named `--surface-*` properties. We accept a
 * shorthand alias ("card", "subtle", "muted", "page") that maps to the
 * underlying variable. Off-system values are intentionally rejected.
 */
export type SurfaceToken =
  | "page"
  | "card"
  | "subtle"
  | "muted"
  | "popover"
  | "accent-subtle"
  | "accent-default"
  | "success-subtle"
  | "warning-subtle"
  | "error-subtle"
  | "info-subtle"

/** Border color tokens (`--border-*`). */
export type BorderToken =
  | "default"
  | "muted"
  | "strong"
  | "focus"
  | "success"
  | "warning"
  | "error"
  | "info"

/**
 * Responsive prop syntax. Plain token (e.g. `"md"`) or a breakpoint map
 * keyed by Visor breakpoints. The `base` key is required for the map shape
 * to keep responsive intent explicit at the smallest viewport.
 */
export type ResponsiveProp<T> = T | { base: T; sm?: T; md?: T; lg?: T; xl?: T }

// ---------------------------------------------------------------------------
// Token → CSS-variable resolution helpers.
// ---------------------------------------------------------------------------

const SPACING_MAP: Record<SpacingToken, string> = {
  none: "0",
  xs: "var(--spacing-1, 0.25rem)",
  sm: "var(--spacing-2, 0.5rem)",
  md: "var(--spacing-4, 1rem)",
  lg: "var(--spacing-6, 1.5rem)",
  xl: "var(--spacing-8, 2rem)",
  "2xl": "var(--spacing-12, 3rem)",
  "3xl": "var(--spacing-16, 4rem)",
}

const RADIUS_MAP: Record<RadiusToken, string> = {
  none: "0",
  sm: "var(--radius-sm, 2px)",
  md: "var(--radius-md, 4px)",
  lg: "var(--radius-lg, 8px)",
  xl: "var(--radius-xl, 12px)",
  "2xl": "var(--radius-2xl, 16px)",
  "3xl": "var(--radius-3xl, 24px)",
  full: "var(--radius-full, 9999px)",
}

function resolveResponsive<T>(value: ResponsiveProp<T> | undefined): {
  base: T | undefined
  sm: T | undefined
  md: T | undefined
  lg: T | undefined
  xl: T | undefined
} {
  if (value === undefined) {
    return { base: undefined, sm: undefined, md: undefined, lg: undefined, xl: undefined }
  }
  if (typeof value === "object" && value !== null && "base" in value) {
    const v = value as { base: T; sm?: T; md?: T; lg?: T; xl?: T }
    return { base: v.base, sm: v.sm, md: v.md, lg: v.lg, xl: v.xl }
  }
  return { base: value as T, sm: undefined, md: undefined, lg: undefined, xl: undefined }
}

/**
 * Resolve a spacing token (or responsive map) into the inline-style CSS
 * variables that the module CSS picks up. Variables are namespaced by the
 * prefix the caller chooses (e.g. `box-p`, `box-px`, `box-pl`).
 */
function spacingVars(
  prefix: string,
  value: ResponsiveProp<SpacingToken> | undefined,
  componentPrefix: string
): Record<string, string> {
  const out: Record<string, string> = {}
  if (value === undefined) return out
  const { base, sm, md, lg, xl } = resolveResponsive(value)
  if (base !== undefined) out[`--${componentPrefix}-${prefix}`] = SPACING_MAP[base]
  if (sm !== undefined) out[`--${componentPrefix}-${prefix}-sm`] = SPACING_MAP[sm]
  if (md !== undefined) out[`--${componentPrefix}-${prefix}-md`] = SPACING_MAP[md]
  if (lg !== undefined) out[`--${componentPrefix}-${prefix}-lg`] = SPACING_MAP[lg]
  if (xl !== undefined) out[`--${componentPrefix}-${prefix}-xl`] = SPACING_MAP[xl]
  return out
}

// ---------------------------------------------------------------------------
// BoxProps
// ---------------------------------------------------------------------------

/**
 * Box is the universal layout wrapper. Use it for padding, margin, background,
 * border, and border-radius. For arrangement of children, reach for Stack,
 * Inline, or Grid instead.
 */
export interface BoxOwnProps {
  /** Render as a different HTML element. Defaults to `<div>`. */
  as?: keyof React.JSX.IntrinsicElements
  /** Shorthand padding on all sides. */
  padding?: ResponsiveProp<SpacingToken>
  /** Shorthand padding on the X axis. Overrides `padding` for left/right. */
  paddingX?: ResponsiveProp<SpacingToken>
  /** Shorthand padding on the Y axis. Overrides `padding` for top/bottom. */
  paddingY?: ResponsiveProp<SpacingToken>
  /** Padding on a single edge. Overrides `padding`/`paddingX`/`paddingY`. */
  paddingTop?: ResponsiveProp<SpacingToken>
  paddingRight?: ResponsiveProp<SpacingToken>
  paddingBottom?: ResponsiveProp<SpacingToken>
  paddingLeft?: ResponsiveProp<SpacingToken>
  /** Shorthand margin on all sides. */
  margin?: ResponsiveProp<SpacingToken>
  marginX?: ResponsiveProp<SpacingToken>
  marginY?: ResponsiveProp<SpacingToken>
  marginTop?: ResponsiveProp<SpacingToken>
  marginRight?: ResponsiveProp<SpacingToken>
  marginBottom?: ResponsiveProp<SpacingToken>
  marginLeft?: ResponsiveProp<SpacingToken>
  /** Token-named background surface. */
  bg?: SurfaceToken
  /**
   * When true, applies a 1.5px (regular stroke) `--border-default` border.
   * When a token name (e.g. "strong" or "error") is passed, uses that
   * border color token instead.
   */
  border?: boolean | BorderToken
  /** Token-named border radius. */
  borderRadius?: RadiusToken
}

export type BoxProps = BoxOwnProps & Omit<React.HTMLAttributes<HTMLElement>, keyof BoxOwnProps>

/** Build the inline `style` object for a Box given its token-named props. */
export function buildBoxStyle(
  props: BoxOwnProps,
  componentPrefix = "box"
): React.CSSProperties {
  const out: Record<string, string> = {}

  // Padding
  Object.assign(out, spacingVars("p", props.padding, componentPrefix))
  Object.assign(out, spacingVars("px", props.paddingX, componentPrefix))
  Object.assign(out, spacingVars("py", props.paddingY, componentPrefix))
  Object.assign(out, spacingVars("pt", props.paddingTop, componentPrefix))
  Object.assign(out, spacingVars("pr", props.paddingRight, componentPrefix))
  Object.assign(out, spacingVars("pb", props.paddingBottom, componentPrefix))
  Object.assign(out, spacingVars("pl", props.paddingLeft, componentPrefix))

  // Margin
  Object.assign(out, spacingVars("m", props.margin, componentPrefix))
  Object.assign(out, spacingVars("mx", props.marginX, componentPrefix))
  Object.assign(out, spacingVars("my", props.marginY, componentPrefix))
  Object.assign(out, spacingVars("mt", props.marginTop, componentPrefix))
  Object.assign(out, spacingVars("mr", props.marginRight, componentPrefix))
  Object.assign(out, spacingVars("mb", props.marginBottom, componentPrefix))
  Object.assign(out, spacingVars("ml", props.marginLeft, componentPrefix))

  if (props.bg !== undefined) {
    out[`--${componentPrefix}-bg`] = `var(--surface-${props.bg})`
  }
  if (props.borderRadius !== undefined) {
    out[`--${componentPrefix}-radius`] = RADIUS_MAP[props.borderRadius]
  }
  if (props.border === true) {
    out[`--${componentPrefix}-border-color`] = "var(--border-default, #e5e7eb)"
  } else if (typeof props.border === "string") {
    out[`--${componentPrefix}-border-color`] = `var(--border-${props.border})`
  }

  return out as React.CSSProperties
}

// ---------------------------------------------------------------------------
// Box component
// ---------------------------------------------------------------------------

const Box = React.forwardRef<HTMLElement, BoxProps>(
  (
    {
      as: Tag = "div",
      className,
      style,
      padding,
      paddingX,
      paddingY,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      margin,
      marginX,
      marginY,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      bg,
      border,
      borderRadius,
      ...rest
    },
    ref
  ) => {
    const boxStyle = buildBoxStyle({
      padding,
      paddingX,
      paddingY,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      margin,
      marginX,
      marginY,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      bg,
      border,
      borderRadius,
    })

    const Component = Tag as React.ElementType

    return (
      <Component
        ref={ref}
        data-slot="box"
        data-border={border ? "true" : undefined}
        className={cn(styles.box, className)}
        style={{ ...boxStyle, ...style }}
        {...rest}
      />
    )
  }
)
Box.displayName = "Box"

export { Box }
