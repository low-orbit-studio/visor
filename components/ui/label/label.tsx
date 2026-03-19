import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "../../../lib/utils"
import styles from "./label.module.css"

export type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, ...props }, ref) => {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(styles.base, className)}
      ref={ref}
      {...props}
    />
  )
})
Label.displayName = "Label"

export { Label }
