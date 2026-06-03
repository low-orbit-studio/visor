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
    // Entrance animation: start at 0, sweep to value on first mount.
    // When animate=false, skip state entirely — render value directly.
    const isFirstRender = React.useRef(true)
    const [displayValue, setDisplayValue] = React.useState(0)

    React.useEffect(() => {
      if (!animate) return

      if (isFirstRender.current) {
        isFirstRender.current = false

        const prefersReduced =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches

        if (prefersReduced) {
          setDisplayValue(value ?? 0)
          return
        }

        // One rAF defers the state update until after the first painted frame,
        // ensuring the browser sees the 0% position before animating to value%.
        const raf = requestAnimationFrame(() => {
          setDisplayValue(value ?? 0)
        })
        return () => cancelAnimationFrame(raf)
      }

      // Subsequent value changes — update immediately (CSS transition handles it)
      setDisplayValue(value ?? 0)
    }, [animate, value])

    const resolvedValue = animate ? displayValue : (value ?? 0)
    const indicatorStyle: React.CSSProperties = {
      transform: `translateX(-${100 - resolvedValue}%)`,
      ...(animate
        ? ({ "--progress-animation-duration": `${duration}ms` } as React.CSSProperties)
        : {}),
    }

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
          className={styles.indicator}
          style={indicatorStyle}
        />
      </ProgressPrimitive.Root>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
