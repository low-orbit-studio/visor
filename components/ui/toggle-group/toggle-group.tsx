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

/* ─── Sliding indicator hook ────────────────────────────────────────── */

function useSlidingIndicator(
  rootRef: React.RefObject<HTMLElement | null>,
  variant: string | null | undefined,
) {
  const indicatorRef = React.useRef<HTMLSpanElement>(null)

  const updateIndicator = React.useCallback(() => {
    const root = rootRef.current
    const indicator = indicatorRef.current
    if (!root || !indicator || variant !== "outline") return

    const activeItem = root.querySelector(
      '[data-state="on"]',
    ) as HTMLElement | null

    if (!activeItem) {
      indicator.style.opacity = "0"
      return
    }

    indicator.style.opacity = "1"
    indicator.style.width = `${activeItem.offsetWidth}px`
    indicator.style.height = `${activeItem.offsetHeight}px`
    indicator.style.transform = `translate(${activeItem.offsetLeft}px, ${activeItem.offsetTop}px)`
  }, [rootRef, variant])

  // Update on mount and whenever children change state
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || variant !== "outline") return

    // Initial position
    updateIndicator()

    // Observe data-state changes on children
    const observer = new MutationObserver(updateIndicator)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-state"],
      subtree: true,
    })

    return () => observer.disconnect()
  }, [rootRef, variant, updateIndicator])

  return indicatorRef
}

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
  const internalRef = React.useRef<HTMLDivElement>(null)
  // Sliding indicator only works for single-select toggle groups
  const useIndicator = variant === "outline" && props.type !== "multiple"
  const indicatorRef = useSlidingIndicator(internalRef, useIndicator ? variant : undefined)

  // Merge internal ref with forwarded ref
  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
    },
    [ref],
  )

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      <ToggleGroupPrimitive.Root
        data-slot="toggle-group"
        data-variant={variant ?? "default"}
        data-size={size ?? "md"}
        data-type={props.type ?? "single"}
        className={cn(toggleGroupVariants({ variant, size }), className)}
        ref={mergedRef}
        {...props}
      >
        {useIndicator && (
          <span
            ref={indicatorRef}
            className={styles.indicator}
            aria-hidden="true"
          />
        )}
        {props.children}
      </ToggleGroupPrimitive.Root>
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
