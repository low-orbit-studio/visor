import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./stack.module.css"

// ---------------------------------------------------------------------------
// Token vocabularies
// ---------------------------------------------------------------------------

export type StackSpacing =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"

export type ResponsiveProp<T> = T | { base: T; sm?: T; md?: T; lg?: T; xl?: T }

export type StackAlign = "start" | "center" | "end" | "stretch"
export type StackJustify =
  | "start"
  | "center"
  | "end"
  | "between"
  | "around"
  | "evenly"

const SPACING_MAP: Record<StackSpacing, string> = {
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
  value: ResponsiveProp<StackSpacing> | undefined,
  prefix: string
): Record<string, string> {
  if (value === undefined) return {}
  if (typeof value === "object" && value !== null && "base" in value) {
    const v = value as { base: StackSpacing; sm?: StackSpacing; md?: StackSpacing; lg?: StackSpacing; xl?: StackSpacing }
    const out: Record<string, string> = { [`--${prefix}`]: SPACING_MAP[v.base] }
    if (v.sm !== undefined) out[`--${prefix}-sm`] = SPACING_MAP[v.sm]
    if (v.md !== undefined) out[`--${prefix}-md`] = SPACING_MAP[v.md]
    if (v.lg !== undefined) out[`--${prefix}-lg`] = SPACING_MAP[v.lg]
    if (v.xl !== undefined) out[`--${prefix}-xl`] = SPACING_MAP[v.xl]
    return out
  }
  return { [`--${prefix}`]: SPACING_MAP[value as StackSpacing] }
}

// ---------------------------------------------------------------------------
// StackProps
// ---------------------------------------------------------------------------

export interface StackOwnProps {
  /** Render as a different HTML element. Defaults to `<div>`. */
  as?: keyof React.JSX.IntrinsicElements
  /** Space between children. Token-named. Defaults to `"md"`. */
  gap?: ResponsiveProp<StackSpacing>
  /** Cross-axis alignment (horizontal in a column flex). */
  align?: StackAlign
  /** Main-axis alignment (vertical in a column flex). */
  justify?: StackJustify
}

export type StackProps = StackOwnProps & Omit<React.HTMLAttributes<HTMLElement>, keyof StackOwnProps>

const Stack = React.forwardRef<HTMLElement, StackProps>(
  (
    {
      as: Tag = "div",
      className,
      style,
      gap = "md",
      align,
      justify,
      ...rest
    },
    ref
  ) => {
    const gapVars = resolveResponsiveSpacing(gap, "stack-gap")

    const Component = Tag as React.ElementType

    return (
      <Component
        ref={ref}
        data-slot="stack"
        className={cn(
          styles.stack,
          align === "start" && styles.alignStart,
          align === "center" && styles.alignCenter,
          align === "end" && styles.alignEnd,
          align === "stretch" && styles.alignStretch,
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
Stack.displayName = "Stack"

export { Stack }
