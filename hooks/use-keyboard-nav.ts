"use client"

import { useEffect } from "react"

export interface UseKeyboardNavOptions {
  /** Container element to listen on. Falls back to document if not provided. */
  containerRef?: React.RefObject<HTMLElement | null>
  goTo: (index: number) => void
  currentIndexRef: React.MutableRefObject<number>
  totalSectionsRef: React.MutableRefObject<number>
}

/** Focused controls that use these keys themselves (typing, radio/tab/toggle groups, sliders, selects). */
const OWNS_KEYS =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="combobox"], [role="spinbutton"], [role="listbox"], [role="menu"], [data-radix-collection-item]'

export function useKeyboardNav({
  containerRef,
  goTo,
  currentIndexRef,
  totalSectionsRef,
}: UseKeyboardNavOptions) {
  useEffect(() => {
    const target = containerRef?.current ?? document

    function handleKeydown(e: KeyboardEvent) {
      if (e.target instanceof Element && e.target.closest(OWNS_KEYS)) return
      // Let browser handle Cmd+Arrow (back/forward navigation)
      if (e.metaKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        return
      }
      if (e.metaKey && e.key === "ArrowUp") {
        e.preventDefault()
        goTo(0)
      } else if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault()
        goTo(currentIndexRef.current + 1)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        goTo(currentIndexRef.current - 1)
      } else if (e.key === "Home") {
        e.preventDefault()
        goTo(0)
      } else if (e.key === "End") {
        e.preventDefault()
        goTo(totalSectionsRef.current - 1)
      }
    }

    target.addEventListener("keydown", handleKeydown as EventListener)
    return () => target.removeEventListener("keydown", handleKeydown as EventListener)
  }, [containerRef, goTo, currentIndexRef, totalSectionsRef])
}
