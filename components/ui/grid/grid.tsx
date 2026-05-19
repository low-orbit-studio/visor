import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./grid.module.css"

// ---------------------------------------------------------------------------
// Token vocabularies
// ---------------------------------------------------------------------------

export type GridSpacing =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"

export type ResponsiveProp<T> = T | { base: T; sm?: T; md?: T; lg?: T; xl?: T }

export type GridAlign = "start" | "center" | "end" | "stretch"
export type GridJustify = "start" | "center" | "end" | "stretch"

const SPACING_MAP: Record<GridSpacing, string> = {
  none: "0",
  xs: "var(--spacing-1, 0.25rem)",
  sm: "var(--spacing-2, 0.5rem)",
  md: "var(--spacing-4, 1rem)",
  lg: "var(--spacing-6, 1.5rem)",
  xl: "var(--spacing-8, 2rem)",
  "2xl": "var(--spacing-12, 3rem)",
  "3xl": "var(--spacing-16, 4rem)",
}

function resolveResponsiveSpacing(
  value: ResponsiveProp<GridSpacing> | undefined,
  prefix: string
): Record<string, string> {
  if (value === undefined) return {}
  if (typeof value === "object" && value !== null && "base" in value) {
    const v = value as { base: GridSpacing; sm?: GridSpacing; md?: GridSpacing; lg?: GridSpacing; xl?: GridSpacing }
    const out: Record<string, string> = { [`--${prefix}`]: SPACING_MAP[v.base] }
    if (v.sm !== undefined) out[`--${prefix}-sm`] = SPACING_MAP[v.sm]
    if (v.md !== undefined) out[`--${prefix}-md`] = SPACING_MAP[v.md]
    if (v.lg !== undefined) out[`--${prefix}-lg`] = SPACING_MAP[v.lg]
    if (v.xl !== undefined) out[`--${prefix}-xl`] = SPACING_MAP[v.xl]
    return out
  }
  return { [`--${prefix}`]: SPACING_MAP[value as GridSpacing] }
}

function resolveResponsiveNumber(
  value: ResponsiveProp<number> | undefined,
  prefix: string
): Record<string, string | number> {
  if (value === undefined) return {}
  if (typeof value === "object" && value !== null && "base" in value) {
    const v = value as { base: number; sm?: number; md?: number; lg?: number; xl?: number }
    const out: Record<string, string | number> = { [`--${prefix}`]: v.base }
    if (v.sm !== undefined) out[`--${prefix}-sm`] = v.sm
    if (v.md !== undefined) out[`--${prefix}-md`] = v.md
    if (v.lg !== undefined) out[`--${prefix}-lg`] = v.lg
    if (v.xl !== undefined) out[`--${prefix}-xl`] = v.xl
    return out
  }
  return { [`--${prefix}`]: value as number }
}

// ---------------------------------------------------------------------------
// GridProps
// ---------------------------------------------------------------------------

export interface GridOwnProps {
  /** Render as a different HTML element. Defaults to `<div>`. */
  as?: keyof React.JSX.IntrinsicElements
  /**
   * Either a column count (number, or responsive map of numbers) or an
   * explicit `grid-template-columns` string for advanced layouts
   * (e.g. `"1fr 2fr"`). Defaults to `1`.
   */
  columns?: ResponsiveProp<number> | string
  /** Space between cells. Token-named. Defaults to `"md"`. */
  gap?: ResponsiveProp<GridSpacing>
  /** Block-axis (vertical) alignment of items within their cells. */
  align?: GridAlign
  /** Inline-axis (horizontal) alignment of items within their cells. */
  justify?: GridJustify
}

export type GridProps = GridOwnProps & Omit<React.HTMLAttributes<HTMLElement>, keyof GridOwnProps>

const Grid = React.forwardRef<HTMLElement, GridProps>(
  (
    {
      as: Tag = "div",
      className,
      style,
      columns = 1,
      gap = "md",
      align,
      justify,
      ...rest
    },
    ref
  ) => {
    const isTemplateString = typeof columns === "string"
    const colVars = isTemplateString
      ? ({ "--grid-template-columns": columns } as Record<string, string>)
      : resolveResponsiveNumber(columns as ResponsiveProp<number>, "grid-cols")
    const gapVars = resolveResponsiveSpacing(gap, "grid-gap")

    const Component = Tag as React.ElementType

    return (
      <Component
        ref={ref}
        data-slot="grid"
        data-template={isTemplateString ? "true" : undefined}
        className={cn(
          styles.grid,
          align === "start" && styles.alignStart,
          align === "center" && styles.alignCenter,
          align === "end" && styles.alignEnd,
          align === "stretch" && styles.alignStretch,
          justify === "start" && styles.justifyStart,
          justify === "center" && styles.justifyCenter,
          justify === "end" && styles.justifyEnd,
          justify === "stretch" && styles.justifyStretch,
          className
        )}
        style={{ ...colVars, ...gapVars, ...style }}
        {...rest}
      />
    )
  }
)
Grid.displayName = "Grid"

export { Grid }
