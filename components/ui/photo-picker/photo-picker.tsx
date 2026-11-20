"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./photo-picker.module.css"

export interface PhotoPickerPhoto {
  /** Unique key, reported by `onValueChange`. */
  key: string
  /** The thumbnail's URL. */
  thumb: string
  /** The thumbnail's accessible name. Defaults to "Photo N". */
  label?: string
}

export interface PhotoPickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  photos: PhotoPickerPhoto[]
  /** The chosen photo's key, or null for none. */
  value?: string | null
  /** Called with a photo's key when it is pressed. */
  onValueChange?: (key: string) => void
  /**
   * The draw wave plays when the grid mounts and every time `play` changes,
   * except to `false`. Pass the menu's open state, or a counter you bump.
   */
  play?: boolean | number
  /** Thumbnails load only once this has been true. Pass the menu's open state to wait for the first open. */
  load?: boolean
}

// Each thumbnail rises on its own beat, a wave from the top left: its row plus its
// place in the row, by where it sits on screen now. Capped so a long grid doesn't drag.
const BEAT_CAP = 12

function drawWave(items: HTMLElement[]) {
  const rects = items.map((x) => x.getBoundingClientRect())
  const tops = rects.map((r) => Math.round(r.top))
  const rows = [...new Set(tops)].sort((a, b) => a - b)
  items.forEach((x, i) => {
    const col = rects.filter((r, j) => tops[j] === tops[i] && r.left < rects[i].left).length
    x.style.setProperty("--draw-i", String(Math.min(rows.indexOf(tops[i]) + col, BEAT_CAP)))
    x.classList.remove(styles.drawing)
  })
  void items[0]?.offsetWidth // one reflow, so every animation restarts
  items.forEach((x) => {
    x.classList.add(styles.drawing)
    const done = (e: AnimationEvent) => {
      if (e.target !== x) return
      x.classList.remove(styles.drawing)
      x.removeEventListener("animationend", done)
    }
    x.addEventListener("animationend", done)
  })
}

/** A grid of photo thumbnails, one chosen. The consumer supplies the popover or panel it sits in. */
const PhotoPicker = React.forwardRef<HTMLDivElement, PhotoPickerProps>(
  ({ photos, value = null, onValueChange, play, load = true, className, ...props }, ref) => {
    const gridRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(ref, () => gridRef.current as HTMLDivElement)

    // Once loaded, stay loaded: closing the menu must not blank the thumbnails.
    const [loaded, setLoaded] = React.useState(load)
    if (load && !loaded) setLoaded(true)

    React.useEffect(() => {
      const grid = gridRef.current
      if (play === false || !grid) return
      const raf = requestAnimationFrame(() => drawWave([...grid.children] as HTMLElement[]))
      return () => cancelAnimationFrame(raf)
    }, [play])

    return (
      <div ref={gridRef} role="group" data-slot="photo-picker" className={cn(styles.root, className)} {...props}>
        {photos.map((photo, i) => (
          <button
            key={photo.key}
            type="button"
            className={styles.thumb}
            aria-pressed={photo.key === value}
            aria-label={photo.label ?? `Photo ${i + 1}`}
            onClick={() => onValueChange?.(photo.key)}
          >
            <img src={loaded ? photo.thumb : undefined} alt="" />
          </button>
        ))}
      </div>
    )
  }
)
PhotoPicker.displayName = "PhotoPicker"

export { PhotoPicker }
