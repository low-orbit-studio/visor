"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./slow-network-bar.module.css"

export type SlowNetworkBarState = "hidden" | "visible" | "resolving"

export interface SlowNetworkBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Visibility state of the slow-network bar.
   *
   * - `"hidden"` — Not rendered; fast requests never trigger this.
   * - `"visible"` — Indeterminate animation active; request is still pending past the threshold.
   * - `"resolving"` — Bar completes a full sweep then fades out (400ms).
   *
   * @default "hidden"
   */
  state?: SlowNetworkBarState
  /**
   * Accessible label for the progress bar. Announced to screen readers when the
   * bar becomes visible.
   * @default "Loading, please wait…"
   */
  label?: string
}

/**
 * SlowNetworkBar
 *
 * A 4px progress bar pinned to the top of a content zone that appears only when
 * a request has been pending longer than a threshold (~3 s). Uses an indeterminate
 * animation because the remaining time is unknown — showing false percentage
 * progress creates user anxiety.
 *
 * Pairs with `useSlowRequest` for automatic threshold detection, or can be driven
 * manually via the `state` prop.
 *
 * Composition rules:
 * - Never shown alongside a Skeleton — choose one per loading zone.
 * - On error, set state to `"hidden"` immediately; let the error pattern take over.
 * - Does not block interaction; user can cancel or navigate away while bar is visible.
 */
const SlowNetworkBar = React.forwardRef<HTMLDivElement, SlowNetworkBarProps>(
  (
    {
      className,
      state = "hidden",
      label = "Loading, please wait…",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        data-slot="slow-network-bar"
        data-state={state}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-busy={state !== "hidden"}
        className={cn(
          styles.wrap,
          state === "visible" && styles.wrapVisible,
          state === "resolving" && styles.wrapResolving,
          className
        )}
        {...props}
      >
        <div
          data-slot="slow-network-bar-fill"
          className={cn(
            styles.fill,
            state === "visible" && styles.fillIndeterminate,
            state === "resolving" && styles.fillResolving
          )}
        />
      </div>
    )
  }
)
SlowNetworkBar.displayName = "SlowNetworkBar"

/**
 * useSlowRequest
 *
 * Hook that drives SlowNetworkBar state automatically. Starts a timer on mount;
 * if the request is still pending after `threshold` ms, the bar becomes visible.
 * Cleans up on unmount (component cancelled / navigated away).
 *
 * @param threshold — Milliseconds before the bar appears. Default 3000ms.
 * @returns `{ state, trigger, resolve, reset }` — call `trigger()` when the
 * request starts, `resolve()` when it completes (success or error), `reset()`
 * to return to hidden immediately.
 *
 * @example
 * ```tsx
 * const { state, trigger, resolve } = useSlowRequest(3000);
 *
 * const handleExport = async () => {
 *   trigger();
 *   try {
 *     await exportReport();
 *   } finally {
 *     resolve();
 *   }
 * };
 *
 * return (
 *   <>
 *     <SlowNetworkBar state={state} />
 *     <button onClick={handleExport}>Export</button>
 *   </>
 * );
 * ```
 */
function useSlowRequest(threshold = 3000) {
  const [state, setState] = React.useState<SlowNetworkBarState>("hidden")
  const thresholdRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const resolveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = React.useCallback(() => {
    if (thresholdRef.current !== null) {
      clearTimeout(thresholdRef.current)
      thresholdRef.current = null
    }
    if (resolveTimerRef.current !== null) {
      clearTimeout(resolveTimerRef.current)
      resolveTimerRef.current = null
    }
  }, [])

  const trigger = React.useCallback(() => {
    clearTimers()
    setState("hidden")
    thresholdRef.current = setTimeout(() => {
      setState("visible")
    }, threshold)
  }, [threshold, clearTimers])

  const resolve = React.useCallback(() => {
    clearTimers()
    setState((prev) => {
      if (prev === "visible") {
        // Complete the sweep animation then fade out
        resolveTimerRef.current = setTimeout(() => {
          setState("hidden")
        }, 800)
        return "resolving"
      }
      // Fast path: request resolved before threshold — never show bar
      return "hidden"
    })
  }, [clearTimers])

  const reset = React.useCallback(() => {
    clearTimers()
    setState("hidden")
  }, [clearTimers])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  return { state, trigger, resolve, reset }
}

export { SlowNetworkBar, useSlowRequest }
