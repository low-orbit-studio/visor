"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import { ToggleGroup, ToggleGroupItem } from "../toggle-group/toggle-group"
import type { ToggleGroupProps } from "../toggle-group/toggle-group"
import styles from "./segmented-control.module.css"

/* ─── Types ─────────────────────────────────────────────────────────── */

export interface SegmentedControlOption {
  /** Value reported by `onValueChange` while this segment is on. */
  value: string
  /** Segment label. Bare text is centred optically (docs/label-centering.md). */
  label: React.ReactNode
  /** Optional leading icon. */
  icon?: React.ReactNode
  disabled?: boolean
}

export interface SegmentedControlProps
  extends Omit<
    React.ComponentPropsWithoutRef<"div">,
    "defaultValue" | "onChange" | "dir"
  > {
  options: SegmentedControlOption[]
  /** Controlled value. */
  value?: string
  /** Uncontrolled initial value. Falls back to the first enabled option. */
  defaultValue?: string
  /** Fires with the new value. Never fires with an empty string. */
  onValueChange?: (value: string) => void
  size?: "xs" | "sm" | "md" | "lg"
  /** Equal-width segments spanning the container (the list-filter treatment). */
  fullWidth?: boolean
  disabled?: boolean
  dir?: ToggleGroupProps["dir"]
}

/* ─── Variants ──────────────────────────────────────────────────────── */

const segmentedControlVariants = cva(styles.root, {
  variants: {
    fullWidth: {
      true: styles.fullWidth,
      false: "",
    },
  },
  defaultVariants: {
    fullWidth: false,
  },
})

/* ─── Indicator re-sync ─────────────────────────────────────────────── */

/**
 * ToggleGroup positions its sliding indicator when an item's `data-state`
 * changes, but not when the group is resized (a `fullWidth` control follows
 * its container, and a web font swap changes label widths). Re-setting the
 * active item's own `data-state` queues the mutation record it already
 * listens for, so the indicator re-measures without a fork of ToggleGroup.
 */
function useResyncIndicator(rootRef: React.RefObject<HTMLDivElement | null>) {
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => {
      const active = root.querySelector('[data-state="on"]')
      active?.setAttribute("data-state", "on")
    })
    observer.observe(root)
    return () => observer.disconnect()
  }, [rootRef])
}

/* ─── Label with its width reserved ─────────────────────────────────── */

/**
 * A bare-text label, rendered the way ToggleGroupItem renders one (a
 * `toggle-group-text` block, trimmed to the capital band, see .label) inside a
 * one-cell grid. Two hidden copies of the text share the cell, one at the
 * active weight and one at the inactive weight, so each segment is always as
 * wide as its widest state and selecting a segment moves nothing, even when a
 * theme binds a heavier `active-weight`. The copies are `aria-hidden` and
 * visually hidden: they cost no height and are not read. Elements (icons, rich
 * labels) pass through unchanged.
 */
function renderLabel(label: React.ReactNode): React.ReactNode {
  if (typeof label !== "string" && typeof label !== "number") return label
  return (
    <span className={styles.labelBox}>
      <span className={styles.label} data-slot="toggle-group-text">
        {label}
      </span>
      <span className={cn(styles.reserve, styles.reserveActive)} aria-hidden="true">
        {label}
      </span>
      <span className={cn(styles.reserve, styles.reserveInactive)} aria-hidden="true">
        {label}
      </span>
    </span>
  )
}

/* ─── SegmentedControl ──────────────────────────────────────────────── */

const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  (
    {
      options,
      value: valueProp,
      defaultValue,
      onValueChange,
      size = "md",
      fullWidth = false,
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    const firstEnabled = options.find((o) => !o.disabled)?.value
    const [inner, setInner] = React.useState<string | undefined>(
      defaultValue ?? firstEnabled,
    )
    const controlled = valueProp !== undefined
    const value = controlled ? valueProp : inner

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const mergedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      },
      [ref],
    )
    useResyncIndicator(rootRef)

    // One option is always on. Radix reports "" when the active segment is
    // clicked again; the group is always given a value, so ignoring "" keeps it.
    const handleValueChange = React.useCallback(
      (next: string) => {
        if (!next) return
        if (!controlled) setInner(next)
        onValueChange?.(next)
      },
      [controlled, onValueChange],
    )

    return (
      <ToggleGroup
        {...props}
        ref={mergedRef}
        type="single"
        variant="outline"
        size={size}
        value={value ?? ""}
        onValueChange={handleValueChange}
        disabled={disabled}
        data-slot="segmented-control"
        data-full-width={fullWidth ? "true" : undefined}
        className={cn(segmentedControlVariants({ fullWidth }), className)}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.icon}
            {renderLabel(option.label)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    )
  },
)
SegmentedControl.displayName = "SegmentedControl"

export { SegmentedControl, segmentedControlVariants }
