"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { CheckIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./popover.module.css"

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}
Popover.displayName = "Popover"

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}
PopoverTrigger.displayName = "PopoverTrigger"

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}
PopoverAnchor.displayName = "PopoverAnchor"

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentProps<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(styles.content, className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = "PopoverContent"

function PopoverFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="popover-footer" className={cn(styles.footer, className)} {...props} />
}
PopoverFooter.displayName = "PopoverFooter"

// ─── SelectionList Context ───────────────────────────────────────────────────

interface SelectionListContextValue {
  mode: "checkbox" | "radio"
  itemRefs: React.MutableRefObject<(HTMLDivElement | null)[]>
  registerItem: (index: number, el: HTMLDivElement | null) => void
  focusedIndex: number
  setFocusedIndex: (index: number) => void
  itemCount: React.MutableRefObject<number>
}

const SelectionListContext = React.createContext<SelectionListContextValue | null>(null)

function useSelectionList() {
  const ctx = React.useContext(SelectionListContext)
  if (!ctx) throw new Error("PopoverSelectionItem must be used inside PopoverSelectionList")
  return ctx
}

// ─── PopoverSelectionLabel ───────────────────────────────────────────────────

export interface PopoverSelectionLabelProps extends React.ComponentProps<"div"> {}

function PopoverSelectionLabel({ className, ...props }: PopoverSelectionLabelProps) {
  return (
    <div
      data-slot="popover-selection-label"
      className={cn(styles.selectionLabel, className)}
      {...props}
    />
  )
}
PopoverSelectionLabel.displayName = "PopoverSelectionLabel"

// ─── PopoverSelectionList ────────────────────────────────────────────────────

export interface PopoverSelectionListProps extends React.ComponentProps<"div"> {
  mode?: "checkbox" | "radio"
  "aria-label"?: string
}

function PopoverSelectionList({
  mode = "checkbox",
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: PopoverSelectionListProps) {
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const itemCount = React.useRef(0)
  const [focusedIndex, setFocusedIndex] = React.useState(0)
  // Mirror focusedIndex in a ref so keyDown handler always reads the latest value
  const focusedIndexRef = React.useRef(0)

  const setFocusedIndexBoth = React.useCallback((index: number) => {
    focusedIndexRef.current = index
    setFocusedIndex(index)
  }, [])

  const registerItem = React.useCallback((index: number, el: HTMLDivElement | null) => {
    itemRefs.current[index] = el
  }, [])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const total = itemCount.current
      if (total === 0) return

      const enabledIndices = itemRefs.current
        .slice(0, total)
        .map((el, i) => (el && el.getAttribute("aria-disabled") !== "true" ? i : -1))
        .filter((i) => i !== -1)

      // Use ref for synchronous latest value
      const currentFocused = focusedIndexRef.current
      const currentEnabledPos = enabledIndices.indexOf(currentFocused)

      let nextIndex: number | null = null

      if (e.key === "ArrowDown") {
        e.preventDefault()
        const next = enabledIndices[(currentEnabledPos + 1) % enabledIndices.length]
        nextIndex = next ?? enabledIndices[0]
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        const prev =
          enabledIndices[(currentEnabledPos - 1 + enabledIndices.length) % enabledIndices.length]
        nextIndex = prev ?? enabledIndices[enabledIndices.length - 1]
      } else if (e.key === "Home") {
        e.preventDefault()
        nextIndex = enabledIndices[0]
      } else if (e.key === "End") {
        e.preventDefault()
        nextIndex = enabledIndices[enabledIndices.length - 1]
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        const el = itemRefs.current[currentFocused]
        if (el && el.getAttribute("aria-disabled") !== "true") {
          el.click()
        }
      }

      if (nextIndex !== null) {
        setFocusedIndexBoth(nextIndex)
        itemRefs.current[nextIndex]?.focus()
      }
    },
    [setFocusedIndexBoth]
  )

  const ctxValue = React.useMemo(
    () => ({ mode, itemRefs, registerItem, focusedIndex, setFocusedIndex: setFocusedIndexBoth, itemCount }),
    [mode, registerItem, focusedIndex, setFocusedIndexBoth]
  )

  return (
    <SelectionListContext.Provider value={ctxValue}>
      <div
        data-slot="popover-selection-list"
        role="listbox"
        aria-label={ariaLabel}
        aria-multiselectable={mode === "checkbox" ? true : undefined}
        className={cn(styles.selectionList, className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    </SelectionListContext.Provider>
  )
}
PopoverSelectionList.displayName = "PopoverSelectionList"

// ─── PopoverSelectionItem ────────────────────────────────────────────────────

export interface PopoverSelectionItemProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  selected?: boolean
  onSelect?: (next: boolean) => void
  disabled?: boolean
  count?: number | string
  leadingIcon?: React.ReactNode
}

const PopoverSelectionItem = React.forwardRef<HTMLDivElement, PopoverSelectionItemProps>(
  (
    { selected = false, onSelect, disabled = false, count, leadingIcon, className, children, ...props },
    forwardedRef
  ) => {
    const { mode, registerItem, setFocusedIndex, itemCount, focusedIndex } = useSelectionList()

    // Assign a stable index per item via a ref
    const indexRef = React.useRef<number>(-1)
    const localRef = React.useRef<HTMLDivElement | null>(null)

    // Combine forwarded ref + local ref
    const ref = React.useCallback(
      (el: HTMLDivElement | null) => {
        localRef.current = el
        if (typeof forwardedRef === "function") forwardedRef(el)
        else if (forwardedRef) forwardedRef.current = el
      },
      [forwardedRef]
    )

    // Register on mount — assign next available index
    React.useLayoutEffect(() => {
      const index = itemCount.current++
      indexRef.current = index
      registerItem(index, localRef.current)
      return () => {
        registerItem(index, null)
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Keep registration in sync when el changes
    React.useLayoutEffect(() => {
      if (indexRef.current >= 0) {
        registerItem(indexRef.current, localRef.current)
      }
    })

    const isTabStop = !disabled && indexRef.current === focusedIndex

    function handleClick() {
      if (disabled) return
      setFocusedIndex(indexRef.current)
      onSelect?.(!selected)
    }

    function handleFocus() {
      if (!disabled) setFocusedIndex(indexRef.current)
    }

    return (
      <div
        ref={ref}
        data-slot="popover-selection-item"
        role="option"
        aria-selected={selected}
        aria-disabled={disabled || undefined}
        tabIndex={isTabStop ? 0 : -1}
        className={cn(
          styles.selectionItem,
          selected && styles.selectionItemSelected,
          disabled && styles.selectionItemDisabled,
          className
        )}
        onClick={handleClick}
        onFocus={handleFocus}
        {...props}
      >
        {leadingIcon && (
          <span className={styles.selectionItemLeadingIcon} aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <span
          className={cn(
            styles.selectionIndicator,
            mode === "radio" ? styles.selectionIndicatorRadio : styles.selectionIndicatorCheckbox,
            selected && styles.selectionIndicatorSelected
          )}
          aria-hidden="true"
        >
          {mode === "checkbox" && selected && <CheckIcon weight="bold" />}
          {mode === "radio" && selected && <span className={styles.selectionRadioDot} />}
        </span>
        <span className={styles.selectionItemLabel}>{children}</span>
        {count !== undefined && (
          <span className={styles.selectionCount} aria-hidden="true">
            {count}
          </span>
        )}
      </div>
    )
  }
)
PopoverSelectionItem.displayName = "PopoverSelectionItem"

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverFooter,
  PopoverSelectionList,
  PopoverSelectionItem,
  PopoverSelectionLabel,
}
