import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./inline.module.css"

// ---------------------------------------------------------------------------
// Token vocabularies
// ---------------------------------------------------------------------------

export type InlineSpacing =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"

export type ResponsiveProp<T> = T | { base: T; sm?: T; md?: T; lg?: T; xl?: T }

export type InlineAlign = "start" | "center" | "end" | "stretch" | "baseline"
export type InlineJustify =
  | "start"
  | "center"
  | "end"
  | "between"
  | "around"
  | "evenly"

const SPACING_MAP: Record<InlineSpacing, string> = {
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
  value: ResponsiveProp<InlineSpacing> | undefined,
  prefix: string
): Record<string, string> {
  if (value === undefined) return {}
  if (typeof value === "object" && value !== null && "base" in value) {
    const v = value as { base: InlineSpacing; sm?: InlineSpacing; md?: InlineSpacing; lg?: InlineSpacing; xl?: InlineSpacing }
    const out: Record<string, string> = { [`--${prefix}`]: SPACING_MAP[v.base] }
    if (v.sm !== undefined) out[`--${prefix}-sm`] = SPACING_MAP[v.sm]
    if (v.md !== undefined) out[`--${prefix}-md`] = SPACING_MAP[v.md]
    if (v.lg !== undefined) out[`--${prefix}-lg`] = SPACING_MAP[v.lg]
    if (v.xl !== undefined) out[`--${prefix}-xl`] = SPACING_MAP[v.xl]
    return out
  }
  return { [`--${prefix}`]: SPACING_MAP[value as InlineSpacing] }
}

// ---------------------------------------------------------------------------
// InlineProps
// ---------------------------------------------------------------------------

export interface InlineOwnProps {
  /** Render as a different HTML element. Defaults to `<div>`. */
  as?: keyof React.JSX.IntrinsicElements
  /** Space between children. Token-named. Defaults to `"md"`. */
  gap?: ResponsiveProp<InlineSpacing>
  /** Cross-axis alignment (vertical in a row flex). Defaults to `"center"`. */
  align?: InlineAlign
  /** Main-axis alignment (horizontal in a row flex). */
  justify?: InlineJustify
  /** Allow children to wrap onto multiple lines. Defaults to `false`. */
  wrap?: boolean
}

export type InlineProps = InlineOwnProps & Omit<React.HTMLAttributes<HTMLElement>, keyof InlineOwnProps>

const Inline = React.forwardRef<HTMLElement, InlineProps>(
  (
    {
      as: Tag = "div",
      className,
      style,
      gap = "md",
      align = "center",
      justify,
      wrap = false,
      ...rest
    },
    ref
  ) => {
    const gapVars = resolveResponsiveSpacing(gap, "inline-gap")

    const Component = Tag as React.ElementType

    return (
      <Component
        ref={ref}
        data-slot="inline"
        data-wrap={wrap ? "true" : undefined}
        className={cn(
          styles.inline,
          wrap && styles.wrap,
          align === "start" && styles.alignStart,
          align === "center" && styles.alignCenter,
          align === "end" && styles.alignEnd,
          align === "stretch" && styles.alignStretch,
          align === "baseline" && styles.alignBaseline,
          justify === "start" && styles.justifyStart,
          justify === "center" && styles.justifyCenter,
          justify === "end" && styles.justifyEnd,
          justify === "between" && styles.justifyBetween,
          justify === "around" && styles.justifyAround,
          justify === "evenly" && styles.justifyEvenly,
          className
        )}
        style={{ ...gapVars, ...style }}
        {...rest}
      />
    )
  }
)
Inline.displayName = "Inline"

export { Inline }
