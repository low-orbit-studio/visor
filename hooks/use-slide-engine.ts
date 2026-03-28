"use client"

import { useCallback, useRef } from "react"

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export interface UseSlideEngineOptions {
  /** Container element that scrolls */
  containerRef?: React.RefObject<HTMLElement | null>
  sectionsRef: React.RefObject<HTMLElement[]>
  currentIndexRef: React.MutableRefObject<number>
  setCurrentIndex?: (index: number) => void
  duration?: number
}

export function useSlideEngine({
  containerRef,
  sectionsRef,
  currentIndexRef,
  setCurrentIndex,
  duration = 700,
}: UseSlideEngineOptions) {
  const isScrollingRef = useRef(false)

  const goTo = useCallback(
    (index: number) => {
      const sections = sectionsRef.current
      if (!sections || index < 0 || index >= sections.length || isScrollingRef.current) return

      isScrollingRef.current = true
      currentIndexRef.current = index

      document.documentElement.classList.add("deck-scrolling")

      const container = containerRef?.current
      const target = sections[index].offsetTop
      const start = container ? container.scrollTop : window.scrollY
      const dist = target - start

      function step(ts: number, t0: number | null): void {
        const startTime = t0 ?? ts
        const p = Math.min((ts - startTime) / duration, 1)
        const pos = start + dist * easeInOutQuad(p)

        if (container) {
          container.scrollTop = pos
        } else {
          window.scrollTo(0, pos)
        }

        if (p < 1) {
          requestAnimationFrame((t) => step(t, startTime))
        } else {
          document.documentElement.classList.remove("deck-scrolling")
          isScrollingRef.current = false
          setCurrentIndex?.(index)

          const section = sections[index]
          if (section) {
            section.setAttribute("data-deck-visible", "true")
          }
        }
      }

      requestAnimationFrame((ts) => step(ts, null))
    },
    [containerRef, sectionsRef, currentIndexRef, duration, setCurrentIndex]
  )

  const navigateTo = useCallback(
    (id: string) => {
      const el = document.getElementById(id)
      if (!el || !sectionsRef.current) return
      const index = sectionsRef.current.indexOf(el)
      if (index >= 0) goTo(index)
    },
    [sectionsRef, goTo]
  )

  return { goTo, navigateTo, isScrollingRef }
}
