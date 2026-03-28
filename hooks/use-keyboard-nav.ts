"use client"

import { useEffect } from "react"

export interface UseKeyboardNavOptions {
  /** Container element to listen on. Falls back to document if not provided. */
  containerRef?: React.RefObject<HTMLElement | null>
  goTo: (index: number) => void
  currentIndexRef: React.MutableRefObject<number>
  totalSectionsRef: React.MutableRefObject<number>
}

export function useKeyboardNav({
  containerRef,
  goTo,
  currentIndexRef,
  totalSectionsRef,
}: UseKeyboardNavOptions) {
  useEffect(() => {
    const target = containerRef?.current ?? document

    function handleKeydown(e: KeyboardEvent) {
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
