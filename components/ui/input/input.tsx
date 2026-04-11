import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./input.module.css"

const inputVariants = cva(styles.base, {
  variants: {
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /**
   * Optional leading icon rendered inside the field (e.g. a Phosphor icon).
   * The input picks up extra left padding so its text clears the icon. The
   * icon itself is `aria-hidden` — the field still needs its own label.
   */
  leadingIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, leadingIcon, ...props }, ref) => {
    const input = (
      <input
        type={type}
        data-slot="input"
        className={cn(
          inputVariants({ size }),
          leadingIcon && styles.hasLeadingIcon,
          className
        )}
        ref={ref}
        {...props}
      />
    )

    if (!leadingIcon) return input

    return (
      <span className={styles.leadingIconWrapper} data-slot="input-wrapper">
        <span className={styles.leadingIcon} aria-hidden="true">
          {leadingIcon}
        </span>
        {input}
      </span>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
