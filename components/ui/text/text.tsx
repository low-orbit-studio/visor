import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./text.module.css"

const textVariants = cva(styles.base, {
  variants: {
    size: {
      xs: styles.sizeXs,
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
      xl: styles.sizeXl,
    },
    weight: {
      normal: styles.weightNormal,
      medium: styles.weightMedium,
      semibold: styles.weightSemibold,
      bold: styles.weightBold,
    },
    color: {
      primary: styles.colorPrimary,
      secondary: styles.colorSecondary,
      tertiary: styles.colorTertiary,
      inherit: styles.colorInherit,
    },
    leading: {
      tight: styles.leadingTight,
      snug: styles.leadingSnug,
      normal: styles.leadingNormal,
      relaxed: styles.leadingRelaxed,
      loose: styles.leadingLoose,
    },
  },
  defaultVariants: {
    size: "md",
    weight: "normal",
    color: "primary",
    leading: "normal",
  },
})

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div" | "label"
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, as: Tag = "p", size, weight, color, leading, ...props }, ref) => {
    return (
      <Tag
        ref={ref as React.Ref<never>}
        data-slot="text"
        className={cn(textVariants({ size, weight, color, leading }), className)}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

export { Text, textVariants }
