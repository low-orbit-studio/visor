"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./toggle-group.module.css"

/* ─── Context ───────────────────────────────────────────────────────── */

type ToggleGroupContextValue = {
  variant?: "default" | "outline" | "option" | null
  size?: "xs" | "sm" | "md" | "lg" | null
  type?: "single" | "multiple"
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
      option: styles.variantOption,
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
  VariantProps<typeof toggleGroupVariants> & {
    /** Option variant: lay the rows out in two columns instead of one. */
    columns?: 1 | 2
    /** Pressing A, B, C… while focus is in the group picks the item at that position. */
    shortcuts?: boolean
  }

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ className, variant, size, columns, shortcuts, onKeyDown, ...props }, ref) => {
  const contextValue = React.useMemo(
    () => ({ variant, size, type: props.type }),
    [variant, size, props.type]
  )
  const isOption = variant === "option"
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

  // Letter shortcuts: the Nth item answers to the Nth letter, matching its key badge.
  const handleShortcut = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
    const index = /^[a-z]$/i.test(event.key) ? event.key.toLowerCase().charCodeAt(0) - 97 : -1
    const item = internalRef.current?.querySelectorAll<HTMLButtonElement>(
      '[data-slot="toggle-group-item"]',
    )[index]
    if (!item || item.disabled) return
    event.preventDefault()
    item.focus()
    item.click()
  }

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      <ToggleGroupPrimitive.Root
        data-slot="toggle-group"
        data-variant={variant ?? "default"}
        data-size={size ?? "md"}
        data-type={props.type ?? "single"}
        // Radix renders role="group" with radio items for single-select; a radio
        // item needs a radiogroup parent (VI-690). Multi-select stays a group of
        // pressed buttons. Spread after, so a caller's own role still wins.
        {...(props.type === "multiple" ? {} : { role: "radiogroup" })}
        data-columns={isOption && columns === 2 ? "2" : undefined}
        className={cn(toggleGroupVariants({ variant, size: isOption ? null : size }), className)}
        ref={mergedRef}
        onKeyDown={shortcuts ? handleShortcut : onKeyDown}
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
      option: styles.itemVariantOption,
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

/**
 * Wrap bare text in a block label so the stylesheet can trim its line box to the
 * capital-to-baseline band (see `.label`), centring the capitals in the item
 * whatever the font (VI-684). Elements (icons) pass through.
 */
function wrapLabel(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span className={styles.label} data-slot="toggle-group-text">
        {child}
      </span>
    ) : (
      child
    )
  )
}

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(({ className, variant, size, children, ...props }, ref) => {
  const ctx = React.useContext(ToggleGroupContext)
  const resolvedVariant = variant ?? ctx.variant
  const resolvedSize = size ?? ctx.size
  const isOption = resolvedVariant === "option"
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        toggleGroupItemVariants({ variant: resolvedVariant, size: isOption ? null : resolvedSize }),
        className
      )}
      ref={ref}
      {...props}
    >
      {isOption ? (
        <>
          {/* The letter comes from a CSS counter, so it follows the item's position. */}
          <span className={styles.optionKey} data-slot="toggle-group-key" aria-hidden="true" />
          <span className={styles.optionLabel} data-slot="toggle-group-label">
            {children}
          </span>
          {ctx.type === "multiple" && (
            <span className={styles.optionCheck} data-slot="toggle-group-check" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none">
                <path
                  d="M3.5 8.5 6.5 11.5 12.5 4.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
        </>
      ) : (
        wrapLabel(children)
      )}
    </ToggleGroupPrimitive.Item>
  )
})
ToggleGroupItem.displayName = "ToggleGroupItem"

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants, toggleGroupItemVariants }
