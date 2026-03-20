"use client"

import { useEffect, useState } from "react"

/**
 * Debounces a value by delaying updates until after a specified delay.
 * Useful for search inputs, resize handlers, and other high-frequency events.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
