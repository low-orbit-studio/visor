import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr"
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

export type SegmentedProgressStepState = "done" | "current" | "pending" | "failed"

export interface SegmentedProgressStep {
  /** The words under the step's segment. */
  label: React.ReactNode
  /**
   * The step's state. When omitted it follows `value` and `current`, as an
   * unlabelled bar does.
   */
  state?: SegmentedProgressStepState
}

interface SegmentedProgressBaseProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "aria-label">,
    VariantProps<typeof segmentedProgressVariants> {
  /**
   * Optional 0-based index of the in-progress segment.
   * Renders with a primary→muted gradient. Typically equals `value`.
   */
  current?: number
  /** Visual size of each segment. @default "sm" */
  size?: "sm" | "md"
}

export interface SegmentedProgressCountProps extends SegmentedProgressBaseProps {
  steps?: undefined
  summary?: undefined
  /** Total number of segments. */
  total: number
  /** Count of completed segments (indices 0..value-1 render done). */
  value: number
  /** Accessible name for the progress bar. Required. */
  "aria-label": string
}

export interface SegmentedProgressStepsProps extends SegmentedProgressBaseProps {
  /**
   * One entry per step: a segment with its label under it. The bar is then
   * hidden from assistive tech and `summary` is what a screen reader hears.
   */
  steps: SegmentedProgressStep[]
  /**
   * The visually hidden line read in place of the bar. Defaults to
   * "Step 2 of 3: Bank Details", naming the failed, current or next step.
   */
  summary?: React.ReactNode
  /** Ignored with `steps`: the step count is `steps.length`. */
  total?: number
  /** Count of steps that default to done when a step sets no `state`. */
  value?: number
  /** Not used with `steps`: `summary` carries the words. */
  "aria-label"?: undefined
}

export type SegmentedProgressProps = SegmentedProgressCountProps | SegmentedProgressStepsProps

function stateAt(i: number, value: number, current?: number): SegmentedProgressStepState {
  return i < value ? "done" : i === current ? "current" : "pending"
}

const STATE_CLASS: Record<SegmentedProgressStepState, string> = {
  done: styles.segmentDone,
  current: styles.segmentCurrent,
  pending: styles.segmentPending,
  failed: styles.segmentFailed,
}

function defaultSummary(steps: SegmentedProgressStep[], states: SegmentedProgressStepState[]): React.ReactNode {
  const n = steps.length
  const at = [states.indexOf("failed"), states.indexOf("current"), states.indexOf("pending")].find((i) => i >= 0)
  if (at === undefined) return `All ${n} steps done`
  return (
    <>
      {`Step ${at + 1} of ${n}${states[at] === "failed" ? " failed" : ""}: `}
      {steps[at].label}
    </>
  )
}

const SegmentedProgress = React.forwardRef<HTMLDivElement, SegmentedProgressProps>(
  (
    {
      className,
      total,
      value,
      current,
      size = "sm",
      steps,
      summary,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    if (steps) {
      const states = steps.map((s, i) => s.state ?? stateAt(i, value ?? 0, current))
      return (
        <div
          ref={ref}
          data-slot="segmented-progress"
          data-size={size}
          data-labelled=""
          className={cn(segmentedProgressVariants({ size }), styles.labelled, className)}
          {...props}
        >
          <span data-slot="segmented-progress-summary" className={styles.summary}>
            {summary ?? defaultSummary(steps, states)}
          </span>
          {steps.map((step, i) => {
            const state = states[i]
            const Icon = state === "done" ? CheckCircle : state === "failed" ? WarningCircle : null
            return (
              <div
                key={i}
                data-slot="segmented-progress-step"
                data-state={state}
                aria-hidden="true"
                className={styles.step}
                style={{ "--segmented-progress-index": i } as React.CSSProperties}
              >
                <span
                  data-slot="segmented-progress-segment"
                  data-state={state}
                  className={cn(styles.segment, STATE_CLASS[state], styles.fill)}
                />
                <span data-slot="segmented-progress-label" className={styles.label}>
                  {Icon && <Icon className={styles.labelIcon} />}
                  <span className={styles.labelText}>{step.label}</span>
                </span>
              </div>
            )
          })}
        </div>
      )
    }

    const safeTotal = Math.max(total ?? 1, 1)
    const clampedValue = Math.min(Math.max(value ?? 0, 0), safeTotal)

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
          const state = stateAt(i, clampedValue, current)
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
