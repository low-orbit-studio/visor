"use client"

import { useEffect } from "react"

export interface UseIntersectionAnimationOptions {
  sectionsRef: React.RefObject<HTMLElement[]>
  currentIndexRef: React.MutableRefObject<number>
  setCurrentIndex: (index: number) => void
  threshold?: number
}

export function useIntersectionAnimation({
  sectionsRef,
  currentIndexRef,
  setCurrentIndex,
  threshold = 0.4,
}: UseIntersectionAnimationOptions) {
  useEffect(() => {
    const sections = sectionsRef.current
    if (!sections || sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = sections.indexOf(entry.target as HTMLElement)
          if (idx === -1) return

          if (entry.isIntersecting) {
            if (!document.documentElement.classList.contains("deck-scrolling")) {
              currentIndexRef.current = idx
              setCurrentIndex(idx)
            }
            entry.target.setAttribute("data-deck-visible", "true")
          } else {
            entry.target.removeAttribute("data-deck-visible")
          }
        })
      },
      { threshold }
    )

    sections.forEach((section) => observer.observe(section))

    // Make first section visible immediately
    const first = sections[0]
    if (first) {
      first.setAttribute("data-deck-visible", "true")
    }

    return () => observer.disconnect()
  }, [sectionsRef, currentIndexRef, setCurrentIndex, threshold])
}
