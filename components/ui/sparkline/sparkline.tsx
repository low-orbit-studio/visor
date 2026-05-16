import * as React from "react"
import styles from "./sparkline.module.css"

export interface SparklineProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, "viewBox" | "values"> {
  /** Numeric series — minimum 2 values required to render. */
  values: number[]
  /** SVG width in px. Defaults to 96. */
  width?: number
  /** SVG height in px. Defaults to 22. */
  height?: number
  /** Stroke color — accepts CSS var, hex, hsl. Defaults to `var(--accent-primary)`. */
  color?: string
  /** Stroke width in px. Defaults to 1.5. */
  strokeWidth?: number
  /**
   * When true, the rendered `<svg>` omits its `width` attribute so it fills its
   * container (the `viewBox` preserves the aspect ratio). A CSS class forces
   * `width: 100%; height: auto; display: block;`. Defaults to `false`.
   */
  fluid?: boolean
  /** When supplied, the sparkline becomes a labeled image instead of decorative. */
  "aria-label"?: string
}

const Sparkline = React.forwardRef<SVGSVGElement, SparklineProps>(
  (
    {
      values,
      width = 96,
      height = 22,
      color = "var(--accent-primary)",
      strokeWidth = 1.5,
      fluid = false,
      className,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    if (!values || values.length < 2) return null

    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const stepX = width / (values.length - 1)
    const points = values
      .map((v, i) => {
        const x = i * stepX
        const y = height - ((v - min) / range) * height
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(" ")

    const isLabeled = typeof ariaLabel === "string" && ariaLabel.length > 0

    return (
      <svg
        ref={ref}
        data-slot="sparkline"
        className={[styles.svg, fluid && styles.svgFluid, className]
          .filter(Boolean)
          .join(" ")}
        {...(fluid ? {} : { width })}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        {...(isLabeled
          ? { "aria-label": ariaLabel }
          : { "aria-hidden": true })}
        {...props}
      >
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    )
  }
)
Sparkline.displayName = "Sparkline"

export { Sparkline }
