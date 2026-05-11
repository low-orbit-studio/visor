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
 * Layout is two stacked bands sharing the same N-column grid:
 *  - `.dotsBand` holds the per-station num + dot pair and the animated rail.
 *    The rail is positioned `bottom: dot-size/2` from the band so it threads
 *    through the dots' vertical centers regardless of font metrics.
 *  - `.labelsBand` is the canonical `<ol>` exposing titles and descriptions
 *    to assistive tech (the dotsBand is decorative, marked aria-hidden).
 *
 * Animation is triggered by the `inView` class on the root:
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
        {/* Decorative band: nums, dots, and the animated rail. */}
        <div className={styles.dotsBand} aria-hidden="true">
          <div className={styles.dotsRow}>
            {stations.map((station, idx) => (
              <div
                key={station.num}
                className={styles.dotCell}
                style={{ "--idx": idx } as React.CSSProperties}
              >
                <span className={styles.num}>{station.num}</span>
                <span className={styles.dot} />
              </div>
            ))}
          </div>
          <div className={styles.rail} aria-hidden="true">
            <div className={styles.railLine} />
          </div>
        </div>

        {/* Accessible ordered list — titles and descriptions. */}
        <ol className={styles.labelsBand} aria-label="Process stages">
          {stations.map((station, idx) => (
            <li
              key={station.num}
              className={styles.labelCell}
              style={{ "--idx": idx } as React.CSSProperties}
            >
              <span className={styles.title}>{station.title}</span>
              {station.description ? (
                <span className={styles.description}>{station.description}</span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    )
  }
)
StationSpectrum.displayName = "StationSpectrum"

export { StationSpectrum }
