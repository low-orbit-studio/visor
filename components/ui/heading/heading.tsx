import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./heading.module.css"

const headingVariants = cva(styles.base, {
  variants: {
    size: {
      xs: styles.sizeXs,
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
      xl: styles.sizeXl,
      "2xl": styles.size2xl,
    },
    weight: {
      normal: styles.weightNormal,
      medium: styles.weightMedium,
      semibold: styles.weightSemibold,
      bold: styles.weightBold,
    },
  },
  defaultVariants: {
    weight: "semibold",
  },
})

const levelSizeMap: Record<number, "xs" | "sm" | "md" | "lg" | "xl" | "2xl"> = {
  1: "2xl",
  2: "xl",
  3: "lg",
  4: "md",
  5: "sm",
  6: "xs",
}

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = 2, size, weight, ...props }, ref) => {
    const Tag = `h${level}` as const
    const resolvedSize = size ?? levelSizeMap[level]

    return (
      <Tag
        ref={ref}
        data-slot="heading"
        data-level={level}
        className={cn(headingVariants({ size: resolvedSize, weight }), className)}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

export { Heading, headingVariants }
