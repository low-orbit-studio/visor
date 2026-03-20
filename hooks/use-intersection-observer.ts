"use client"

import { useEffect, useRef, useState } from "react"

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /**
   * If true, stop observing after the element first intersects.
   * Useful for lazy-loading or one-shot animations.
   */
  once?: boolean
}

export interface UseIntersectionObserverReturn {
  ref: React.RefObject<Element | null>
  isIntersecting: boolean
  entry: IntersectionObserverEntry | null
}

/**
 * Tracks whether an element is visible within the viewport (or a scroll container).
 * SSR-safe: returns false until mounted.
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const { once = false, threshold = 0, root = null, rootMargin = "0%" } = options

  const ref = useRef<Element | null>(null)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)

  useEffect(() => {
    const element = ref.current

    if (!element || typeof IntersectionObserver === "undefined") {
      return
    }

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        setEntry(observerEntry)
        if (once && observerEntry.isIntersecting) {
          observer.disconnect()
        }
      },
      { threshold, root, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [once, threshold, root, rootMargin])

  return {
    ref,
    isIntersecting: entry?.isIntersecting ?? false,
    entry,
  }
}
