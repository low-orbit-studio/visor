import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./container.module.css"

// ---------------------------------------------------------------------------
// Token vocabularies
// ---------------------------------------------------------------------------

export type ContainerSpacing =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "full"

const SPACING_MAP: Record<ContainerSpacing, string> = {
  none: "0",
  xs: "var(--spacing-1, 0.25rem)",
  sm: "var(--spacing-2, 0.5rem)",
  md: "var(--spacing-4, 1rem)",
  lg: "var(--spacing-6, 1.5rem)",
  xl: "var(--spacing-8, 2rem)",
  "2xl": "var(--spacing-12, 3rem)",
  "3xl": "var(--spacing-16, 4rem)",
}

// ---------------------------------------------------------------------------
// ContainerProps
// ---------------------------------------------------------------------------

export interface ContainerOwnProps {
  /** Render as a different HTML element. Defaults to `<div>`. */
  as?: keyof React.JSX.IntrinsicElements
  /** Max-width preset. Defaults to `"lg"` (1024px). */
  size?: ContainerSize
  /**
   * Horizontal padding inside the container. Token-named.
   * Defaults to `"md"` (1rem).
   */
  padding?: ContainerSpacing
}

export type ContainerProps = ContainerOwnProps &
  Omit<React.HTMLAttributes<HTMLElement>, keyof ContainerOwnProps>

const Container = React.forwardRef<HTMLElement, ContainerProps>(
  (
    {
      as: Tag = "div",
      className,
      style,
      size = "lg",
      padding = "md",
      ...rest
    },
    ref
  ) => {
    const paddingVar = {
      "--container-padding": SPACING_MAP[padding],
    } as React.CSSProperties

    const Component = Tag as React.ElementType

    return (
      <Component
        ref={ref}
        data-slot="container"
        data-size={size}
        className={cn(
          styles.container,
          size === "sm" && styles.sizeSm,
          size === "md" && styles.sizeMd,
          size === "lg" && styles.sizeLg,
          size === "xl" && styles.sizeXl,
          size === "full" && styles.sizeFull,
          className
        )}
        style={{ ...paddingVar, ...style }}
        {...rest}
      />
    )
  }
)
Container.displayName = "Container"

export { Container }
