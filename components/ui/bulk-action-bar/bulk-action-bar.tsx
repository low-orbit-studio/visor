"use client"

import * as React from "react"
import { X } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import { Button } from "../button/button"
import styles from "./bulk-action-bar.module.css"

export interface BulkActionBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of selected items. Bar renders only when count > 0. */
  count: number
  /** Action buttons cluster — typically one or more `<Button>` instances. */
  children: React.ReactNode

  /** Render inline (non-sticky) instead of fixed to the viewport bottom. */
  inline?: boolean
  /** Selection label renderer. Defaults to `(n) => `${n} selected``. */
  label?: (count: number) => React.ReactNode
  /** Aria-label and tooltip for the dismiss button. Defaults to "Clear selection". */
  clearLabel?: React.ReactNode

  /** Fired by the Escape key and the dismiss button. */
  onClear?: () => void
  /** Show the dismiss (X) button. Defaults to `true`. */
  dismissible?: boolean
  /** Auto-focus the first action button on mount. Defaults to `true`. */
  autoFocus?: boolean
}

const defaultLabel = (count: number) => `${count} selected`

const BulkActionBar = React.forwardRef<HTMLDivElement, BulkActionBarProps>(
  (
    {
      className,
      count,
      children,
      inline = false,
      label = defaultLabel,
      clearLabel = "Clear selection",
      onClear,
      dismissible = true,
      autoFocus = true,
      ...props
    },
    ref
  ) => {
    const actionsRef = React.useRef<HTMLDivElement>(null)

    // Escape-to-clear — attached only when `onClear` is provided.
    React.useEffect(() => {
      if (!onClear) return
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClear()
        }
      }
      document.addEventListener("keydown", handleKeyDown)
      return () => {
        document.removeEventListener("keydown", handleKeyDown)
      }
    }, [onClear])

    // Auto-focus first action button on mount (not on every count change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => {
      if (!autoFocus) return
      const root = actionsRef.current
      if (!root) return
      const firstButton = root.querySelector<HTMLButtonElement>(
        "button:not([disabled])"
      )
      firstButton?.focus()
    }, [])

    if (count <= 0) return null

    const showDismiss = dismissible && typeof onClear === "function"

    return (
      <div
        ref={ref}
        role="toolbar"
        aria-label="Bulk actions"
        data-slot="bulk-action-bar"
        data-inline={inline ? "true" : undefined}
        className={cn(
          styles.base,
          inline ? styles.inline : styles.sticky,
          className
        )}
        {...props}
      >
        <span
          data-slot="bulk-action-bar-count"
          className={styles.count}
          aria-live="polite"
          aria-atomic="true"
        >
          {label(count)}
        </span>

        <div
          ref={actionsRef}
          data-slot="bulk-action-bar-actions"
          className={styles.actions}
        >
          {children}
        </div>

        {showDismiss ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            data-slot="bulk-action-bar-dismiss"
            className={styles.dismiss}
            aria-label={
              typeof clearLabel === "string" ? clearLabel : "Clear selection"
            }
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    )
  }
)
BulkActionBar.displayName = "BulkActionBar"

export { BulkActionBar }
