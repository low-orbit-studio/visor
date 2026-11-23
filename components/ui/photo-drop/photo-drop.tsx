"use client"

import * as React from "react"
import { ArrowClockwise, Camera, Lock, Plus, X } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./photo-drop.module.css"

/**
 * A superellipse (|x|^n + |y|^n = 1) of side `size`, inset by `inset` on every edge, as SVG path data.
 * n = 2 is a circle; ~5 is the soft-cornered squircle; higher squares it off.
 */
export function squircle(size: number, n: number, inset = 0): string {
  const r = size / 2 - inset
  const c = size / 2
  const points: string[] = []
  for (let i = 0; i < 160; i++) {
    const t = (i / 160) * Math.PI * 2
    const cos = Math.cos(t)
    const sin = Math.sin(t)
    const x = c + Math.sign(cos) * Math.abs(cos) ** (2 / n) * r
    const y = c + Math.sign(sin) * Math.abs(sin) ** (2 / n) * r
    points.push(`${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return `M${points.join("L")}Z`
}

/** Squircle exponent: the kit's soft corners. VI-796's `corners: squircle` carries no exponent, so the tile keeps 5. */
export const PHOTO_DROP_CURVE = 5
/** The edge's stroke, in px (`--stroke-width-regular`): the edge is inset by half of it so the clip doesn't cut it. */
const BORDER = 1.5
/** A photo tile's side, in px (FormDeck and the Backstage sheet). */
const SIZE = 220
/** A file's tile is smaller: it holds an icon, not a face. */
const FILE_SIZE = 128

export interface PhotoDropFile {
  /** The icon the tile shows. */
  icon: React.ReactNode
  /** The input's `accept`. */
  accept?: string
  /** Called with the picked file. */
  onFile: (file: File) => void
  /** Remove: clears the picked file. */
  onClear: () => void
}

export interface PhotoDropProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "id" | "onChange"> {
  /** The file input's id, for a `<label htmlFor>`. */
  id: string
  /** The picked photo's URL (in file mode, the file's name), or empty. */
  src: string
  /** Called with a preview object URL and the picked File. */
  onPick?: (url: string, file: File) => void
  invalid?: boolean
  /** Ids of more text describing the input (a field's hint or error). */
  describedBy?: string
  required?: boolean
  /** File mode: the tile shows this icon, and the picked file's name sits beside it. */
  file?: PhotoDropFile
  /** Side of the tile, in px. Defaults to 220, or 128 in file mode. */
  size?: number
  /** Uploading: 0 to 1, drawn as a ring along the edge, or "indeterminate" for a sweeping arc. */
  progress?: number | "indeterminate"
  /** The upload stopped. Try Again calls onRetry; a tap still picks a new one. */
  failed?: boolean
  onRetry?: () => void
  /** Locked: the photo or file shows with a lock and no way to change it. */
  locked?: boolean
  /** Why it is locked, shown under "Locked". */
  lockedReason?: React.ReactNode
  /** Read-only: the photo or file only, with no hint and no way to change it. */
  readOnly?: boolean
  /** Read-only with a note: shown under "Read-Only", e.g. why it can't be changed. Without it, read-only shows no caption. */
  readOnlyReason?: React.ReactNode
  /** The photo's alt text. */
  alt?: string
}

/**
 * A squircle drop tile for one photo or file: an empty tile (dashed edge, + in the middle) until a
 * photo lands, then the photo in the same shape. Hovering, focusing or dragging a file over it wakes
 * the edge into marching ants. The real file input covers it, so click, drop and keyboard all go
 * through the browser's own picker. Uploading draws a ring along the edge; failed offers Try Again;
 * locked and read-only show the photo with no input.
 */
export const PhotoDrop = React.forwardRef<HTMLDivElement, PhotoDropProps>(function PhotoDrop(
  {
    id,
    src,
    onPick,
    invalid,
    describedBy,
    required,
    file,
    size: sizeProp,
    progress,
    failed,
    onRetry,
    locked,
    lockedReason,
    readOnly,
    readOnlyReason,
    alt,
    className,
    onFocus,
    onBlur,
    ...props
  },
  ref
) {
  const [drag, setDrag] = React.useState(false)
  const hintId = React.useId()
  const size = sizeProp ?? (file ? FILE_SIZE : SIZE)
  const shape = React.useMemo(
    () => ({ clip: squircle(size, PHOTO_DROP_CURVE), edge: squircle(size, PHOTO_DROP_CURVE, BORDER / 2) }),
    [size]
  )
  const uploading = progress !== undefined && !failed
  const indeterminate = progress === "indeterminate"
  const percent = indeterminate ? 0 : Math.round(Math.min(1, Math.max(0, progress ?? 0)) * 100)
  // Nothing to pick while it uploads, is locked or is read-only: no input, so nothing inside takes focus.
  const pickable = !uploading && !locked && !readOnly
  const quiet = locked || readOnly
  const zoneRef = React.useRef<HTMLDivElement>(null)
  // Whether focus is in the row. React drops the blur a removed node fires, so this outlives an unmount.
  const focusInside = React.useRef(false)

  // A state change can unmount the focused input, Try Again or Remove: keep focus in the tile, on the
  // input when there is one (no input means the zone is tabIndex -1), so a keyboard user doesn't
  // fall back to the top of the page.
  React.useLayoutEffect(() => {
    const zone = zoneRef.current
    if (!focusInside.current || !zone) return
    const active = document.activeElement
    if (active && active !== zone && zone.parentElement?.contains(active)) return
    const target = zone.querySelector("input") ?? zone
    if (target !== active) target.focus()
  }, [pickable, failed, src])

  const badge = locked ? (
    <span className={styles.badge} data-slot="photo-drop-lock">
      <Lock weight="bold" aria-hidden="true" />
    </span>
  ) : uploading || failed ? (
    indeterminate ? null : (
      // The percentage, or a retry mark, on a small pill in the middle.
      <span className={styles.status} aria-hidden="true">
        {failed ? <ArrowClockwise weight="bold" /> : `${percent}%`}
      </span>
    )
  ) : src && !file && !readOnly ? (
    <span className={cn(styles.badge, styles.change)} aria-hidden="true">
      <Camera weight="bold" />
    </span>
  ) : null

  return (
    <div
      ref={ref}
      className={cn(styles.row, className)}
      data-slot="photo-drop"
      onFocus={(e) => {
        focusInside.current = true
        onFocus?.(e)
      }}
      onBlur={(e) => {
        focusInside.current = e.currentTarget.contains(e.relatedTarget)
        onBlur?.(e)
      }}
      {...props}
    >
      <div
        ref={zoneRef}
        className={styles.zone}
        // Not in the Tab order; only a place to hold focus while there is no input.
        tabIndex={pickable ? undefined : -1}
        style={{ width: size, height: size, ["--clip" as string]: `path("${shape.clip}")` }}
        data-filled={src ? "" : undefined}
        data-drag={drag ? "" : undefined}
        data-invalid={invalid ? "" : undefined}
        data-status={uploading ? "uploading" : failed ? "failed" : undefined}
        data-locked={locked ? "" : undefined}
        data-readonly={readOnly && !locked ? "" : undefined}
        {...(uploading
          ? {
              role: "progressbar",
              "aria-label": "Uploading",
              "aria-valuemin": 0,
              "aria-valuemax": 100,
              "aria-valuenow": indeterminate ? undefined : percent,
              "aria-describedby": hintId,
            }
          : {})}
        {...(pickable
          ? {
              onDragEnter: () => setDrag(true),
              onDragLeave: () => setDrag(false),
              onDrop: () => setDrag(false),
            }
          : {})}
      >
        {file ? (
          <span className={styles.icon} aria-hidden="true">
            {file.icon}
          </span>
        ) : src ? (
          // A plain img: the source is a local object URL or the consumer's own URL.
          <img src={src} alt={alt ?? ""} className={styles.photo} />
        ) : quiet ? null : (
          <Plus weight="light" aria-hidden="true" className={styles.plus} data-slot="photo-drop-plus" />
        )}
        {badge}
        <svg className={styles.edge} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <path d={shape.edge} className={styles.ants} />
          {uploading ? (
            <path
              d={shape.edge}
              pathLength={100}
              className={styles.ring}
              data-indeterminate={indeterminate ? "" : undefined}
              style={indeterminate ? undefined : { strokeDashoffset: 100 - percent }}
            />
          ) : null}
        </svg>
        {pickable ? (
          <input
            id={id}
            type="file"
            accept={file ? file.accept : "image/*"}
            className={styles.input}
            onChange={(e) => {
              const picked = e.target.files?.[0]
              e.target.value = ""
              setDrag(false)
              if (!picked) return
              if (file) file.onFile(picked)
              // The object URL is a local preview; the consumer uploads the File.
              else onPick?.(URL.createObjectURL(picked), picked)
            }}
            aria-invalid={invalid || undefined}
            aria-describedby={[hintId, describedBy].filter(Boolean).join(" ")}
            aria-required={required || undefined}
          />
        ) : null}
      </div>
      {readOnly && !locked && !(file && src) && !readOnlyReason ? null : (
        <p className={styles.hint} id={hintId}>
          {uploading ? (
            <>
              <span className={styles.lead}>{file ? src : "Uploading your photo"}</span>
              <span role="status">
                {indeterminate ? "Uploading." : `Uploading, ${percent}%.`} Keep this page open.
              </span>
            </>
          ) : failed ? (
            <>
              <span className={styles.lead}>{file ? src : "Your photo didn't upload"}</span>
              <span role="status">{file ? "It didn't upload. " : ""}Check your connection, then try again.</span>
              <button type="button" className={styles.action} onClick={onRetry}>
                <ArrowClockwise weight="bold" aria-hidden="true" /> Try Again
              </button>
            </>
          ) : locked ? (
            <>
              <span className={styles.lead}>Locked</span>
              {file && src ? <span>{src}</span> : null}
              {lockedReason ? <span>{lockedReason}</span> : null}
            </>
          ) : readOnly && readOnlyReason ? (
            <>
              <span className={styles.lead}>Read-Only</span>
              {file && src ? <span>{src}</span> : null}
              <span>{readOnlyReason}</span>
            </>
          ) : readOnly ? (
            <span className={styles.lead}>{src}</span>
          ) : (
            <>
              <span className={styles.lead}>{file ? src || "Choose a file" : src ? "Change photo" : "Choose a photo"}</span>
              <span>{src ? "Tap it, or drop a new one on it" : "or drop it here"}</span>
            </>
          )}
          {file && src && pickable && !failed ? (
            <button type="button" className={styles.action} onClick={file.onClear}>
              <X weight="bold" aria-hidden="true" /> Remove
            </button>
          ) : null}
        </p>
      )}
    </div>
  )
})
