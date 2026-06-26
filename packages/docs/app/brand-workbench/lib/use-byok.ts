"use client"

// Reactive BYOK layer (VI-562). `byok.ts` stays a pure storage module; this hook makes the key
// status + model reactive across the localStorage write (and across tabs) so the top-bar key pill and
// the Elicit seam re-render in lockstep when the operator saves/clears a key — no provider needed.

import * as React from "react"
import type { KeyStatus } from "../../../../../spec/state-machine"
import {
  DEFAULT_MODEL,
  getKeyStatus,
  getModel,
  setApiKey,
  clearApiKey,
  setModel,
} from "./byok"

const BYOK_EVENT = "visor-byok-change"

/** Notify subscribers after a same-tab BYOK write (storage events only fire cross-tab). */
function emit(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(BYOK_EVENT))
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(BYOK_EVENT, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(BYOK_EVENT, cb)
    window.removeEventListener("storage", cb)
  }
}

export interface ByokController {
  keyStatus: KeyStatus
  model: string
  hasKey: boolean
  /** Store (or, with a blank value, clear) the key, then notify. */
  saveKey: (key: string) => void
  /** Drop the key back to keyless, then notify. */
  clearKey: () => void
  /** Choose an offered model, then notify. */
  chooseModel: (id: string) => void
}

/** Subscribe to BYOK key status + model. SSR-safe (server renders keyless / default model). */
export function useByok(): ByokController {
  const keyStatus = React.useSyncExternalStore<KeyStatus>(
    subscribe,
    getKeyStatus,
    () => "keyless",
  )
  const model = React.useSyncExternalStore<string>(subscribe, getModel, () => DEFAULT_MODEL)

  const saveKey = React.useCallback((key: string) => {
    setApiKey(key)
    emit()
  }, [])
  const clearKey = React.useCallback(() => {
    clearApiKey()
    emit()
  }, [])
  const chooseModel = React.useCallback((id: string) => {
    setModel(id)
    emit()
  }, [])

  return { keyStatus, model, hasKey: keyStatus === "key-active", saveKey, clearKey, chooseModel }
}
