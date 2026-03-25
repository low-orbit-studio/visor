"use client"

import { useEffect } from "react"

export interface UseKeyboardNavOptions {
  goTo: (index: number) => void
  currentIndexRef: React.MutableRefObject<number>
  totalSectionsRef: React.MutableRefObject<number>
}

export function useKeyboardNav({
  goTo,
  currentIndexRef,
  totalSectionsRef,
}: UseKeyboardNavOptions) {
  useEffect(() => {
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

    document.addEventListener("keydown", handleKeydown)
    return () => document.removeEventListener("keydown", handleKeydown)
  }, [goTo, currentIndexRef, totalSectionsRef])
}
