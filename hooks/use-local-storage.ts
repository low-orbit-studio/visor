import { useCallback, useEffect, useState } from "react"

type SetValue<T> = (value: T | ((prev: T) => T)) => void

/**
 * Persists state to localStorage with SSR safety.
 * Falls back gracefully when localStorage is unavailable.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, SetValue<T>, () => void] {
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  }, [key, initialValue])

  const [storedValue, setStoredValue] = useState<T>(readValue)

  const setValue: SetValue<T> = useCallback(
    (value) => {
      if (typeof window === "undefined") {
        return
      }
      try {
        const newValue = value instanceof Function ? value(storedValue) : value
        window.localStorage.setItem(key, JSON.stringify(newValue))
        setStoredValue(newValue)
        window.dispatchEvent(new Event("local-storage"))
      } catch {
        // Silently fail — storage quota exceeded or private browsing
      }
    },
    [key, storedValue]
  )

  const removeValue = useCallback(() => {
    if (typeof window === "undefined") {
      return
    }
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
      window.dispatchEvent(new Event("local-storage"))
    } catch {
      // Silently fail
    }
  }, [key, initialValue])

  useEffect(() => {
    setStoredValue(readValue())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(readValue())
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("local-storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("local-storage", handleStorageChange)
    }
  }, [readValue])

  return [storedValue, setValue, removeValue]
}
