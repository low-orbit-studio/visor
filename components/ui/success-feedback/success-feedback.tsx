"use client"

import * as React from "react"
import { CheckCircle } from "@phosphor-icons/react/dist/ssr"
import { toast } from "../toast/toast"
import { cn } from "../../../lib/utils"
import styles from "./success-feedback.module.css"

/* ──────────────────────────────────────────────────────────────────────────
   Success Feedback Pattern (VI-589)

   Borealis-recommended wrapper for the app-wide success / transition
   feedback pattern. Builds on the existing Toast primitive (Sonner-backed).

   Key behaviours per Borealis spec (06-success-toast.html):
   - Auto-dismiss after 4s (configurable, min 3s, max 8s)
   - Optional "Undo" / "View" action
   - Deduplication within 500ms window via toast id
   - Explicit a11y live region (`role=status aria-live=polite`) for cases
     where the Toaster is not in the portal
   ────────────────────────────────────────────────────────────────────────── */

export interface SuccessToastOptions {
  /** Supporting sub-copy beneath the title (optional). */
  description?: string
  /**
   * Optional action affordance rendered as a link-style button.
   * Mapped to Sonner's `action` option.
   */
  action?: {
    label: string
    onClick: () => void
  }
  /**
   * Auto-dismiss duration in milliseconds.
   * Clamped to [3000, 8000] per Borealis spec.
   * Defaults to 4000ms.
   */
  duration?: number
  /**
   * Explicit toast id for deduplication.
   * Sonner merges calls with the same id within its window.
   */
  id?: string | number
}

/**
 * `useSuccessToast` — imperative hook for the success-feedback pattern.
 *
 * Returns a stable `showSuccess(title, options?)` function that fires
 * a Sonner success toast pre-configured with the Borealis spec defaults:
 * 4s auto-dismiss, polite live region, optional undo action.
 *
 * @example
 * const { showSuccess } = useSuccessToast();
 * await saveProject();
 * showSuccess("Project saved", { description: "All changes have been saved." });
 *
 * // With undo action
 * showSuccess("Item deleted", {
 *   action: { label: "Undo", onClick: handleUndo },
 * });
 */
export function useSuccessToast() {
  const showSuccess = React.useCallback(
    (title: string, options: SuccessToastOptions = {}) => {
      const { description, action, duration = 4000, id } = options
      const clampedDuration = Math.min(8000, Math.max(3000, duration))

      toast.success(title, {
        description,
        duration: clampedDuration,
        action: action
          ? { label: action.label, onClick: action.onClick }
          : undefined,
        id,
      })
    },
    []
  )

  return { showSuccess }
}

/* ──────────────────────────────────────────────────────────────────────────
   SuccessLiveRegion

   A visually-hidden `role=status aria-live=polite` node that surfaces
   success announcements to assistive technology when the Toaster portal
   is not present (e.g. server-rendered shells, testing environments).

   Usage: mount once in the app root alongside `<Toaster />`.

   The `message` prop should be set to the latest success title so screen
   readers re-announce on every update. Reset to empty string after
   announcement if needed.
   ────────────────────────────────────────────────────────────────────────── */

export interface SuccessLiveRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The success message to announce. Updates trigger a screen-reader announcement. */
  message?: string
}

const SuccessLiveRegion = React.forwardRef<HTMLDivElement, SuccessLiveRegionProps>(
  ({ message = "", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-slot="success-live-region"
        className={`${styles.liveRegion}${className ? ` ${className}` : ""}`}
        {...props}
      >
        {message}
      </div>
    )
  }
)
SuccessLiveRegion.displayName = "SuccessLiveRegion"

export { SuccessLiveRegion }

/* ──────────────────────────────────────────────────────────────────────────
   SuccessPanel (VI-714)

   The end-of-flow screen: a round success seal, a heading, a description,
   an optional check list and the host's action, centred. Its heading is
   announced once, on mount, through SuccessLiveRegion. Icons are slots;
   each defaults to a check-circle.
   ────────────────────────────────────────────────────────────────────────── */

export interface SuccessPanelItem {
  /** The row's icon. Defaults to a check-circle in the success ink. */
  icon?: React.ReactNode
  /** The row's text. Bold runs (`<b>`, `<strong>`) read in the primary ink. */
  content: React.ReactNode
}

export interface SuccessPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The panel's heading, announced to screen readers once on mount. */
  heading: string
  /** Supporting copy under the heading. */
  description?: React.ReactNode
  /** The seal's icon. Defaults to a check-circle. */
  icon?: React.ReactNode
  /** Optional check list under the description. */
  items?: SuccessPanelItem[]
  /** The host's action, usually a Button. */
  action?: React.ReactNode
}

const SuccessPanel = React.forwardRef<HTMLDivElement, SuccessPanelProps>(
  ({ heading, description, icon, items, action, className, ...props }, ref) => {
    // Set after mount so the live region exists before its text changes.
    const [announced, setAnnounced] = React.useState("")
    const headingOnMount = React.useRef(heading)
    React.useEffect(() => {
      setAnnounced(headingOnMount.current)
    }, [])

    return (
      <div ref={ref} data-slot="success-panel" className={cn(styles.panel, className)} {...props}>
        <span data-slot="success-panel-seal" className={styles.seal} aria-hidden="true">
          {icon ?? <CheckCircle />}
        </span>
        <h2 data-slot="success-panel-heading" className={styles.heading}>
          {heading}
        </h2>
        {description && (
          <p data-slot="success-panel-description" className={styles.description}>
            {description}
          </p>
        )}
        {items && items.length > 0 && (
          <ul data-slot="success-panel-list" className={styles.list}>
            {items.map((item, i) => (
              <li key={i} data-slot="success-panel-item" className={styles.item}>
                <span className={styles.itemIcon} aria-hidden="true">
                  {item.icon ?? <CheckCircle />}
                </span>
                <span>{item.content}</span>
              </li>
            ))}
          </ul>
        )}
        {action && (
          <div data-slot="success-panel-action" className={styles.action}>
            {action}
          </div>
        )}
        <SuccessLiveRegion message={announced} />
      </div>
    )
  }
)
SuccessPanel.displayName = "SuccessPanel"

export { SuccessPanel }
