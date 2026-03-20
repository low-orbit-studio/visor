"use client"

import { useCallback, useState } from "react"

export interface UseBooleanReturn {
  value: boolean
  setTrue: () => void
  setFalse: () => void
  toggle: () => void
  setValue: (value: boolean) => void
}

/**
 * Manages a boolean state with stable toggle, setTrue, and setFalse helpers.
 * Useful for open/close, show/hide, and enabled/disabled patterns.
 */
export function useBoolean(initialValue: boolean = false): UseBooleanReturn {
  const [value, setValue] = useState<boolean>(initialValue)

  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])
  const toggle = useCallback(() => setValue((v) => !v), [])

  return { value, setTrue, setFalse, toggle, setValue }
}
