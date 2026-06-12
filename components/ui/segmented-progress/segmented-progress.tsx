import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./segmented-progress.module.css"

const segmentedProgressVariants = cva(styles.root, {
  variants: {
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
    },
  },
  defaultVariants: {
    size: "sm",
  },
})

export interface SegmentedProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof segmentedProgressVariants> {
  /** Total number of segments. */
  total: number
  /** Count of completed segments (indices 0..value-1 render done). */
  value: number
  /**
   * Optional 0-based index of the in-progress segment.
   * Renders with a primary→muted gradient. Typically equals `value`.
   */
  current?: number
  /** Visual size of each segment. @default "sm" */
  size?: "sm" | "md"
  /** Accessible name for the progress bar. Required. */
  "aria-label": string
}

const SegmentedProgress = React.forwardRef<
  HTMLDivElement,
  SegmentedProgressProps
>(
  (
    {
      className,
      total,
      value,
      current,
      size = "sm",
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const safeTotal = Math.max(total, 1)
    const clampedValue = Math.min(Math.max(value, 0), safeTotal)

    return (
      <div
        ref={ref}
        data-slot="segmented-progress"
        data-size={size}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={clampedValue}
        aria-label={ariaLabel}
        className={cn(segmentedProgressVariants({ size }), className)}
        {...props}
      >
        {Array.from({ length: safeTotal }, (_, i) => {
          const state =
            i < clampedValue
              ? "done"
              : i === current
                ? "current"
                : "pending"
          return (
            <span
              key={i}
              data-slot="segmented-progress-segment"
              data-state={state}
              className={cn(
                styles.segment,
                state === "done" && styles.segmentDone,
                state === "current" && styles.segmentCurrent,
                state === "pending" && styles.segmentPending
              )}
            />
          )
        })}
      </div>
    )
  }
)
SegmentedProgress.displayName = "SegmentedProgress"

export { SegmentedProgress, segmentedProgressVariants }
