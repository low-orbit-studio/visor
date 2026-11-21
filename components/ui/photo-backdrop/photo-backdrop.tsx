"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./photo-backdrop.module.css"

/** A photo, or a flat colour. `focal` is the point to keep in frame, as [x, y] from 0 to 1. */
export type PhotoBackdropSource =
  | { kind: "photo"; src: string; focal?: [number, number] }
  | { kind: "solid"; color: string }

export interface PhotoBackdropProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Every background the page can show, by key. */
  backgrounds: Record<string, PhotoBackdropSource>
  /** The background on screen. Null, undefined or a missing key renders nothing. */
  current: string | null | undefined
  /** Every other background, nearest first. Fetched one at a time, at low priority, once the current photo has loaded. */
  upcoming?: string[]
  /** Builds a photo's `srcset` from its `src`. Without it the photo is a plain `src`. */
  srcSet?: (src: string) => string
  /** The `sizes` sent with a `srcSet`. */
  sizes?: string
}

type Sizing = { srcSet?: (src: string) => string; sizes: string }

const decoded = new Set<string>()
let queue: { src: string; sizing: Sizing }[] = []
let draining = false

/** Fetch and decode one photo at a time, at low priority, so a background never paints half-loaded mid-fade. */
async function drain() {
  if (draining) return
  draining = true
  for (let next = queue.shift(); next; next = queue.shift()) {
    const { src, sizing } = next
    if (decoded.has(src)) continue
    decoded.add(src)
    // The same srcset and sizes as the rendered <img>, so the browser picks the same file and it's a cache hit later.
    const img = new window.Image()
    img.fetchPriority = "low"
    if (sizing.srcSet) {
      img.sizes = sizing.sizes
      img.srcset = sizing.srcSet(src)
    }
    img.src = src
    await img.decode().catch(() => decoded.delete(src))
  }
  draining = false
}

/** The photo layers behind a surface: each new background fades in over the last, then the last goes. */
const PhotoBackdrop = React.forwardRef<HTMLDivElement, PhotoBackdropProps>(
  ({ backgrounds, current, upcoming = [], srcSet, sizes = "100vw", className, ...props }, ref) => {
    const shown = current && backgrounds[current] ? current : null

    // At most two layers: the one fading in on top, the one it covers. One state, changed only
    // by updaters: Next's React dropped a layer set during render when a cached photo's ref
    // marked it ready in the same commit, so Next Photo did nothing (VI-811).
    const [{ layers, ready }, setState] = React.useState<{ layers: string[]; ready: ReadonlySet<string> }>(() => ({
      layers: shown ? [shown] : [],
      ready: new Set(),
    }))
    React.useLayoutEffect(() => {
      setState((s) => {
        const top = s.layers[s.layers.length - 1]
        if (top === (shown ?? undefined)) return s
        if (!shown) return { ...s, layers: [] }
        // Cover the top layer if it has loaded, else the one under it, so a quick run of changes never shows a blank.
        const below = top && s.ready.has(top) ? top : s.layers[s.layers.length - 2]
        return {
          layers: [...(below && below !== shown ? [below] : []), shown],
          ready: new Set([...s.ready].filter((k) => k !== shown)),
        }
      })
    }, [shown])

    const markReady = React.useCallback((key: string) => {
      setState((s) => (s.ready.has(key) ? s : { ...s, ready: new Set(s.ready).add(key) }))
    }, [])

    // The photo on screen loads first, alone and at high priority; only then does the queue start.
    // Each change re-orders what's still waiting, so the next photo comes first.
    const topPhoto = React.useRef<HTMLImageElement>(null)
    const upcomingKey = upcoming.join("|")
    React.useEffect(() => {
      let live = true
      const img = topPhoto.current
      const shownPhoto = img && typeof img.decode === "function" ? img.decode() : Promise.resolve()
      shownPhoto
        .catch(() => {})
        .then(() => {
          if (!live) return
          queue = upcomingKey
            .split("|")
            .flatMap((key) => {
              const bg = backgrounds[key]
              return bg?.kind === "photo" ? [{ src: bg.src, sizing: { srcSet, sizes } }] : []
            })
          void drain()
        })
      return () => {
        live = false
      }
      // layers, not current: the ref points at the new top photo only once it has rendered.
    }, [backgrounds, layers, upcomingKey, srcSet, sizes])

    if (!shown) return null

    return (
      <div ref={ref} data-slot="photo-backdrop" aria-hidden="true" className={cn(styles.root, className)} {...props}>
        {layers.map((key, i) => {
          const bg = backgrounds[key]
          if (!bg) return null
          const top = i === layers.length - 1
          const isReady = bg.kind === "solid" || ready.has(key)
          return (
            <div
              key={key}
              data-slot="photo-backdrop-layer"
              data-ready={isReady ? "" : undefined}
              className={styles.layer}
              onAnimationEnd={(e) => {
                if (top && e.target === e.currentTarget) setState((s) => (s.layers.length > 1 ? { ...s, layers: [key] } : s))
              }}
            >
              {bg.kind === "photo" ? (
                <img
                  ref={(img) => {
                    if (top) topPhoto.current = img
                    // A photo that loaded before hydration fires no load event.
                    if (img?.complete && img.naturalWidth > 0) markReady(key)
                  }}
                  src={bg.src}
                  srcSet={srcSet?.(bg.src)}
                  sizes={srcSet ? sizes : undefined}
                  alt=""
                  fetchPriority={top ? "high" : "auto"}
                  className={styles.photo}
                  style={{ objectPosition: `${(bg.focal?.[0] ?? 0.5) * 100}% ${(bg.focal?.[1] ?? 0.5) * 100}%` }}
                  onLoad={() => markReady(key)}
                  onError={() => markReady(key)}
                />
              ) : (
                <div className={styles.photo} style={{ background: bg.color }} />
              )}
            </div>
          )
        })}
      </div>
    )
  }
)
PhotoBackdrop.displayName = "PhotoBackdrop"

export { PhotoBackdrop }
