import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./button.module.css"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../tooltip/tooltip"

const buttonVariants = cva(styles.base, {
  variants: {
    variant: {
      default: styles.variantDefault,
      secondary: styles.variantSecondary,
      outline: styles.variantOutline,
      ghost: styles.variantGhost,
      destructive: styles.variantDestructive,
    },
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /**
   * When true, the button renders in an inert gated state — visually dimmed,
   * cursor not-allowed, and click handlers suppressed. Uses `aria-disabled`
   * instead of the native `disabled` attribute so the button remains
   * keyboard-focusable (required for the tooltip to be accessible).
   *
   * Note: a `<TooltipProvider>` ancestor is required when `gatedReason` is set.
   */
  gated?: boolean
  /**
   * Explanation surfaced in an anchored tooltip when the button is gated.
   * Only rendered when `gated` is also true.
   * Example: "You can't delete this — you're not an owner"
   */
  gatedReason?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, gated, gatedReason, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (gated) return
        onClick?.(e)
      },
      [gated, onClick]
    )

    const button = (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        aria-disabled={gated ? true : undefined}
        data-gated={gated ? "true" : undefined}
        data-gated-reason={gated && gatedReason ? gatedReason : undefined}
        onClick={handleClick}
        {...props}
      />
    )

    if (gated && gatedReason) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>{gatedReason}</TooltipContent>
        </Tooltip>
      )
    }

    return button
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
