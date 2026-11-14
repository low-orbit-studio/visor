"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./resizable-split.module.css"

export interface ResizableSplitProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> {
  /** The two panes, start (left) then end (right). */
  children: [React.ReactNode, React.ReactNode]
  /** The start pane's width in px. Controlled. */
  size?: number
  /** The start pane's first width in px when uncontrolled. Without it the panes start equal. */
  defaultSize?: number
  /** Called with the start pane's new width in px while dragging and on every key step. */
  onSizeChange?: (size: number) => void
  /** The start pane's minimum width in px. */
  minStart?: number
  /** The end pane's minimum width in px. */
  minEnd?: number
  /** px per arrow key press. Shift + arrows step four times this. */
  step?: number
  /** The divider's accessible name. */
  dividerLabel?: string
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi))

const ResizableSplit = React.forwardRef<HTMLDivElement, ResizableSplitProps>(
  (
    {
      className,
      children,
      size,
      defaultSize,
      onSizeChange,
      minStart = 0,
      minEnd = 0,
      step = 16,
      dividerLabel = "Resize panes",
      style,
      ...props
    },
    ref
  ) => {
    const rootRef = React.useRef<HTMLDivElement>(null)
    const dividerRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(ref, () => rootRef.current as HTMLDivElement)

    const [internal, setInternal] = React.useState<number | undefined>(defaultSize)
    const [avail, setAvail] = React.useState(0)
    const [dragging, setDragging] = React.useState(false)
    const drag = React.useRef<{ x: number; from: number } | null>(null)
    const value = size ?? internal

    // The width the two panes share: the root less the divider.
    const measure = React.useCallback(() => {
      const root = rootRef.current?.getBoundingClientRect().width ?? 0
      const divider = dividerRef.current?.getBoundingClientRect().width ?? 0
      return Math.max(root - divider, 0)
    }, [])

    React.useLayoutEffect(() => {
      setAvail(measure())
      if (typeof ResizeObserver === "undefined" || !rootRef.current) return
      const ro = new ResizeObserver(() => setAvail(measure()))
      ro.observe(rootRef.current)
      return () => ro.disconnect()
    }, [measure])

    const max = Math.max(minStart, avail - minEnd)
    const now = Math.round(clamp(value ?? avail / 2, minStart, max))

    const set = (next: number) => {
      const shared = measure()
      const v = Math.round(clamp(next, minStart, shared - minEnd))
      setAvail(shared)
      if (size === undefined) setInternal(v)
      onSizeChange?.(v)
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const by = e.shiftKey ? step * 4 : step
      const moves: Record<string, () => number> = {
        ArrowLeft: () => now - by,
        ArrowRight: () => now + by,
        Home: () => minStart,
        End: () => Number.POSITIVE_INFINITY,
      }
      const move = moves[e.key]
      if (!move) return
      e.preventDefault()
      set(move())
    }

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.currentTarget.focus()
      // Capture keeps the moves coming over an iframe; the panes also stop taking the pointer while dragging.
      e.currentTarget.setPointerCapture?.(e.pointerId)
      drag.current = { x: e.clientX, from: now }
      setDragging(true)
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag.current) return
      set(drag.current.from + e.clientX - drag.current.x)
    }

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag.current) return
      drag.current = null
      setDragging(false)
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    }

    const [start, end] = React.Children.toArray(children)

    return (
      <div
        ref={rootRef}
        data-slot="resizable-split"
        data-dragging={dragging ? "" : undefined}
        className={cn(styles.root, className)}
        style={style}
        {...props}
      >
        <div
          data-slot="resizable-split-start"
          className={styles.pane}
          style={{ flex: value === undefined ? "1 1 0%" : `0 1 ${value}px`, minWidth: minStart }}
        >
          {start}
        </div>
        <div
          ref={dividerRef}
          role="separator"
          tabIndex={0}
          aria-label={dividerLabel}
          aria-orientation="vertical"
          aria-valuenow={now}
          aria-valuemin={minStart}
          aria-valuemax={Math.round(max)}
          data-slot="resizable-split-divider"
          className={styles.divider}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
        <div data-slot="resizable-split-end" className={styles.pane} style={{ flex: "1 1 0%", minWidth: minEnd }}>
          {end}
        </div>
      </div>
    )
  }
)
ResizableSplit.displayName = "ResizableSplit"

export { ResizableSplit }
