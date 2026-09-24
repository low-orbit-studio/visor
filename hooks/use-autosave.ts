"use client"

import { useEffect, useRef, useState } from "react"

/** Where an autosaved value stands. */
export type AutosaveStatus = "saved" | "saving" | "unsaved" | "refused"

/** Passed to `write`: whether the page is being left (use `keepalive` or `sendBeacon`). */
export interface AutosaveWriteContext {
  leaving: boolean
}

export interface UseAutosaveOptions<T> {
  /** Debounce, in milliseconds, after the last change. Defaults to 600. */
  delay?: number
  /** Return false to refuse a value: it is never written, and the hook goes to `refused`. */
  validate?: (value: T) => boolean
  /** Decides whether a value is already saved. Defaults to `Object.is`. */
  isEqual?: (a: T, b: T) => boolean
}

export interface UseAutosaveResult {
  status: AutosaveStatus
  /** Why the hook is `refused`: `validate` rejected the value, or `write` failed. */
  reason: "invalid" | "failed" | null
  /** What `write` threw or rejected with, while `reason` is `"failed"`. */
  error: unknown
  /** Write the current value now. */
  retry: () => void
  /** Write a pending change now instead of waiting for the debounce. */
  flush: () => void
}

interface State {
  status: AutosaveStatus
  reason: UseAutosaveResult["reason"]
  error: unknown
}

const SAVED: State = { status: "saved", reason: null, error: undefined }
const SAVING: State = { status: "saving", reason: null, error: undefined }
const UNSAVED: State = { status: "unsaved", reason: null, error: undefined }

interface Live<T> {
  value: T
  write: (value: T, context: AutosaveWriteContext) => unknown
  validate?: (value: T) => boolean
  isEqual: (a: T, b: T) => boolean
  delay: number
}

/**
 * The autosave state machine. Built once per hook instance; it reads the
 * latest value and callbacks from `live`, so timers and page listeners never
 * see a stale render.
 */
function createAutosave<T>(live: Live<T>, setState: (state: State) => void) {
  /** The last value `write` confirmed. The first render's value counts as saved. */
  let saved = live.value
  /** The value of the newest write started. */
  let sent = live.value
  /** Id of the newest write started; responses to older ones are ignored. */
  let seq = 0
  let inFlight = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  /** A debounced write is waiting for the one in flight. */
  let queued = false
  let mounted = false

  const set = (next: State) => {
    if (mounted) setState(next)
  }
  /** The value the store will hold once in-flight writes settle. */
  const target = () => (inFlight > 0 ? sent : saved)
  const clearTimer = () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  function start(next: T, leaving: boolean) {
    const id = ++seq
    sent = next
    inFlight++
    set(SAVING)

    const settle = (ok: boolean, error?: unknown) => {
      inFlight--
      if (id !== seq) return // a newer write owns the state
      if (ok) saved = next
      if (queued) {
        queued = false
        attempt(false, true)
      } else if (timer !== null) {
        set(UNSAVED)
      } else if (!ok) {
        set({ status: "refused", reason: "failed", error })
      } else {
        set(live.isEqual(live.value, saved) ? SAVED : UNSAVED)
      }
    }

    let result: unknown
    try {
      result = live.write(next, { leaving })
    } catch (error) {
      settle(false, error)
      return
    }
    Promise.resolve(result).then(
      () => settle(true),
      (error: unknown) => settle(false, error)
    )
  }

  /**
   * Validate and write the current value, unless the store already has it.
   * `serialize` makes it wait for a write in flight; leaving the page does not.
   */
  function attempt(leaving: boolean, serialize: boolean, force = false) {
    const next = live.value
    if (!force && live.isEqual(next, target())) {
      set(inFlight > 0 ? SAVING : SAVED)
      return
    }
    if (live.validate && !live.validate(next)) {
      set({ status: "refused", reason: "invalid", error: undefined })
      return
    }
    if (serialize && inFlight > 0) {
      queued = true
      set(UNSAVED)
      return
    }
    start(next, leaving)
  }

  /** Write a waiting change now, without waiting for a write in flight. */
  const flushPending = (leaving: boolean) => {
    if (timer === null && !queued) return
    clearTimer()
    queued = false
    attempt(leaving, false)
  }

  return {
    /** A new value: schedule a write, or cancel one if the store already has it. */
    change() {
      clearTimer()
      if (live.isEqual(live.value, target())) {
        queued = false
        set(inFlight > 0 ? SAVING : SAVED)
        return
      }
      set(UNSAVED)
      timer = setTimeout(() => {
        timer = null
        attempt(false, true)
      }, live.delay)
    },
    retry() {
      clearTimer()
      queued = false
      attempt(false, true, true)
    },
    flush: () => flushPending(false),
    /** Page listeners, and the unmount flush. */
    mount() {
      mounted = true
      const onPageHide = () => flushPending(true)
      const onVisibility = () => {
        if (document.visibilityState === "hidden") flushPending(true)
      }
      const onBeforeUnload = (event: BeforeUnloadEvent) => {
        flushPending(true)
        if (inFlight > 0) {
          event.preventDefault()
          // Chrome and Safari still read returnValue to show the prompt.
          event.returnValue = ""
        }
      }
      window.addEventListener("pagehide", onPageHide)
      window.addEventListener("beforeunload", onBeforeUnload)
      document.addEventListener("visibilitychange", onVisibility)
      return () => {
        window.removeEventListener("pagehide", onPageHide)
        window.removeEventListener("beforeunload", onBeforeUnload)
        document.removeEventListener("visibilitychange", onVisibility)
        mounted = false
        flushPending(false)
      }
    },
  }
}

/**
 * Autosave for one value. Changes are written through `write` after `delay`
 * ms of quiet, with no Save button.
 *
 * - One write at a time. A change made while a write is in flight waits for
 *   it, then only the newest value is written, so the store sees edits in
 *   order. A response from an older write never overrides a newer state.
 * - Nothing pending is lost: a waiting change is written at once on
 *   `pagehide`, when the tab is hidden, on `beforeunload` and on unmount.
 *   `beforeunload` asks the user to stay only while a write is in flight.
 * - `validate` belongs to the caller. A value it refuses is never written,
 *   stays in the control, and puts the hook in `refused`.
 *
 * The value passed on the first render is treated as already saved. Pass a
 * stable value (or `isEqual`) for objects, or every render counts as a change.
 */
export function useAutosave<T>(
  value: T,
  write: (value: T, context: AutosaveWriteContext) => unknown,
  options: UseAutosaveOptions<T> = {}
): UseAutosaveResult {
  const { delay = 600, validate, isEqual = Object.is } = options
  const [state, setState] = useState<State>(SAVED)
  const live = useRef<Live<T>>({ value, write, validate, isEqual, delay }).current
  live.value = value
  live.write = write
  live.validate = validate
  live.isEqual = isEqual
  live.delay = delay
  const [autosave] = useState(() => createAutosave(live, setState))

  useEffect(() => autosave.mount(), [autosave])
  useEffect(() => autosave.change(), [autosave, value])

  return { status: state.status, reason: state.reason, error: state.error, retry: autosave.retry, flush: autosave.flush }
}
