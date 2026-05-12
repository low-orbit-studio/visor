"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./marquee.module.css"

export interface MarqueeBand {
  /** Items to display in this band. Rendered twice internally for seamless loop. */
  items: React.ReactNode[]
  /** Scroll direction. @default "left" */
  direction?: "left" | "right"
  /** Duration of one full scroll cycle in seconds. @default 40 */
  durationSec?: number
  /** Separator rendered between items. String or ReactNode. */
  separator?: React.ReactNode | string
}

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Multi-band configuration. When provided, `items`, `durationSec`, and
   * `separator` at the top level are ignored.
   */
  bands?: MarqueeBand[]
  /**
   * Single-band shorthand: items to display.
   * Used when `bands` is not provided.
   */
  items?: React.ReactNode[]
  /** Duration of one full scroll cycle in seconds. @default 40 */
  durationSec?: number
  /** Separator rendered between items. String or ReactNode. @default undefined */
  separator?: React.ReactNode | string
  /**
   * When true, scrolling pauses on hover.
   * @default true
   */
  pauseOnHover?: boolean
  /** Gap between items. Accepts any CSS gap value. @default "var(--spacing-6, 1.5rem)" */
  gap?: React.CSSProperties["gap"]
  /** Custom render function for each item. */
  renderItem?: (item: React.ReactNode, index: number) => React.ReactNode
  /** Custom render function for the separator. */
  renderSeparator?: (separator: React.ReactNode | string, index: number) => React.ReactNode
}

// ── Internal band renderer ──────────────────────────────────────────────────

interface BandProps {
  band: MarqueeBand
  pauseOnHover: boolean
  gap: React.CSSProperties["gap"]
  renderItem?: MarqueeProps["renderItem"]
  renderSeparator?: MarqueeProps["renderSeparator"]
  bandIndex: number
}

function MarqueeBandRenderer({
  band,
  pauseOnHover,
  gap,
  renderItem,
  renderSeparator,
  bandIndex,
}: BandProps) {
  const { items, direction = "left", durationSec = 40, separator } = band

  const animationDirection = direction === "right" ? "reverse" : "normal"

  const trackStyle: React.CSSProperties = {
    "--marquee-duration": `${durationSec}s`,
    "--marquee-gap": gap,
    animationDirection,
  } as React.CSSProperties

  function renderTrackItems(keyPrefix: string) {
    return items.map((item, idx) => {
      const itemNode = renderItem ? renderItem(item, idx) : item
      const hasSeparator = separator !== undefined && separator !== null && separator !== ""
      const separatorNode = hasSeparator
        ? renderSeparator
          ? renderSeparator(separator, idx)
          : <span className={styles.separator} aria-hidden="true">{separator}</span>
        : null

      return (
        <React.Fragment key={`${keyPrefix}-${idx}`}>
          <span className={styles.item}>{itemNode}</span>
          {hasSeparator && separatorNode}
        </React.Fragment>
      )
    })
  }

  return (
    <div
      className={cn(styles.band, pauseOnHover && styles.pauseOnHover)}
      data-slot="marquee-band"
      data-band-index={bandIndex}
      data-direction={direction}
    >
      {/* Track contains items twice for seamless loop — aria-hidden on the whole track */}
      <div
        className={styles.track}
        style={trackStyle}
        aria-hidden="true"
      >
        {/* First copy */}
        <div className={styles.set}>
          {renderTrackItems("a")}
        </div>
        {/* Second copy — creates the seamless loop illusion */}
        <div className={styles.set} aria-hidden="true">
          {renderTrackItems("b")}
        </div>
      </div>
    </div>
  )
}

// ── Marquee component ────────────────────────────────────────────────────────

/**
 * Marquee — a multi-band counter-flow infinite-scroll primitive.
 *
 * Renders one or more bands of items in a continuous animated scroll loop.
 * Per-band direction allows counter-flow patterns (e.g., "trusted by" strips).
 *
 * Animation is pure CSS keyframes. Direction reverses via `animation-direction: reverse`.
 * Pause-on-hover is applied via `:hover → animation-play-state: paused`.
 * prefers-reduced-motion: animation is disabled instantly.
 */
const Marquee = React.forwardRef<HTMLDivElement, MarqueeProps>(
  (
    {
      className,
      bands,
      items,
      durationSec = 40,
      separator,
      pauseOnHover = true,
      gap = "var(--spacing-6, 1.5rem)",
      renderItem,
      renderSeparator,
      ...props
    },
    ref
  ) => {
    // Normalise to band array for unified rendering
    const resolvedBands: MarqueeBand[] = bands ?? [
      {
        items: items ?? [],
        direction: "left",
        durationSec,
        separator,
      },
    ]

    // When an aria-label is provided, add role="region" so the landmark is valid.
    // A plain <div> with aria-label violates aria-prohibited-attr.
    const role = props["aria-label"] || props["aria-labelledby"] ? "region" : undefined

    return (
      <div
        ref={ref}
        data-slot="marquee"
        role={role}
        className={cn(styles.root, className)}
        {...props}
      >
        {resolvedBands.map((band, idx) => (
          <MarqueeBandRenderer
            key={idx}
            band={band}
            pauseOnHover={pauseOnHover}
            gap={gap}
            renderItem={renderItem}
            renderSeparator={renderSeparator}
            bandIndex={idx}
          />
        ))}
      </div>
    )
  }
)
Marquee.displayName = "Marquee"

export { Marquee }
