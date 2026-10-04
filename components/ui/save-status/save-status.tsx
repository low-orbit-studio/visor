"use client"

import * as React from "react"
import { ArrowClockwise } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./save-status.module.css"

/**
 * The states `useAutosave` reports, plus `syncing`: a first sync from an outside
 * source is writing rows the user did not type. `useAutosave` never emits it;
 * the consumer sets it.
 */
export type SaveStatusState = "saved" | "saving" | "syncing" | "unsaved" | "refused"

const STATES: SaveStatusState[] = ["saved", "saving", "syncing", "unsaved", "refused"]

const DEFAULT_LABELS: Record<SaveStatusState, string> = {
  saved: "Saved",
  saving: "Saving",
  syncing: "Syncing",
  unsaved: "Unsaved",
  refused: "Couldn't save",
}

export interface SaveStatusProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Where the value stands — pass `useAutosave(...).status`. */
  status: SaveStatusState
  /** Shows a retry mark while `status` is `refused`. Pass `useAutosave(...).retry`. */
  onRetry?: () => void
  /** Override any of the five labels (e.g. to translate them). */
  labels?: Partial<Record<SaveStatusState, string>>
  /**
   * How `unsaved` is drawn. `"dot"` draws a dot alone, no word; the label stays
   * as visually hidden text, so the live region still announces it. Defaults to `"text"`.
   */
  unsavedAs?: "text" | "dot"
  /**
   * Draws a status dot before the label in every state, in the state's ink.
   * With `unsavedAs="dot"`, Unsaved is this dot alone. Defaults to `false`.
   */
  dot?: boolean
  /** Accessible name of the retry mark. Defaults to "Retry saving". */
  retryLabel?: string
}

/**
 * The autosave readout: status text in a slot as wide as the longest label
 * (in the theme's own font) plus the retry mark, or `--save-status-width`, so the row it
 * sits in never reflows as the state changes. It is status text, not a
 * button; the only control is the retry mark, shown after a failed save.
 * It draws no edge.
 */
const SaveStatus = React.forwardRef<HTMLSpanElement, SaveStatusProps>(
  ({ status, onRetry, labels, unsavedAs = "text", dot = false, retryLabel = "Retry saving", className, ...props }, ref) => {
    const label = labels?.[status] ?? DEFAULT_LABELS[status]
    const asDot = status === "unsaved" && unsavedAs === "dot"
    const showRetry = status === "refused" && onRetry
    return (
      <span
        ref={ref}
        data-slot="save-status"
        data-state={status}
        data-as={asDot ? "dot" : undefined}
        className={cn(styles.root, className)}
        {...props}
      >
        {dot ? (
          <span data-slot="save-status-lead" className={styles.lead} aria-hidden="true">
            <span data-slot="save-status-status-dot" className={styles.statusDot} />
          </span>
        ) : null}
        <span data-slot="save-status-cell" className={styles.cell}>
          {STATES.map((state) => (
            <span key={state} data-slot="save-status-sizer" className={styles.sizer} aria-hidden="true">
              {labels?.[state] ?? DEFAULT_LABELS[state]}
            </span>
          ))}
          {asDot && !dot ? <span data-slot="save-status-dot" className={styles.dot} aria-hidden="true" /> : null}
          <span
            data-slot="save-status-text"
            className={cn(styles.text, asDot && styles.hidden)}
            role="status"
            aria-live="polite"
          >
            {label}
          </span>
        </span>
        {showRetry ? (
          <button
            type="button"
            data-slot="save-status-retry"
            className={styles.retry}
            aria-label={retryLabel}
            onClick={onRetry}
          >
            <ArrowClockwise aria-hidden="true" />
          </button>
        ) : (
          <span data-slot="save-status-retry-reserve" className={styles.reserve} aria-hidden="true" />
        )}
      </span>
    )
  }
)
SaveStatus.displayName = "SaveStatus"

export { SaveStatus }
