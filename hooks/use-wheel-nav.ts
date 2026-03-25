"use client"

import { useEffect, useRef } from "react"

export interface UseWheelNavOptions {
  goTo: (index: number) => void
  currentIndexRef: React.MutableRefObject<number>
}

export function useWheelNav({
  goTo,
  currentIndexRef,
}: UseWheelNavOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        goTo(currentIndexRef.current + (e.deltaY > 0 ? 1 : -1))
      }, 60)
    }

    document.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      document.removeEventListener("wheel", handleWheel)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [goTo, currentIndexRef])
}
