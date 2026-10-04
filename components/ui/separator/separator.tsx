"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cn } from "../../../lib/utils"
import styles from "./separator.module.css"

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  /**
   * Text drawn centred on a horizontal rule, with the rule on both sides. A
   * labelled separator is never decorative, so the word is exposed. Ignored on
   * a vertical separator.
   */
  label?: React.ReactNode
}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(
  (
    {
      className,
      orientation = "horizontal",
      decorative = true,
      label,
      ...props
    },
    ref
  ) => {
    const labelId = React.useId()
    const hasLabel =
      orientation === "horizontal" &&
      label !== undefined &&
      label !== null &&
      label !== false &&
      label !== ""

    if (hasLabel) {
      return (
        <SeparatorPrimitive.Root
          ref={ref}
          data-slot="separator"
          data-labelled=""
          decorative={false}
          orientation={orientation}
          aria-labelledby={labelId}
          className={cn(styles.separator, styles.labelled, className)}
          {...props}
        >
          <span className={styles.rule} aria-hidden="true" />
          <span id={labelId} className={styles.label}>
            {label}
          </span>
          <span className={styles.rule} aria-hidden="true" />
        </SeparatorPrimitive.Root>
      )
    }

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        data-slot="separator"
        decorative={decorative}
        orientation={orientation}
        className={cn(
          styles.separator,
          orientation === "horizontal"
            ? styles.horizontal
            : styles.vertical,
          className
        )}
        {...props}
      />
    )
  }
)
Separator.displayName = "Separator"

export { Separator }
