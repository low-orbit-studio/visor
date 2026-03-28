"use client"

import * as React from "react"
import { Slider, type SliderProps } from "../slider/slider"
import { cn } from "../../../lib/utils"
import styles from "./slider-control.module.css"

export interface SliderControlProps
  extends Omit<SliderProps, "value" | "onValueChange"> {
  /** Label displayed to the left of the slider */
  label: string
  /** Current value */
  value: number
  /** Called when the value changes */
  onValueChange: (value: number) => void
  /** Formatted display value shown to the right. Defaults to value.toString() */
  displayValue?: string
  /** Additional CSS class for the root element */
  className?: string
}

const SliderControl = React.forwardRef<
  React.ElementRef<typeof Slider>,
  SliderControlProps
>(
  (
    { label, value, onValueChange, displayValue, className, ...sliderProps },
    ref,
  ) => {
    const handleChange = React.useCallback(
      ([v]: number[]) => onValueChange(v),
      [onValueChange],
    )

    return (
      <div
        data-slot="slider-control"
        className={cn(styles.root, className)}
      >
        <span className={styles.label}>{label}</span>
        <Slider
          ref={ref}
          value={[value]}
          onValueChange={handleChange}
          aria-label={sliderProps["aria-label"] ?? label}
          {...sliderProps}
        />
        <span data-slot="slider-control-value" className={styles.value}>
          {displayValue ?? value.toString()}
        </span>
      </div>
    )
  },
)
SliderControl.displayName = "SliderControl"

export { SliderControl }
