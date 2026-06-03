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
  /**
   * When true (default), the polyline draws left→right on mount via a
   * `stroke-dashoffset` animation. Set to `false` for a static render
   * identical to the pre-animation baseline.
   */
  animate?: boolean
  /**
   * Duration of the entrance animation in milliseconds. Defaults to 1500.
   * Has no effect when `animate={false}`.
   */
  duration?: number
}

/** Compute the total length of a polyline from its parsed point pairs. */
function polylineLength(pointPairs: [number, number][]): number {
  let total = 0
  for (let i = 1; i < pointPairs.length; i++) {
    const dx = pointPairs[i][0] - pointPairs[i - 1][0]
    const dy = pointPairs[i][1] - pointPairs[i - 1][1]
    total += Math.sqrt(dx * dx + dy * dy)
  }
  return total
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
      animate = true,
      duration = 1500,
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

    const pointPairs: [number, number][] = values.map((v, i) => [
      i * stepX,
      height - ((v - min) / range) * height,
    ])
    const points = pointPairs
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ")

    const isLabeled = typeof ariaLabel === "string" && ariaLabel.length > 0

    // Animation state: track whether the draw has been triggered.
    const [drawn, setDrawn] = React.useState(false)
    const totalLength = React.useMemo(
      () => (animate ? polylineLength(pointPairs) : 0),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [animate, points]
    )

    React.useEffect(() => {
      if (!animate) return
      // Trigger transition on next frame so the browser has painted the initial
      // dashoffset state before we flip to 0.
      const raf = requestAnimationFrame(() => {
        setDrawn(true)
      })
      return () => cancelAnimationFrame(raf)
    }, [animate])

    const polylineProps = animate
      ? {
          className: styles.animatedPolyline,
          style: {
            "--sparkline-animation-duration": `${duration}ms`,
            strokeDasharray: totalLength,
            strokeDashoffset: drawn ? 0 : totalLength,
          } as React.CSSProperties,
        }
      : {}

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
          {...polylineProps}
        />
      </svg>
    )
  }
)
Sparkline.displayName = "Sparkline"

export { Sparkline }
