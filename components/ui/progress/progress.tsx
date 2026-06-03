"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "../../../lib/utils"
import styles from "./progress.module.css"

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Track size. `"thin"` renders a 4px-tall variant for static admin chrome. */
  size?: "default" | "thin"
  /** Whether the indicator transitions on value change. Defaults to `true`. */
  animate?: boolean
  /**
   * Entrance animation duration in ms. Defaults to 1500. Only applies when
   * `animate={true}` and the user has not opted into reduced motion.
   */
  duration?: number
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    { className, value, size = "default", animate = true, duration = 1500, ...props },
    ref
  ) => {
    // The indicator always renders at its real value (`translateX`), so the bar is
    // visible immediately — during SSR and before/without hydration. The entrance
    // sweep is a pure CSS keyframe (`@keyframes progress-fill`) that animates from
    // 0% to the resting value on mount; subsequent value changes are handled by the
    // indicator's `transition`. No JS state, so it is SSR-safe and behaves the same
    // on full reload and client navigation.
    const resolvedValue = value ?? 0
    const indicatorStyle: React.CSSProperties = animate
      ? ({ transform: `translateX(-${100 - resolvedValue}%)`, "--progress-animation-duration": `${duration}ms` } as React.CSSProperties)
      : { transform: `translateX(-${100 - resolvedValue}%)` }

    return (
      <ProgressPrimitive.Root
        ref={ref}
        data-slot="progress"
        data-size={size === "thin" ? "thin" : undefined}
        data-animate={animate === false ? "false" : undefined}
        className={cn(styles.root, className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(styles.indicator, animate && styles.indicatorAnimated)}
          style={indicatorStyle}
        />
      </ProgressPrimitive.Root>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
