import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./fieldset.module.css"

export type FieldsetProps = React.FieldsetHTMLAttributes<HTMLFieldSetElement>

const Fieldset = React.forwardRef<HTMLFieldSetElement, FieldsetProps>(
  ({ className, ...props }, ref) => {
    return (
      <fieldset
        data-slot="fieldset"
        className={cn(styles.fieldset, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Fieldset.displayName = "Fieldset"

export type FieldsetLegendProps = React.HTMLAttributes<HTMLLegendElement>

const FieldsetLegend = React.forwardRef<HTMLLegendElement, FieldsetLegendProps>(
  ({ className, ...props }, ref) => {
    return (
      <legend
        data-slot="fieldset-legend"
        className={cn(styles.legend, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
FieldsetLegend.displayName = "FieldsetLegend"

export { Fieldset, FieldsetLegend }
