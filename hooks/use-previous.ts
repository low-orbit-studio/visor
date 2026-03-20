"use client"

import { useEffect, useRef } from "react"

/**
 * Returns the previous value of a variable from the last render.
 * Useful for comparing values across renders (e.g., detecting direction of change).
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}
