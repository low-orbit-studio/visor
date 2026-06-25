"use client"

import * as React from "react"
import { toast } from "../toast/toast"
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
