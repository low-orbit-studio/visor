import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./badge.module.css"

const badgeVariants = cva(styles.base, {
  variants: {
    variant: {
      default: styles.variantDefault,
      secondary: styles.variantSecondary,
      outline: styles.variantOutline,
      destructive: styles.variantDestructive,
      success: styles.variantSuccess,
      warning: styles.variantWarning,
      info: styles.variantInfo,
      "filled-destructive": styles.variantFilledDestructive,
      "filled-success": styles.variantFilledSuccess,
      "filled-warning": styles.variantFilledWarning,
      "filled-info": styles.variantFilledInfo,
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-slot="badge"
        data-variant={variant ?? "default"}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
