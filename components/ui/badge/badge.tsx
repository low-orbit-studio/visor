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
      neutral: styles.variantNeutral,
      "filled-destructive": styles.variantFilledDestructive,
      "filled-success": styles.variantFilledSuccess,
      "filled-warning": styles.variantFilledWarning,
      "filled-info": styles.variantFilledInfo,
      "filled-neutral": styles.variantFilledNeutral,
    },
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    },
    /* `case="sentence"` opts a sm/md badge OUT of the editorial uppercase +
       tracking treatment (lg already opts out via its size class). Omit for the
       default theme-driven casing. */
    case: {
      sentence: styles.caseSentence,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Render the label in uppercase. Also controllable via the
   *  `--badge-text-transform` CSS custom property from a theme. */
  uppercase?: boolean
  /** Render as a circular, fixed-square chip carrying a single centered glyph
   *  (e.g. a filled-success check). Opt-in; default badges are unaffected. */
  iconOnly?: boolean
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { className, variant, size, case: textCase, uppercase, iconOnly, ...props },
    ref
  ) => {
    return (
      <span
        ref={ref}
        data-slot="badge"
        data-variant={variant ?? "default"}
        data-size={size ?? "md"}
        data-icon-only={iconOnly ? "" : undefined}
        className={cn(
          badgeVariants({ variant, size, case: textCase }),
          uppercase && styles.uppercase,
          iconOnly && styles.iconOnly,
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
