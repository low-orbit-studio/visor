"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import styles from "./chip-group.module.css"

/* ─── Context ────────────────────────────────────────────────────────── */

type ChipGroupContextValue = {
  type: "single" | "multiple"
  value: string[]
  onValueChange: (value: string[]) => void
}

const ChipGroupContext = React.createContext<ChipGroupContextValue | null>(null)

export function useChipGroup() {
  return React.useContext(ChipGroupContext)
}

/* ─── ChipGroup ──────────────────────────────────────────────────────── */

export interface ChipGroupProps {
  /**
   * "single" — acts like a radio group: selecting one deselects the others.
   * "multiple" — acts like a checkbox group: each chip toggles independently.
   */
  type: "single" | "multiple"
  /**
   * Controlled value. For "single", at most one string. For "multiple", any
   * number of strings. Pass an empty array for "no selection".
   */
  value?: string[]
  /**
   * Default value for uncontrolled usage.
   */
  defaultValue?: string[]
  /**
   * Fires with the new value array after any selection change.
   */
  onValueChange?: (value: string[]) => void
  /** Layout direction. Defaults to "horizontal". */
  direction?: "horizontal" | "vertical"
  /** Extra class forwarded to the root element. */
  className?: string
  children: React.ReactNode
  /** Accessible label describing the group's purpose. */
  "aria-label"?: string
  /** Points to a labelling element when aria-label is insufficient. */
  "aria-labelledby"?: string
}

const ChipGroup = React.forwardRef<HTMLDivElement, ChipGroupProps>(
  (
    {
      type,
      value: controlledValue,
      defaultValue,
      onValueChange,
      direction = "horizontal",
      className,
      children,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
    },
    ref,
  ) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = React.useState<string[]>(
      defaultValue ?? [],
    )

    const value = isControlled ? controlledValue : internalValue

    const handleValueChange = React.useCallback(
      (newValue: string[]) => {
        if (!isControlled) {
          setInternalValue(newValue)
        }
        onValueChange?.(newValue)
      },
      [isControlled, onValueChange],
    )

    const contextValue = React.useMemo(
      () => ({ type, value, onValueChange: handleValueChange }),
      [type, value, handleValueChange],
    )

    return (
      <ChipGroupContext.Provider value={contextValue}>
        <div
          ref={ref}
          role="group"
          data-slot="chip-group"
          data-type={type}
          data-direction={direction}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={cn(
            styles.root,
            direction === "vertical" && styles.vertical,
            className,
          )}
        >
          {children}
        </div>
      </ChipGroupContext.Provider>
    )
  },
)
ChipGroup.displayName = "ChipGroup"

/* ─── ChipGroupItem ──────────────────────────────────────────────────── */

export interface ChipGroupItemProps {
  /**
   * The value this item represents. Must be unique within the group.
   */
  value: string
  /** Whether this item is individually disabled. */
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * ChipGroupItem wraps any chip (ChoiceChip or FilterChip) in the group context.
 * It injects `selected`, `onPressed`, and `value` props automatically.
 */
const ChipGroupItem = React.forwardRef<HTMLElement, ChipGroupItemProps>(
  ({ value, disabled, className, children }, ref) => {
    const ctx = React.useContext(ChipGroupContext)
    const isSelected = ctx ? ctx.value.includes(value) : false

    const handlePress = React.useCallback(() => {
      if (!ctx || disabled) return
      if (ctx.type === "single") {
        ctx.onValueChange([value])
      } else {
        const next = ctx.value.includes(value)
          ? ctx.value.filter((v) => v !== value)
          : [...ctx.value, value]
        ctx.onValueChange(next)
      }
    }, [ctx, value, disabled])

    // Clone the child chip injecting the managed props
    const child = React.Children.only(children) as React.ReactElement<
      Record<string, unknown>
    >

    return React.cloneElement(child, {
      ref,
      value,
      selected: isSelected,
      onPressed: handlePress,
      disabled: disabled ?? child.props.disabled,
      className: cn(child.props.className as string | undefined, className),
    })
  },
)
ChipGroupItem.displayName = "ChipGroupItem"

export { ChipGroup, ChipGroupItem }
