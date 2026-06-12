import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./spinner.module.css"

const spinnerVariants = cva(styles.root, {
  variants: {
    size: {
      xs: styles.sizeXs,
      sm: styles.sizeSm,
      md: styles.sizeMd,
    },
    tone: {
      default: styles.toneDefault,
      primary: styles.tonePrimary,
    },
  },
  defaultVariants: {
    size: "md",
    tone: "default",
  },
})

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof spinnerVariants> {
  /** Visual size of the spinner ring. @default "md" */
  size?: "xs" | "sm" | "md"
  /** Color tone for the leading edge. @default "default" */
  tone?: "default" | "primary"
  /** Accessible label. When provided, renders role="status" with visually-hidden text. When omitted, aria-hidden="true". */
  label?: string
}

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size = "md", tone = "default", label, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-slot="spinner"
        data-size={size}
        data-tone={tone}
        className={cn(spinnerVariants({ size, tone }), className)}
        {...(label
          ? { role: "status", "aria-label": label }
          : { "aria-hidden": "true" })}
        {...props}
      >
        {label ? (
          <span className={styles.srOnly}>{label}</span>
        ) : null}
      </span>
    )
  }
)
Spinner.displayName = "Spinner"

export { Spinner, spinnerVariants }
