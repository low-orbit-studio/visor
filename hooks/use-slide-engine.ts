"use client"

import { useCallback, useRef } from "react"

export interface UseSlideEngineOptions {
  /** Container element that scrolls */
  containerRef?: React.RefObject<HTMLElement | null>
  sectionsRef: React.RefObject<HTMLElement[]>
  currentIndexRef: React.MutableRefObject<number>
  setCurrentIndex?: (index: number) => void
}

export function useSlideEngine({
  containerRef,
  sectionsRef,
  currentIndexRef,
  setCurrentIndex,
}: UseSlideEngineOptions) {
  const isScrollingRef = useRef(false)

  const goTo = useCallback(
    (index: number) => {
      const sections = sectionsRef.current
      if (!sections || index < 0 || index >= sections.length || isScrollingRef.current) return

      isScrollingRef.current = true
      currentIndexRef.current = index
      setCurrentIndex?.(index)

      const container = containerRef?.current
      const el = sections[index]

      // Use native smooth scroll — the browser coordinates with scroll-snap
      // internally, avoiding the stutter caused by rAF + snap fighting.
      if (container) {
        const target = el.offsetTop - container.offsetTop
        container.scrollTo({ top: target, behavior: "smooth" })
      } else {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
      }

      el.setAttribute("data-deck-visible", "true")

      // Unlock after scroll settles (native smooth scroll ~400-600ms)
      setTimeout(() => {
        isScrollingRef.current = false
      }, 600)
    },
    [containerRef, sectionsRef, currentIndexRef, setCurrentIndex]
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
