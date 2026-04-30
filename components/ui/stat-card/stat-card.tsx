import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./stat-card.module.css"

const statCardVariants = cva(styles.base, {
  variants: {
    variant: {
      default: styles.variantDefault,
      highlight: styles.variantHighlight,
    },
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

export type StatCardDeltaDirection = "up" | "down" | "flat"

export interface StatCardDelta {
  /** Display value, e.g. "+12.4%" or "-$2.1K". */
  value: React.ReactNode
  /** Semantic direction of the change. Drives color and glyph. */
  direction: StatCardDeltaDirection
  /** Optional context label, e.g. "vs last month". Visible and announced. */
  label?: string
}

type StatCardElement = "article" | "section" | "div"

export type StatCardValueAs = "default" | "hero" | "compact"

export interface StatCardProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof statCardVariants> {
  /** Small uppercase label describing the metric, e.g. "Total Revenue". */
  label: React.ReactNode
  /** Prominent metric value, e.g. "$48,120". */
  value: React.ReactNode
  /** Optional change indicator. */
  delta?: StatCardDelta
  /** Optional slot for a sparkline, chart, or icon. */
  trend?: React.ReactNode
  /** Optional sublabel or link rendered beneath the value. */
  footer?: React.ReactNode
  /** Root element tag. Defaults to `article` for landmark semantics. */
  as?: StatCardElement
  /**
   * Typography treatment for the value element.
   * - `"default"` — standard semibold heading-font value (3xl, 1.875rem).
   * - `"hero"` — marquee display-font treatment (display font, 3.5rem, weight 400, letter-spacing 0, line-height 1).
   * - `"compact"` — tighter than default for dense dashboards (2xl, 1.5rem).
   */
  valueAs?: StatCardValueAs
  /** Optional className forwarded to the value element for custom styling. */
  valueClassName?: string
}

const DELTA_GLYPH: Record<StatCardDeltaDirection, string> = {
  up: "\u2191",
  down: "\u2193",
  flat: "\u2192",
}

const DELTA_WORD: Record<StatCardDeltaDirection, string> = {
  up: "up",
  down: "down",
  flat: "flat",
}

const StatCard = React.forwardRef<HTMLElement, StatCardProps>(
  (
    {
      className,
      variant,
      size,
      label,
      value,
      delta,
      trend,
      footer,
      as = "article",
      valueAs,
      valueClassName,
      ...props
    },
    ref
  ) => {
    const Root = as as React.ElementType

    return (
      <Root
        ref={ref}
        data-slot="stat-card"
        data-variant={variant ?? "default"}
        data-size={size ?? "md"}
        className={cn(statCardVariants({ variant, size }), className)}
        {...props}
      >
        <div data-slot="stat-card-header" className={styles.header}>
          <p data-slot="stat-card-label" className={styles.label}>
            {label}
          </p>
          {trend ? (
            <div
              data-slot="stat-card-trend"
              className={styles.trend}
              aria-hidden="true"
            >
              {trend}
            </div>
          ) : null}
        </div>

        <p
          data-slot="stat-card-value"
          data-value-as={
            valueAs === "hero" || valueAs === "compact" ? valueAs : undefined
          }
          className={cn(styles.value, valueClassName)}
        >
          {value}
        </p>

        {delta ? (
          <div
            data-slot="stat-card-delta"
            data-direction={delta.direction}
            className={styles.delta}
          >
            <span className={styles.deltaGlyph} aria-hidden="true">
              {DELTA_GLYPH[delta.direction]}
            </span>
            <span className={styles.deltaValue}>{delta.value}</span>
            {delta.label ? (
              <span className={styles.deltaLabel}>{delta.label}</span>
            ) : null}
            <span className={styles.srOnly}>
              {DELTA_WORD[delta.direction]}
              {delta.label ? ` ${delta.label}` : ""}
            </span>
          </div>
        ) : null}

        {footer ? (
          <div data-slot="stat-card-footer" className={styles.footer}>
            {footer}
          </div>
        ) : null}
      </Root>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard, statCardVariants }
