"use client"

import * as React from "react"
import {
  ArrowsLeftRightIcon,
  MagnifyingGlassPlusIcon,
  MapPinIcon,
} from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import { Button } from "../button/button"
import { SegmentedControl } from "../segmented-control/segmented-control"
import { computeDiff, paintMask, type DiffResult } from "./capture-diff"
import styles from "./before-after-compare.module.css"

/**
 * BeforeAfterCompare (VI-863): a general before/after capture pair, for review
 * surfaces like the approval inbox (PL-3452). Four modes (Side by Side, Swipe,
 * Flip, Diff), a shared crosshair and a synced 2.5× loupe, click-to-mark pins,
 * and phones drawn at their capture's CSS width in a concentric bezel.
 *
 * FidelityMirror stays the design-vs-built surface (live nodes and iframes,
 * a verdict and classed deltas); this component compares two image captures,
 * and the pixel engine lives in `capture-diff.ts`.
 */

// ─── types ─────────────────────────────────────────────────────────────────────

export type CompareMode = "side" | "swipe" | "flip" | "diff"

/** The viewport a capture was taken at. Width under 600 renders as a phone. */
export interface CaptureViewport {
  width: number
  height: number
  /** Device pixel ratio of the capture. Default 1. */
  dpr?: number
}

export interface CapturePair {
  /** Before capture URL. */
  before: string
  /** After capture URL. */
  after: string
  /** The pair's name, used in alt text and mark lines. */
  label: string
  viewport: CaptureViewport
}

/** A spot the reviewer clicked: 0–1 of the image (same spot on both sides), plus capture CSS pixels. */
export interface CompareMark {
  n: number
  x: number
  y: number
  px: { x: number; y: number }
}

export interface BeforeAfterCompareProps
  extends Omit<React.ComponentProps<"section">, "children"> {
  pair: CapturePair
  /** Controlled mode. */
  mode?: CompareMode
  /** Uncontrolled initial mode. Default `side`. */
  defaultMode?: CompareMode
  onModeChange?: (mode: CompareMode) => void
  /** Controlled marks. */
  marks?: CompareMark[]
  /** Uncontrolled initial marks. */
  defaultMarks?: CompareMark[]
  onMarksChange?: (marks: CompareMark[]) => void
  /** Initial loupe state. Default `false`. */
  defaultLoupe?: boolean
}

// ─── constants + helpers ───────────────────────────────────────────────────────

const MODES: { value: CompareMode; label: string; key: string }[] = [
  { value: "side", label: "Side by Side", key: "1" },
  { value: "swipe", label: "Swipe", key: "2" },
  { value: "flip", label: "Flip", key: "3" },
  { value: "diff", label: "Diff", key: "4" },
]

/** Modes where a click on the image drops a mark (Swipe drags, Flip flips). */
const MARKABLE: CompareMode[] = ["side", "diff"]

const LOUPE_ZOOM = 2.5

/** A capture narrower than this renders as a phone. */
export const isPhoneViewport = (vp: CaptureViewport) => vp.width < 600

/** How a mark reads in the note a session gets: `n. <label> at x X, y Y`. */
export const markLine = (m: CompareMark, label: string) =>
  `${m.n}. ${label} at x ${m.px.x}, y ${m.px.y}`

function useControllable<T>(value: T | undefined, initial: T, onChange?: (v: T) => void) {
  const [inner, setInner] = React.useState(initial)
  const current = value !== undefined ? value : inner
  const set = (next: T) => {
    if (value === undefined) setInner(next)
    onChange?.(next)
  }
  return [current, set] as const
}

// ─── pieces ────────────────────────────────────────────────────────────────────

function CompareTag({ side }: { side: "before" | "after" }) {
  return (
    <span className={styles.tag} data-side={side}>
      <span className={styles.tagDot} aria-hidden="true" />
      {side === "before" ? "Before" : "After"}
    </span>
  )
}

/** The frame: a rounded tile for desktop, a bezel for a phone. */
function CompareFrame({
  phone,
  width,
  markable,
  children,
}: {
  phone: boolean
  /** The capture's CSS width: a phone renders at it, never larger. */
  width: number
  markable?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={phone ? styles.device : styles.tile}
      style={{ "--bac-true-w": `${width}px` } as React.CSSProperties}
    >
      <div className={styles.screen} data-mark-surface={markable || undefined}>
        {children}
      </div>
    </div>
  )
}

function CompareShot({ src, alt, width }: { src: string; alt: string; width: number }) {
  return (
    <img
      data-shot=""
      className={styles.shot}
      src={src}
      alt={alt}
      width={width}
      draggable={false}
    />
  )
}

/** Crosshair and loupe over one image, driven by the stage's pointer variables. */
function CompareOverlay({ src, loupe }: { src: string; loupe: boolean }) {
  return (
    <div className={styles.overlay} aria-hidden="true">
      <span className={styles.crossV} />
      <span className={styles.crossH} />
      {loupe ? (
        <span
          className={styles.lens}
          style={{ backgroundImage: `url("${src}")`, "--bac-zoom": LOUPE_ZOOM } as React.CSSProperties}
        />
      ) : null}
    </div>
  )
}

function ComparePins({ marks, onRemove }: { marks: CompareMark[]; onRemove: (n: number) => void }) {
  return (
    <>
      {marks.map((m) => (
        <button
          key={m.n}
          type="button"
          data-mark=""
          className={styles.pin}
          style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
          onClick={(e) => {
            e.stopPropagation()
            onRemove(m.n)
          }}
          aria-label={`Mark ${m.n} at x ${m.px.x}, y ${m.px.y}. Remove.`}
          title="Remove mark"
        >
          {m.n}
        </button>
      ))}
    </>
  )
}

// ─── modes ─────────────────────────────────────────────────────────────────────

interface ModeProps {
  pair: CapturePair
  phone: boolean
  loupe: boolean
  pins: React.ReactNode
}

function CompareSideBySide({ pair, phone, loupe, pins }: ModeProps) {
  return (
    <div className={styles.side} data-phone={phone || undefined}>
      {(["before", "after"] as const).map((side) => (
        <figure key={side} className={styles.figure} data-side={side}>
          <figcaption className={styles.caption}>
            <CompareTag side={side} />
          </figcaption>
          <CompareFrame phone={phone} width={pair.viewport.width} markable>
            <CompareShot src={pair[side]} alt={`${pair.label}, ${side}`} width={pair.viewport.width} />
            <CompareOverlay src={pair[side]} loupe={loupe} />
            {pins}
          </CompareFrame>
        </figure>
      ))}
    </div>
  )
}

function CompareSwipe({ pair, phone }: Omit<ModeProps, "loupe" | "pins">) {
  const [pos, setPos] = React.useState(50)
  const ref = React.useRef<HTMLDivElement>(null)
  const dragging = React.useRef(false)
  const setFrom = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r || r.width === 0) return
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }
  return (
    <figure className={styles.single} data-phone={phone || undefined}>
      <figcaption className={styles.caption} data-split="">
        <CompareTag side="before" />
        <span className={styles.hint}>
          <ArrowsLeftRightIcon weight="bold" aria-hidden="true" /> Drag to compare
        </span>
        <CompareTag side="after" />
      </figcaption>
      <CompareFrame phone={phone} width={pair.viewport.width}>
        <div
          ref={ref}
          className={cn(styles.stack, styles.swipe)}
          onPointerDown={(e) => {
            dragging.current = true
            e.currentTarget.setPointerCapture?.(e.pointerId)
            setFrom(e.clientX)
          }}
          onPointerMove={(e) => dragging.current && setFrom(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          <CompareShot src={pair.before} alt={`${pair.label}, before`} width={pair.viewport.width} />
          <div className={styles.layer} style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
            <CompareShot src={pair.after} alt={`${pair.label}, after`} width={pair.viewport.width} />
          </div>
          <div
            className={styles.handle}
            style={{ left: `${pos}%` }}
            role="slider"
            tabIndex={0}
            aria-label="Divider between before and after"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 10 : 5
              if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - step))
              else if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + step))
              else if (e.key === "Home") setPos(0)
              else if (e.key === "End") setPos(100)
              else return
              e.preventDefault()
            }}
          >
            <span className={styles.knob}>
              <ArrowsLeftRightIcon weight="bold" aria-hidden="true" />
            </span>
          </div>
        </div>
      </CompareFrame>
    </figure>
  )
}

function CompareFlip({
  pair,
  phone,
  loupe,
  showing,
  onFlip,
}: Omit<ModeProps, "pins"> & { showing: "before" | "after"; onFlip: () => void }) {
  return (
    <figure className={styles.single} data-phone={phone || undefined}>
      <figcaption className={styles.caption}>
        <CompareTag side={showing} />
        <span className={styles.hint}>Click or press Space to flip</span>
      </figcaption>
      <CompareFrame phone={phone} width={pair.viewport.width}>
        {/* Both stay mounted so the flip is an instant blink: a fade would hide the change. */}
        <button
          type="button"
          className={cn(styles.stack, styles.flip)}
          onClick={onFlip}
          aria-label={`Showing ${showing}. Flip.`}
        >
          {(["before", "after"] as const).map((side) => (
            <span key={side} className={styles.layer} data-hidden={showing !== side || undefined}>
              <CompareShot src={pair[side]} alt={`${pair.label}, ${side}`} width={pair.viewport.width} />
            </span>
          ))}
        </button>
        <CompareOverlay src={pair[showing]} loupe={loupe} />
      </CompareFrame>
    </figure>
  )
}

function CompareDiff({ pair, phone, pins }: Omit<ModeProps, "loupe">) {
  const [r, setR] = React.useState<DiffResult | null>(null)
  const [failed, setFailed] = React.useState(false)
  const canvas = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(() => {
    let live = true
    setR(null)
    setFailed(false)
    computeDiff(pair.before, pair.after, pair.viewport.dpr ?? 1)
      .then((res) => live && setR(res))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [pair.before, pair.after, pair.viewport.dpr])
  React.useEffect(() => {
    if (r && canvas.current) paintMask(canvas.current, r, getComputedStyle(canvas.current).color)
  }, [r])

  const pct = r && r.mask.length ? (r.changed / r.mask.length) * 100 : 0
  return (
    <figure className={styles.single} data-phone={phone || undefined}>
      <figcaption className={styles.caption}>
        <CompareTag side="after" />
        <span className={styles.stat} role="status">
          {failed ? (
            "Couldn't compare these captures"
          ) : !r ? (
            "Comparing pixels…"
          ) : r.boxes.length === 0 ? (
            "Identical, pixel for pixel"
          ) : (
            <>
              <strong>
                {r.boxes.length} changed {r.boxes.length === 1 ? "region" : "regions"}
              </strong>
              <span className={styles.statDim}>
                {" "}
                · {pct < 0.01 ? "<0.01" : pct.toFixed(2)}% of pixels
                {r.heightDelta > 0 ? ` · heights differ by ${r.heightDelta}px` : ""}
              </span>
            </>
          )}
        </span>
      </figcaption>
      <CompareFrame phone={phone} width={pair.viewport.width} markable>
        <div className={styles.stack}>
          <span className={styles.diffBase}>
            <CompareShot
              src={pair.after}
              alt={`${pair.label}, after, with changes marked`}
              width={pair.viewport.width}
            />
          </span>
          <canvas
            ref={canvas}
            className={styles.diffMask}
            style={r ? { height: `${(r.height / r.fullHeight) * 100}%` } : undefined}
            aria-hidden="true"
          />
          {r?.boxes.map((b, i) => (
            <span
              key={i}
              className={styles.diffBox}
              data-slot="before-after-compare-diff-box"
              style={{
                left: `${b.x * 100}%`,
                top: `${b.y * 100}%`,
                width: `${b.w * 100}%`,
                height: `${b.h * 100}%`,
              }}
              aria-hidden="true"
            />
          ))}
        </div>
        <CompareOverlay src={pair.after} loupe={false} />
        {pins}
      </CompareFrame>
    </figure>
  )
}

// ─── BeforeAfterCompare ────────────────────────────────────────────────────────

const BeforeAfterCompare = React.forwardRef<HTMLElement, BeforeAfterCompareProps>(
  (
    {
      pair,
      mode: modeProp,
      defaultMode = "side",
      onModeChange,
      marks: marksProp,
      defaultMarks = [],
      onMarksChange,
      defaultLoupe = false,
      className,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const [mode, setMode] = useControllable(modeProp, defaultMode, onModeChange)
    const [marks, setMarks] = useControllable(marksProp, defaultMarks, onMarksChange)
    const [loupe, setLoupe] = React.useState(defaultLoupe)
    const [showing, setShowing] = React.useState<"before" | "after">("after")
    const flip = () => setShowing((v) => (v === "after" ? "before" : "after"))
    const phone = isPhoneViewport(pair.viewport)
    const vp = pair.viewport
    const markable = MARKABLE.includes(mode)

    const stageRef = React.useRef<HTMLDivElement>(null)
    const removeMark = (n: number) => {
      setMarks(marks.filter((m) => m.n !== n))
      // The pin unmounts; keep focus inside so the keys still work.
      stageRef.current?.focus({ preventScroll: true })
    }
    const pins = <ComparePins marks={marks} onRemove={removeMark} />

    return (
      <section
        ref={ref}
        data-slot="before-after-compare"
        data-mode={mode}
        data-phone={phone || undefined}
        aria-label={props["aria-label"] ?? `Before and after: ${pair.label}`}
        className={cn(styles.root, className)}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          const t = e.target as HTMLElement
          if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
          if (t.closest("input, textarea, [contenteditable='true']")) return
          const m = MODES.find((it) => it.key === e.key)
          if (m) {
            setMode(m.value)
            // The focused control may belong to the old mode and unmount.
            stageRef.current?.focus({ preventScroll: true })
          }
          else if (e.key === "z" || e.key === "Z") setLoupe((v) => !v)
          else if (e.key === " " && mode === "flip" && !t.closest("button")) flip()
          else return
          e.preventDefault()
        }}
        {...props}
      >
        <div className={styles.bar}>
          <span className={styles.meta}>
            {vp.width} × {vp.height}
            <span className={styles.statDim}> @{vp.dpr ?? 1}x</span>
          </span>
          <span className={styles.spacer} aria-hidden="true" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-pressed={loupe}
            aria-label="Loupe (Z)"
            title="Loupe (Z)"
            data-slot="before-after-compare-loupe"
            onClick={() => setLoupe((v) => !v)}
          >
            <MagnifyingGlassPlusIcon weight="bold" aria-hidden="true" />
          </Button>
          <SegmentedControl
            size="sm"
            aria-label={`Compare mode for ${pair.label}`}
            value={mode}
            onValueChange={(v) => setMode(v as CompareMode)}
            options={MODES.map((m) => ({ value: m.value, label: m.label }))}
          />
        </div>

        {/* The stage owns the shared pointer, written as CSS variables so a move never re-renders. */}
        <div
          ref={stageRef}
          className={styles.stage}
          tabIndex={-1}
          data-markable={markable || undefined}
          onPointerMove={(e) => {
            const img = (e.target as HTMLElement).closest<HTMLElement>("[data-shot], [data-mark-surface]")
            const stage = e.currentTarget
            if (!img) return stage.removeAttribute("data-pointer")
            const r = img.getBoundingClientRect()
            stage.style.setProperty("--bac-x", `${e.clientX - r.left}px`)
            stage.style.setProperty("--bac-y", `${e.clientY - r.top}px`)
            stage.style.setProperty("--bac-w", `${r.width}px`)
            stage.setAttribute("data-pointer", "")
          }}
          onPointerLeave={(e) => e.currentTarget.removeAttribute("data-pointer")}
          onClick={(e) => {
            if (!markable) return
            const t = e.target as HTMLElement
            const el = t.closest<HTMLElement>("[data-mark-surface]")
            if (!el || t.closest("[data-mark]")) return
            const r = el.getBoundingClientRect()
            if (r.width === 0 || r.height === 0) return
            const x = (e.clientX - r.left) / r.width
            const y = (e.clientY - r.top) / r.height
            const n = marks.reduce((max, m) => Math.max(max, m.n), 0) + 1
            // Rendered px → capture CSS px (a full-page capture is taller than its viewport).
            const cssPerPx = vp.width / r.width
            setMarks([
              ...marks,
              {
                n,
                x,
                y,
                px: { x: Math.round(x * vp.width), y: Math.round(y * r.height * cssPerPx) },
              },
            ])
          }}
        >
          {mode === "side" && <CompareSideBySide pair={pair} phone={phone} loupe={loupe} pins={pins} />}
          {mode === "swipe" && <CompareSwipe pair={pair} phone={phone} />}
          {mode === "flip" && (
            <CompareFlip pair={pair} phone={phone} loupe={loupe} showing={showing} onFlip={flip} />
          )}
          {mode === "diff" && <CompareDiff pair={pair} phone={phone} pins={pins} />}
        </div>

        <p className={styles.keys} aria-hidden="true">
          {markable ? (
            <span className={styles.keyItem}>
              <MapPinIcon weight="bold" /> Click to mark a spot
            </span>
          ) : null}
          <span className={styles.keyItem}>
            <kbd className={styles.kbd}>1</kbd>–<kbd className={styles.kbd}>4</kbd> mode
          </span>
          <span className={styles.keyItem}>
            <kbd className={styles.kbd}>Z</kbd> loupe
          </span>
          {mode === "flip" ? (
            <span className={styles.keyItem}>
              <kbd className={styles.kbd}>Space</kbd> flip
            </span>
          ) : null}
        </p>
      </section>
    )
  }
)
BeforeAfterCompare.displayName = "BeforeAfterCompare"

export { BeforeAfterCompare }
