"use client"

import * as React from "react"
import { ArrowClockwise } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./save-status.module.css"

/** The states `useAutosave` reports. */
export type SaveStatusState = "saved" | "saving" | "unsaved" | "refused"

const DEFAULT_LABELS: Record<SaveStatusState, string> = {
  saved: "Saved",
  saving: "Saving",
  unsaved: "Unsaved",
  refused: "Couldn't save",
}

export interface SaveStatusProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Where the value stands — pass `useAutosave(...).status`. */
  status: SaveStatusState
  /** Shows a retry mark while `status` is `refused`. Pass `useAutosave(...).retry`. */
  onRetry?: () => void
  /** Override any of the four labels (e.g. to translate them). */
  labels?: Partial<Record<SaveStatusState, string>>
  /** Accessible name of the retry mark. Defaults to "Retry saving". */
  retryLabel?: string
}

/**
 * The autosave readout: status text in a fixed-width slot, so the row it
 * sits in never reflows as the state changes. It is status text, not a
 * button; the only control is the retry mark, shown after a failed save.
 * It draws no edge.
 */
const SaveStatus = React.forwardRef<HTMLSpanElement, SaveStatusProps>(
  ({ status, onRetry, labels, retryLabel = "Retry saving", className, ...props }, ref) => {
    const label = labels?.[status] ?? DEFAULT_LABELS[status]
    return (
      <span
        ref={ref}
        data-slot="save-status"
        data-state={status}
        className={cn(styles.root, className)}
        {...props}
      >
        <span data-slot="save-status-text" className={styles.text} role="status" aria-live="polite">
          {label}
        </span>
        {status === "refused" && onRetry ? (
          <button
            type="button"
            data-slot="save-status-retry"
            className={styles.retry}
            aria-label={retryLabel}
            onClick={onRetry}
          >
            <ArrowClockwise aria-hidden="true" />
          </button>
        ) : null}
      </span>
    )
  }
)
SaveStatus.displayName = "SaveStatus"

export { SaveStatus }
