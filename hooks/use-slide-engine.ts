"use client"

import { useCallback, useRef } from "react"

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export interface UseSlideEngineOptions {
  sectionsRef: React.RefObject<HTMLElement[]>
  currentIndexRef: React.MutableRefObject<number>
  setCurrentIndex?: (index: number) => void
  duration?: number
}

export function useSlideEngine({
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

      const target = sections[index].offsetTop
      const start = window.scrollY
      const dist = target - start
      let t0: number | null = null

      function step(ts: number) {
        if (t0 === null) t0 = ts
        const p = Math.min((ts - t0) / duration, 1)
        window.scrollTo(0, start + dist * easeInOutQuad(p))

        if (p < 1) {
          requestAnimationFrame(step)
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

      requestAnimationFrame(step)
    },
    [sectionsRef, currentIndexRef, duration, setCurrentIndex]
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
