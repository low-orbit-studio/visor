"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./station-spectrum.module.css"

export interface Station {
  /** Numeric label displayed above the dot, e.g. "01". */
  num: string
  /** Station title displayed below the rail. */
  title: string
  /** Optional description text shown beneath the title. */
  description?: string
}

export interface StationSpectrumProps extends React.HTMLAttributes<HTMLElement> {
  /** Array of stations to render. Minimum 2 recommended. */
  stations: Station[]
  /**
   * Visual density of the diagram.
   * `compact` reduces horizontal spacing for tighter layouts.
   * @default "default"
   */
  density?: "compact" | "default"
  /**
   * When true, the animation is active (rail draws, dots illuminate).
   * Pass explicitly to control the trigger from outside the component.
   * Ignored when `autoTrigger` is true.
   */
  inView?: boolean
  /**
   * When true (default), the component auto-wires an IntersectionObserver
   * to trigger the animation when the element enters the viewport.
   * Set to false to control the trigger manually via the `inView` prop.
   * @default true
   */
  autoTrigger?: boolean
}

/**
 * StationSpectrum — animated N-station progress diagram.
 *
 * Renders a hairline horizontal rail with numbered dots and station labels.
 * The rail draws left-to-right via `transform: scaleX()` and dots illuminate
 * sequentially via per-dot CSS transition delays.
 *
 * Animation is triggered by the `inView` CSS module class on the root:
 *  - `autoTrigger=true` (default): wired via IntersectionObserver
 *  - `autoTrigger=false`: driven by the `inView` prop
 *
 * prefers-reduced-motion: animation is disabled; rail and dots appear
 * at their final state instantly.
 */
const StationSpectrum = React.forwardRef<HTMLElement, StationSpectrumProps>(
  (
    {
      className,
      stations,
      density = "default",
      inView,
      autoTrigger = true,
      ...props
    },
    forwardedRef
  ) => {
    const innerRef = React.useRef<HTMLElement | null>(null)
    const [autoInView, setAutoInView] = React.useState(false)

    // Merge forwardedRef with innerRef so we can both expose it and use it internally
    const setRef = React.useCallback(
      (node: HTMLElement | null) => {
        innerRef.current = node
        if (typeof forwardedRef === "function") {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [forwardedRef]
    )

    // Auto-trigger via IntersectionObserver when autoTrigger=true
    React.useEffect(() => {
      if (!autoTrigger) return
      const element = innerRef.current
      if (!element || typeof IntersectionObserver === "undefined") return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setAutoInView(true)
            observer.disconnect()
          }
        },
        { threshold: 0.3 }
      )

      observer.observe(element)
      return () => observer.disconnect()
    }, [autoTrigger])

    // Determine whether the animation should be active
    const isActive = autoTrigger ? autoInView : (inView ?? false)

    const { style: userStyle, ...restProps } = props
    return (
      <section
        ref={setRef}
        data-slot="station-spectrum"
        data-density={density}
        className={cn(styles.base, isActive && styles.inView, className)}
        style={{
          ...(userStyle ?? {}),
          "--station-count": stations.length,
        } as React.CSSProperties}
        {...restProps}
      >
        {/* Accessible ordered list — primary semantic structure */}
        <ol
          className={styles.stationList}
          aria-label="Process stages"
        >
          {stations.map((station, idx) => (
            <li
              key={station.num}
              className={styles.station}
              style={{ "--idx": idx } as React.CSSProperties}
            >
              <div className={styles.dotRow} aria-hidden="true">
                <span className={styles.num}>{station.num}</span>
                <span className={styles.dot} />
              </div>
              <div className={styles.label}>
                <span className={styles.title}>{station.title}</span>
                {station.description ? (
                  <span className={styles.description}>{station.description}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        {/* Hairline rail — decorative, positioned behind dots */}
        <div className={styles.rail} aria-hidden="true">
          <div className={styles.railLine} />
        </div>
      </section>
    )
  }
)
StationSpectrum.displayName = "StationSpectrum"

export { StationSpectrum }
