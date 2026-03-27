"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./toggle-group.module.css"

/* ─── Context ───────────────────────────────────────────────────────── */

type ToggleGroupContextValue = {
  variant?: "default" | "outline" | null
  size?: "xs" | "sm" | "md" | "lg" | null
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({})

/* ─── ToggleGroup ───────────────────────────────────────────────────── */

const toggleGroupVariants = cva(styles.root, {
  variants: {
    variant: {
      default: styles.variantDefault,
      outline: styles.variantOutline,
    },
    size: {
      xs: styles.sizeXs,
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

export type ToggleGroupProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Root
> &
  VariantProps<typeof toggleGroupVariants>

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ className, variant, size, ...props }, ref) => {
  const contextValue = React.useMemo(
    () => ({ variant, size }),
    [variant, size]
  )
  return (
    <ToggleGroupContext.Provider value={contextValue}>
      <ToggleGroupPrimitive.Root
        data-slot="toggle-group"
        data-variant={variant ?? "default"}
        data-size={size ?? "md"}
        className={cn(toggleGroupVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    </ToggleGroupContext.Provider>
  )
})
ToggleGroup.displayName = "ToggleGroup"

/* ─── ToggleGroupItem ───────────────────────────────────────────────── */

const toggleGroupItemVariants = cva(styles.item, {
  variants: {
    variant: {
      default: styles.itemVariantDefault,
      outline: styles.itemVariantOutline,
    },
    size: {
      xs: styles.itemSizeXs,
      sm: styles.itemSizeSm,
      md: styles.itemSizeMd,
      lg: styles.itemSizeLg,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

export interface ToggleGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>,
    VariantProps<typeof toggleGroupItemVariants> {}

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(({ className, variant, size, ...props }, ref) => {
  const ctx = React.useContext(ToggleGroupContext)
  const resolvedVariant = variant ?? ctx.variant
  const resolvedSize = size ?? ctx.size
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(toggleGroupItemVariants({ variant: resolvedVariant, size: resolvedSize }), className)}
      ref={ref}
      {...props}
    />
  )
})
ToggleGroupItem.displayName = "ToggleGroupItem"

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants, toggleGroupItemVariants }
