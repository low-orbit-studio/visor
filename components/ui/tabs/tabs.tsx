"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./tabs.module.css"

const Tabs = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  React.ComponentProps<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    data-slot="tabs"
    className={cn(styles.root, className)}
    {...props}
  />
))
Tabs.displayName = "Tabs"

const tabsListVariants = cva(styles.list, {
  variants: {
    variant: {
      default: styles.listVariantDefault,
      line: styles.listVariantLine,
      keyed: styles.listVariantKeyed,
    },
    size: {
      default: null,
      compact: styles.listSizeCompact,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

export interface TabsListProps
  extends React.ComponentProps<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "default", size = "default", children, ...props }, ref) => {
  const internalRef = React.useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = React.useState<{
    left: number
    top: number
    width: number
  } | null>(null)
  // Keyed: the first placement jumps; only later moves slide.
  const [placed, setPlaced] = React.useState(false)
  const measured = variant === "line" || variant === "keyed"

  // Merge forwarded ref with internal ref
  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      internalRef.current = node
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref]
  )

  const updateIndicator = React.useCallback(() => {
    if (!measured || !internalRef.current) return
    const activeTab = internalRef.current.querySelector<HTMLElement>(
      '[role="tab"][data-state="active"]'
    )
    if (!activeTab) return
    const next = {
      left: activeTab.offsetLeft,
      top: activeTab.offsetTop,
      width: activeTab.offsetWidth,
    }
    setIndicatorStyle((prev) =>
      prev && prev.left === next.left && prev.top === next.top && prev.width === next.width
        ? prev
        : next
    )
  }, [measured])

  React.useEffect(() => {
    const list = internalRef.current
    if (!measured || !list) return
    updateIndicator()

    // Active tab changes, and tabs added, removed, reordered or relabelled.
    const observer = new MutationObserver(updateIndicator)
    observer.observe(list, {
      attributes: true,
      attributeFilter: ["data-state"],
      childList: true,
      characterData: true,
      subtree: true,
    })

    // The row re-wraps when the list resizes; label widths change on font load.
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateIndicator)
    resizeObserver?.observe(list)
    const fonts = typeof document !== "undefined" ? document.fonts : undefined
    fonts?.ready.then(updateIndicator)
    fonts?.addEventListener?.("loadingdone", updateIndicator)

    window.addEventListener("resize", updateIndicator)
    return () => {
      observer.disconnect()
      resizeObserver?.disconnect()
      fonts?.removeEventListener?.("loadingdone", updateIndicator)
      window.removeEventListener("resize", updateIndicator)
    }
  }, [measured, updateIndicator])

  React.useEffect(() => {
    if (variant !== "keyed" || !indicatorStyle || placed) return
    const frame = requestAnimationFrame(() => setPlaced(true))
    return () => cancelAnimationFrame(frame)
  }, [variant, indicatorStyle, placed])

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

  return (
    <TabsPrimitive.List
      ref={mergedRef}
      data-slot="tabs-list"
      data-variant={variant}
      data-size={variant === "keyed" ? size : undefined}
      className={cn(tabsListVariants({ variant, size }), className)}
      {...props}
    >
      {/* Before the triggers, so they paint over the highlight's fill. */}
      {variant === "keyed" && indicatorStyle && (
        <span
          aria-hidden="true"
          data-slot="tabs-keyed-indicator"
          className={styles.keyedIndicator}
          style={{
            width: indicatorStyle.width,
            transform: `translate(${indicatorStyle.left}px, ${indicatorStyle.top}px)`,
            transition: placed && !reducedMotion ? undefined : "none",
          }}
        />
      )}
      {children}
      {variant === "line" && indicatorStyle && (
        <span
          className={styles.indicator}
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      )}
    </TabsPrimitive.List>
  )
})
TabsList.displayName = "TabsList"

export interface TabsTriggerProps
  extends React.ComponentProps<typeof TabsPrimitive.Trigger> {
  /** Inline count pill rendered after the label. Accepts strings, numbers, or elements. */
  count?: React.ReactNode
  /** Visual tone of the count pill. Defaults to "neutral". Active state re-tones automatically. */
  countTone?: "primary" | "neutral"
}

/**
 * Wrap bare text in a block label so the stylesheet can trim its line box to the
 * capital-to-baseline band (see `.text`), centring the capitals in the trigger
 * whatever the font (VI-684). Elements (icons) pass through.
 */
function wrapLabel(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span className={styles.text} data-slot="tabs-trigger-text">
        {child}
      </span>
    ) : (
      child
    )
  )
}

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, children, count, countTone = "neutral", ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    data-slot="tabs-trigger"
    className={cn(styles.trigger, className)}
    {...props}
  >
    {/* The .label wrapper exists to pair the label with the count pill
        (truncation + flex sizing). Without a count, render children directly
        so the trigger's flex gap applies between consumer-provided icon and
        label elements. */}
    {count != null ? (
      <span className={cn(styles.label, styles.text)} data-slot="tabs-trigger-text">{children}</span>
    ) : (
      wrapLabel(children)
    )}
    {count != null && (
      <span
        className={cn(
          styles.count,
          countTone === "primary" ? styles.countPrimary : styles.countNeutral,
        )}
        data-slot="tabs-trigger-count"
        data-tone={countTone}
        aria-hidden="false"
      >
        {count}
      </span>
    )}
  </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentProps<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    data-slot="tabs-content"
    className={cn(styles.content, className)}
    {...props}
  />
))
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
