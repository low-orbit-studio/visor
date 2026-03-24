"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "../../../lib/utils"
import styles from "./slider.module.css"

export type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, ...props }, ref) => {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(styles.root, className)}
      ref={ref}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={styles.track}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={styles.range}
        />
      </SliderPrimitive.Track>
      {(props.defaultValue ?? props.value ?? [0]).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          data-slot="slider-thumb"
          className={styles.thumb}
          aria-label={props["aria-label"] ?? `Slider thumb ${i + 1}`}
        />
      ))}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = "Slider"

export { Slider }
