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
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, size = "default", animate = true, ...props }, ref) => {
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
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = "Progress"

export { Progress }
