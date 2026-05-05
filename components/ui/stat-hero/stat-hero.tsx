import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./stat-hero.module.css"

export type StatHeroDeltaDirection = "up" | "down" | "flat"

export interface StatHeroDelta {
  /** Display value, e.g. "+12.4%" or "-$2.1K". */
  value: React.ReactNode
  /** Semantic direction of the change. Drives color and glyph. */
  direction: StatHeroDeltaDirection
}

export interface StatHeroProps extends React.HTMLAttributes<HTMLElement> {
  /** Small uppercase label describing the metric, e.g. "Monthly Recurring Revenue". */
  label: React.ReactNode
  /** Hero-scale metric value, e.g. "$1,240,000". */
  value: React.ReactNode
  /** Optional change indicator shown below the value. */
  delta?: StatHeroDelta
  /** Array of numeric data points driving the animated trendline (min 2). */
  values: number[]
  /** Optional caption rendered beneath the delta row. */
  caption?: React.ReactNode
}

const DELTA_GLYPH: Record<StatHeroDeltaDirection, string> = {
  up: "↑",
  down: "↓",
  flat: "→",
}

const DELTA_WORD: Record<StatHeroDeltaDirection, string> = {
  up: "up",
  down: "down",
  flat: "flat",
}

/**
 * Compute normalized SVG polyline points from a number array.
 * Returns null if values.length < 2.
 */
function computePoints(
  values: number[],
  width: number,
  height: number
): string | null {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = width / (values.length - 1)
  return values
    .map((v, i) => {
      const x = i * stepX
      // Pad 4px top and bottom so the stroke doesn't clip at the SVG edge
      const y = 4 + ((max - v) / range) * (height - 8)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
}

const StatHero = React.forwardRef<HTMLElement, StatHeroProps>(
  (
    {
      className,
      label,
      value,
      delta,
      values,
      caption,
      ...props
    },
    ref
  ) => {
    const SVG_WIDTH = 600
    const SVG_HEIGHT = 120
    const points = computePoints(values, SVG_WIDTH, SVG_HEIGHT)

    return (
      <article
        ref={ref}
        data-slot="stat-hero"
        className={cn(styles.base, className)}
        {...props}
      >
        {/* Left column: label, value, delta, caption */}
        <div data-slot="stat-hero-body" className={styles.body}>
          <p data-slot="stat-hero-label" className={styles.label}>
            {label}
          </p>

          <p data-slot="stat-hero-value" className={styles.value}>
            {value}
          </p>

          {delta ? (
            <div
              data-slot="stat-hero-delta"
              data-direction={delta.direction}
              className={styles.delta}
            >
              <span className={styles.deltaGlyph} aria-hidden="true">
                {DELTA_GLYPH[delta.direction]}
              </span>
              <span className={styles.deltaValue}>{delta.value}</span>
              <span className={styles.srOnly}>
                {DELTA_WORD[delta.direction]}
              </span>
            </div>
          ) : null}

          {caption ? (
            <p data-slot="stat-hero-caption" className={styles.caption}>
              {caption}
            </p>
          ) : null}
        </div>

        {/* Right column: animated trendline SVG */}
        <div
          data-slot="stat-hero-chart"
          className={styles.chart}
          aria-hidden="true"
        >
          {points ? (
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              preserveAspectRatio="none"
              className={styles.svg}
            >
              <polyline
                className={styles.trendline}
                points={points}
                fill="none"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          ) : null}
        </div>
      </article>
    )
  }
)
StatHero.displayName = "StatHero"

export { StatHero }
