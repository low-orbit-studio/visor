"use client"

import { useEffect } from "react"

export interface KeyboardShortcutOptions {
  /** Whether the Meta (Cmd on Mac, Win on Windows) key must be held. */
  meta?: boolean
  /** Whether the Ctrl key must be held. */
  ctrl?: boolean
  /** Whether the Shift key must be held. */
  shift?: boolean
  /** Whether the Alt/Option key must be held. */
  alt?: boolean
  /** Element to attach the listener to. Defaults to `document`. */
  target?: EventTarget | null
  /** Whether to prevent the default browser action. Defaults to false. */
  preventDefault?: boolean
}

/**
 * Fires a callback when a specific keyboard shortcut is pressed.
 * Handles modifier keys (Meta, Ctrl, Shift, Alt) with precise matching.
 */
export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
): void {
  const {
    meta = false,
    ctrl = false,
    shift = false,
    alt = false,
    target = null,
    preventDefault = false,
  } = options

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== key.toLowerCase() ||
        event.metaKey !== meta ||
        event.ctrlKey !== ctrl ||
        event.shiftKey !== shift ||
        event.altKey !== alt
      ) {
        return
      }

      if (preventDefault) {
        event.preventDefault()
      }

      callback(event)
    }

    const eventTarget =
      target ?? (typeof document !== "undefined" ? document : null)

    if (!eventTarget) {
      return
    }

    eventTarget.addEventListener("keydown", handler as EventListener)

    return () => {
      eventTarget.removeEventListener("keydown", handler as EventListener)
    }
  }, [key, callback, meta, ctrl, shift, alt, target, preventDefault])
}
