import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { WarningCircle, Warning } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./score-indicator.module.css"

const scoreIndicatorVariants = cva(styles.base, {
  variants: {
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    },
    denominator: {
      none: styles.denominatorNone,
      trailing: styles.denominatorTrailing,
      below: styles.denominatorBelow,
    },
  },
  defaultVariants: {
    size: "md",
    denominator: "trailing",
  },
})

const TONE_CLASS: Record<ResolvedTone, string> = {
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  destructive: styles.toneDestructive,
  info: styles.toneInfo,
  neutral: styles.toneNeutral,
}

export type ScoreIndicatorTone =
  | "auto"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "neutral"

export type ResolvedTone = Exclude<ScoreIndicatorTone, "auto">

export interface ScoreIndicatorProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof scoreIndicatorVariants> {
  /** Current value. */
  value: number
  /** Maximum value the score can reach. @default 100 */
  max?: number
  /** Visual size. @default "md" */
  size?: "sm" | "md" | "lg"
  /** Color treatment. @default "auto" — derives from value/max ratio */
  tone?: ScoreIndicatorTone
  /** Optional label for accessibility. Defaults to "{value} out of {max}". */
  ariaLabel?: string
  /** Where to show the denominator. @default "trailing" */
  denominator?: "none" | "trailing" | "below"
  /** Custom format for the displayed value. Defaults to rounded integer. */
  format?: (value: number, max: number) => string
}

const SIZE_RING_PX: Record<NonNullable<ScoreIndicatorProps["size"]>, number> = {
  sm: 24,
  md: 36,
  lg: 56,
}

const SIZE_STROKE_PX: Record<NonNullable<ScoreIndicatorProps["size"]>, number> = {
  sm: 2.5,
  md: 3.5,
  lg: 5,
}

const defaultFormat = (value: number, _max: number): string =>
  String(Math.round(value))

export function deriveAutoTone(ratio: number): ResolvedTone {
  if (ratio >= 0.85) return "success"
  if (ratio >= 0.6) return "info"
  if (ratio >= 0.4) return "warning"
  return "destructive"
}

const ScoreIndicator = React.forwardRef<HTMLSpanElement, ScoreIndicatorProps>(
  (
    {
      className,
      value,
      max = 100,
      size = "md",
      tone = "auto",
      ariaLabel,
      denominator = "trailing",
      format,
      ...props
    },
    ref
  ) => {
    const safeMax = max > 0 ? max : 100
    const clamped = Math.min(Math.max(value, 0), safeMax)
    const ratio = clamped / safeMax
    const resolvedTone: ResolvedTone =
      tone === "auto" ? deriveAutoTone(ratio) : tone

    const ringPx = SIZE_RING_PX[size]
    const strokePx = SIZE_STROKE_PX[size]
    const viewBox = 100
    const center = viewBox / 2
    const radius = center - (strokePx / 2) * (viewBox / ringPx)
    const circumference = 2 * Math.PI * radius
    const dashOffset = circumference * (1 - ratio)

    const formatted = (format ?? defaultFormat)(value, safeMax)
    const denominatorText = `/ ${defaultFormat(safeMax, safeMax)}`
    const computedAriaLabel = ariaLabel ?? `${value} out of ${safeMax}`

    return (
      <span
        ref={ref}
        data-slot="score-indicator"
        data-size={size}
        data-tone={resolvedTone}
        data-denominator={denominator}
        className={cn(
          scoreIndicatorVariants({ size, denominator }),
          TONE_CLASS[resolvedTone],
          className
        )}
        {...props}
      >
        <span
          data-slot="score-indicator-ring"
          role="img"
          aria-label={computedAriaLabel}
          className={styles.ring}
          style={{ width: ringPx, height: ringPx }}
        >
          <svg
            className={styles.svg}
            viewBox={`0 0 ${viewBox} ${viewBox}`}
            aria-hidden="true"
            focusable="false"
          >
            <circle
              className={styles.track}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokePx * (viewBox / ringPx)}
            />
            <circle
              className={styles.indicator}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokePx * (viewBox / ringPx)}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          </svg>
          <span data-slot="score-indicator-value" className={styles.value}>
            {formatted}
          </span>
          {resolvedTone === "destructive" || resolvedTone === "warning" ? (
            <span
              data-slot="score-indicator-icon"
              className={styles.iconOverlay}
              aria-hidden="true"
            >
              {resolvedTone === "destructive" ? (
                <WarningCircle weight="fill" />
              ) : (
                <Warning weight="fill" />
              )}
            </span>
          ) : null}
        </span>
        {denominator !== "none" ? (
          <span
            data-slot="score-indicator-denominator"
            className={styles.denominator}
            aria-hidden="true"
          >
            {denominatorText}
          </span>
        ) : null}
      </span>
    )
  }
)
ScoreIndicator.displayName = "ScoreIndicator"

export { ScoreIndicator, scoreIndicatorVariants }
