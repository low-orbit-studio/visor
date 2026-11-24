"use client"

import * as React from "react"
import { useCallback, useEffect, useMemo, useState, type RefObject } from "react"
import { CaretDown } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./scroll-hint.module.css"

/** The pill's band at the box's bottom edge: a field reaching into it counts as out of view. */
const EDGE = 56
/** How much of a field (its label and control) must clear that band to count as seen. */
const HEAD = 96
const FOCUSABLE = "input:not([type=file]), textarea, [role=radio], [role=combobox], [role=checkbox], [data-slot=toggle-group-item]"

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

export interface KeepGoing {
  /** There's more to read below the box's bottom edge. */
  more: boolean
  /** A field still to fill or fix sits below the fold: the main button can read "Keep Going". */
  below: boolean
  /** Scrolls the next such field into view and focuses it. False when there's none. */
  go: () => boolean
}

/**
 * Watches a scroll box for what's still out of sight below it. `pending` lists the
 * fields still to fill or fix, in order, by their `attr` value (`data-field` by default).
 * `watch` re-attaches when it changes: pass it when the box mounts or swaps its fields later (a dialog).
 */
export function useKeepGoing(
  boxRef: RefObject<HTMLElement | null>,
  pending: string[],
  attr = "data-field",
  watch?: unknown
): KeepGoing {
  const key = pending.join("\n")

  const target = useCallback((): HTMLElement | null => {
    const el = boxRef.current
    if (!el) return null
    const fold = el.getBoundingClientRect().bottom - EDGE
    for (const id of key ? key.split("\n") : []) {
      const node = el.querySelector<HTMLElement>(`[${attr}="${CSS.escape(id)}"]`)
      if (!node) continue
      const r = node.getBoundingClientRect()
      if (Math.min(r.bottom, r.top + HEAD) > fold) return node
    }
    return null
  }, [boxRef, key, attr])

  const [state, setState] = useState({ more: false, below: false })
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const check = () => {
      // 8px of slack, so a sub-pixel scroll end still counts as the end.
      const more = el.scrollTop + el.clientHeight < el.scrollHeight - 8
      const below = more && target() !== null
      setState((s) => (s.more === more && s.below === below ? s : { more, below }))
    }
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    for (const child of el.children) observer.observe(child)
    el.addEventListener("scroll", check, { passive: true })
    // Fields that rise in by transform fire no resize or scroll: look again once they've landed.
    const settled = window.setTimeout(check, 1500)
    return () => {
      observer.disconnect()
      el.removeEventListener("scroll", check)
      window.clearTimeout(settled)
    }
  }, [boxRef, target, watch])

  const go = useCallback(() => {
    const el = boxRef.current
    const node = target()
    if (!el || !node) return false
    // The field lands a fifth of the way down, so what follows it shows too.
    const top = node.getBoundingClientRect().top - el.getBoundingClientRect().top - el.clientHeight * 0.2
    el.scrollBy({ top, behavior: reducedMotion() ? "auto" : "smooth" })
    // Focus on a fine pointer (keyboard and mouse); on touch, focusing a field throws up the keyboard.
    if (window.matchMedia("(pointer: fine)").matches) node.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true })
    return true
  }, [boxRef, target])

  return useMemo(() => ({ ...state, go }), [state, go])
}

export interface ScrollHintProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The scroll box the hint sits in. */
  boxRef: RefObject<HTMLElement | null>
  /** What `useKeepGoing` returns for the same box. */
  keepGoing: KeepGoing
  /** The pill's words. */
  label?: React.ReactNode
}

/**
 * "More Below", pinned to the scroll box's bottom edge while there's more to read.
 * Render it as the box's last child. Tapping it does what "Keep Going" does, or pages down.
 * Hidden from assistive tech: keyboard users reach the next field through the form's own button.
 */
export function ScrollHint({ boxRef, keepGoing, label = "More Below", className, ...props }: ScrollHintProps) {
  return (
    <div
      data-slot="scroll-hint"
      data-show={keepGoing.more ? "" : undefined}
      aria-hidden="true"
      className={cn(styles.root, className)}
      {...props}
    >
      <button
        type="button"
        tabIndex={-1}
        className={styles.pill}
        onClick={() => {
          const el = boxRef.current
          if (!keepGoing.go() && el) el.scrollBy({ top: el.clientHeight * 0.8, behavior: reducedMotion() ? "auto" : "smooth" })
        }}
      >
        {label} <CaretDown weight="bold" aria-hidden="true" />
      </button>
    </div>
  )
}
