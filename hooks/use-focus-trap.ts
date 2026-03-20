"use client"

import { useEffect, type RefObject } from "react"

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  "details > summary",
].join(", ")

/**
 * Traps keyboard focus within the referenced element.
 * Used for accessible modals, drawers, and dialogs.
 * Tab wraps forward, Shift+Tab wraps backward.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return

    const container = ref.current
    if (!container) return

    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      ).filter(
        (el) =>
          !el.closest("[inert]") &&
          getComputedStyle(el).display !== "none" &&
          getComputedStyle(el).visibility !== "hidden"
      )
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return

      const focusable = getFocusableElements()
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown)

    // Move focus into the container if it's not already there
    const focusable = getFocusableElements()
    if (focusable.length > 0 && !container.contains(document.activeElement)) {
      focusable[0].focus()
    }

    return () => {
      container.removeEventListener("keydown", handleKeyDown)
    }
  }, [ref, enabled])
}
