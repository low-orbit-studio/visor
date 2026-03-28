"use client"

import { useEffect, useRef } from "react"

export interface UseWheelNavOptions {
  /** Container element to listen on. Falls back to document if not provided. */
  containerRef?: React.RefObject<HTMLElement | null>
  goTo: (index: number) => void
  currentIndexRef: React.MutableRefObject<number>
}

export function useWheelNav({
  containerRef,
  goTo,
  currentIndexRef,
}: UseWheelNavOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const target = containerRef?.current ?? document

    function handleWheel(e: Event) {
      const we = e as WheelEvent
      we.preventDefault()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        goTo(currentIndexRef.current + (we.deltaY > 0 ? 1 : -1))
      }, 60)
    }

    target.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      target.removeEventListener("wheel", handleWheel)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [containerRef, goTo, currentIndexRef])
}
