"use client"

import * as React from "react"
import {
  ColumnsIcon,
  SquareHalfIcon,
  DeviceMobileIcon,
  BrowserIcon,
  ArrowsHorizontalIcon,
} from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./fidelity-mirror.module.css"

/**
 * FidelityMirror (VI-610) — the design-left / built-right comparison surface.
 *
 * PL-2139 shipped the fidelity GATE (screenshot-diff verification). This is the
 * fidelity DISPLAY: the side-by-side viewer that renders the Fidelity Mirror doc
 * type inside DocFrame's content. Gate VERIFIES; component DISPLAYS.
 *
 * REAL compare semantics (operator refinement): the LEFT pane is the *pure HTML
 * design* source, the RIGHT pane is the *Visor-ified TSX* render — never a
 * synthetically recolored side. The scope-dot hues carry SOURCE identity
 * (`--info` for the design, `--accent` for the built render), not decoration.
 *
 * The compare goes full-bleed on widescreen (`bleed`, default on) so each pane
 * is ~50vw with the center gutter equal to the outer padding. Under 768px the
 * panes stack design-over-built — never a sideways scroll strip.
 */

// ─── types ─────────────────────────────────────────────────────────────────────

/** The platform of the built surface — drives the built-side renderer + chip. */
export type FidelityPlatform = "web" | "native" | "flutter" | "external"

/** Compare presentation: `split` (design-left / built-right) or `overlay` (slider). */
export type FidelityCompareMode = "split" | "overlay"

/** The diff indicator's verdict — tints the status pill. */
export type FidelityVerdict = "match" | "drift" | "fail"

/** The drift class a delta belongs to — classes the legend tag. */
export type FidelityDeltaClass = "radius" | "color" | "spacing" | "type" | "align"

/** A single enumerated drift — a numbered callout on the built side + a legend row. */
export interface FidelityDelta {
  /** The drift class (mirrors the render-vs-design self-check taxonomy). */
  class: FidelityDeltaClass
  /** Short legend tag (defaults to the title-cased `class`). */
  label?: string
  /** The legend row copy (any node — supports inline `<b>`/`<code>`). */
  description: React.ReactNode
  /** Callout position over the built pane, as CSS inset values. Omit → no marker. */
  position?: { top?: string; left?: string; right?: string; bottom?: string }
}

/**
 * A captured surface for one side of the compare. `content` (an arbitrary node)
 * wins when present; otherwise the side renders from `src` per `kind` — an
 * `<img>` (image), or a live-route / external `<iframe>`.
 */
export interface FidelitySource {
  /** Renderer. Defaults by platform: web → route, external → external, else image. */
  kind?: "image" | "route" | "external" | "node"
  /** Image URL or iframe src. */
  src?: string
  /** Alt text (image) / iframe title (route/external). */
  title?: string
  /** Arbitrary rendered content — wins over `src` when present. */
  content?: React.ReactNode
  /** Pane label override (defaults per side + platform). */
  label?: string
  /** Right-aligned pane meta (mono) — e.g. `index.html`, `route · /doc-nav`. */
  meta?: string
}

export interface FidelityMirrorProps
  extends Omit<React.ComponentProps<"section">, "title"> {
  /** The compared surface's name — the header title (e.g. a component/screen). */
  title: string
  /** Header subtitle under the title (e.g. `Fidelity Mirror · VI-611`). */
  subtitle?: string
  /** Platform of the built surface. Default `web`. */
  platform?: FidelityPlatform
  /** The DESIGN source — the pure-HTML design (left pane). */
  design: FidelitySource
  /** The BUILT source — the Visor-TSX render (right pane). */
  built: FidelitySource
  /** Initial compare mode. Default `split`. The header toggle switches in place. */
  mode?: FidelityCompareMode
  /** The diff verdict — the status pill. */
  verdict: FidelityVerdict
  /** Optional score/summary string on the pill (e.g. `99.4%`, `3 deltas`). */
  score?: string
  /** Enumerated drifts — numbered callouts + the classed legend. Omit → none. */
  deltas?: FidelityDelta[]
  /** Widescreen full-bleed layout (panes ~50vw). Default `true`. */
  bleed?: boolean
  /** Initial overlay reveal position, 0–100. Default `55`. */
  overlayPosition?: number
  /** Notified when the compare mode toggles. */
  onModeChange?: (mode: FidelityCompareMode) => void
}

// ─── constants ─────────────────────────────────────────────────────────────────

const DELTA_LABELS: Record<FidelityDeltaClass, string> = {
  radius: "Radius",
  color: "Color",
  spacing: "Spacing",
  type: "Type",
  align: "Align",
}

// ─── helpers ───────────────────────────────────────────────────────────────────

/** The default renderer kind for a side, given the platform. */
function defaultKind(platform: FidelityPlatform): FidelitySource["kind"] {
  if (platform === "web") return "route"
  if (platform === "external") return "external"
  return "image"
}

/** Whether a platform frames its captures in a device bezel. */
function isDeviceFramed(platform: FidelityPlatform): boolean {
  return platform === "native" || platform === "flutter"
}

/** Default pane label for a side, honoring the web HTML/TSX source identity. */
function defaultLabel(
  side: "design" | "built",
  platform: FidelityPlatform
): string {
  if (platform === "web") {
    return side === "design" ? "Design · HTML" : "Built · Visor TSX"
  }
  return side === "design" ? "Design" : "Built"
}

/** Overlay ribbon label — the web ribbons read "HTML Design" / "Visor TSX". */
function ribbonLabel(
  side: "design" | "built",
  platform: FidelityPlatform
): string {
  if (platform === "web") {
    return side === "design" ? "HTML Design" : "Visor TSX"
  }
  return side === "design" ? "Design" : "Built"
}

// ─── capture renderer ──────────────────────────────────────────────────────────

function Capture({
  source,
  platform,
}: {
  source: FidelitySource
  platform: FidelityPlatform
}) {
  const framed = isDeviceFramed(platform)
  const kind = source.content ? "node" : source.kind ?? defaultKind(platform)

  let media: React.ReactNode
  if (kind === "node" || source.content) {
    media = source.content
  } else if (kind === "image") {
    media = (
      <img className={styles.media} src={source.src} alt={source.title ?? ""} />
    )
  } else {
    // route | external → a live iframe of the built/design surface.
    media = (
      <iframe
        className={styles.media}
        src={source.src}
        title={source.title ?? "Captured surface"}
        loading="lazy"
      />
    )
  }

  return framed ? <div className={styles.bezel}>{media}</div> : <>{media}</>
}

// ─── FidelityMirror ────────────────────────────────────────────────────────────

const FidelityMirror = React.forwardRef<HTMLElement, FidelityMirrorProps>(
  (
    {
      title,
      subtitle,
      platform = "web",
      design,
      built,
      mode = "split",
      verdict,
      score,
      deltas,
      bleed = true,
      overlayPosition = 55,
      onModeChange,
      className,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const [activeMode, setActiveMode] = React.useState<FidelityCompareMode>(mode)
    const [split, setSplit] = React.useState<number>(overlayPosition)

    const setMode = (next: FidelityCompareMode) => {
      setActiveMode(next)
      onModeChange?.(next)
    }

    const hasDeltas = Array.isArray(deltas) && deltas.length > 0
    const designLabel = design.label ?? defaultLabel("design", platform)
    const builtLabel = built.label ?? defaultLabel("built", platform)

    return (
      <section
        ref={ref}
        data-slot="fidelity-mirror"
        data-platform={platform}
        data-mode={activeMode}
        data-verdict={verdict}
        aria-label={ariaLabel ?? `Fidelity comparison: ${title}`}
        className={cn(styles.root, bleed && styles.bleed, className)}
        {...props}
      >
        {/* ── Header bar ── */}
        <div className={styles.bar}>
          <span className={styles.titleWrap}>
            <span className={styles.title}>{title}</span>
            {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
          </span>

          <PlatformChip platform={platform} />

          <span className={styles.spacer} aria-hidden="true" />

          <span className={styles.status} data-verdict={verdict}>
            <span className={styles.statusGlyph} aria-hidden="true" />
            {verdict}
            {score ? <span className={styles.score}>· {score}</span> : null}
          </span>

          <div className={styles.seg} role="group" aria-label="Compare mode">
            <button
              type="button"
              className={styles.segBtn}
              data-slot="fidelity-mirror-split"
              aria-pressed={activeMode === "split"}
              onClick={() => setMode("split")}
            >
              <ColumnsIcon
                className={styles.segIcon}
                weight="bold"
                aria-hidden="true"
              />
              Split
            </button>
            <button
              type="button"
              className={styles.segBtn}
              data-slot="fidelity-mirror-overlay"
              aria-pressed={activeMode === "overlay"}
              onClick={() => setMode("overlay")}
            >
              <SquareHalfIcon
                className={styles.segIcon}
                weight="bold"
                aria-hidden="true"
              />
              Overlay
            </button>
          </div>
        </div>

        {/* ── Body: split panes or overlay slider ── */}
        {activeMode === "split" ? (
          <div className={styles.panes} data-slot="fidelity-mirror-panes">
            <div className={styles.pane} data-side="design">
              <span className={styles.paneLabel}>
                <span className={styles.scopeDot} aria-hidden="true" />
                {designLabel}
                {design.meta ? (
                  <span className={styles.paneMeta}>{design.meta}</span>
                ) : null}
              </span>
              <div className={styles.well}>
                <Capture source={design} platform={platform} />
              </div>
            </div>

            <div className={styles.pane} data-side="built">
              <span className={styles.paneLabel}>
                <span className={styles.scopeDot} aria-hidden="true" />
                {builtLabel}
                {built.meta ? (
                  <span className={styles.paneMeta}>{built.meta}</span>
                ) : null}
              </span>
              <div className={styles.well}>
                {hasDeltas
                  ? deltas
                      .filter((d) => d.position)
                      .map((d, i) => (
                        <span
                          key={`${d.class}-${i}`}
                          className={styles.delta}
                          style={d.position}
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                      ))
                  : null}
                <Capture source={built} platform={platform} />
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.overlay} data-slot="fidelity-mirror-overlay-view">
            <div
              className={styles.overlayFrame}
              style={{ "--fm-split": `${split}%` } as React.CSSProperties}
            >
              <span className={styles.ribbon} data-side="built">
                {ribbonLabel("built", platform)}
              </span>
              {/* Base layer: built render. */}
              <div className={styles.layer}>
                <Capture source={built} platform={platform} />
              </div>
              {/* Top layer: design, clipped to the reveal position. */}
              <div className={cn(styles.layer, styles.layerTop)}>
                <span className={styles.ribbon} data-side="design">
                  {ribbonLabel("design", platform)}
                </span>
                <Capture source={design} platform={platform} />
              </div>
              <div className={styles.handle} aria-hidden="true">
                <span className={styles.grip}>
                  <ArrowsHorizontalIcon
                    className={styles.gripIcon}
                    weight="bold"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </div>
            <input
              className={styles.range}
              type="range"
              min={0}
              max={100}
              value={split}
              aria-label="Reveal position"
              onChange={(e) => setSplit(Number(e.target.value))}
            />
          </div>
        )}

        {/* ── Delta legend ── */}
        {hasDeltas ? (
          <div className={styles.legend} data-slot="fidelity-mirror-legend">
            <span className={styles.legendHead}>Deltas — built vs design</span>
            {deltas.map((d, i) => (
              <div className={styles.legendRow} key={`${d.class}-legend-${i}`}>
                <span className={styles.legendNum}>{i + 1}</span>
                <span className={styles.tag} data-class={d.class}>
                  {d.label ?? DELTA_LABELS[d.class]}
                </span>
                <span className={styles.legendText}>{d.description}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    )
  }
)
FidelityMirror.displayName = "FidelityMirror"

// ─── PlatformChip (internal) ────────────────────────────────────────────────────

function PlatformChip({ platform }: { platform: FidelityPlatform }) {
  if (platform === "web") {
    return (
      <span className={styles.chip} data-slot="fidelity-mirror-chip">
        <span className={styles.chipDot} aria-hidden="true" />
        Web · Live Route
      </span>
    )
  }
  if (platform === "native") {
    return (
      <span className={styles.chip} data-slot="fidelity-mirror-chip">
        <DeviceMobileIcon className={styles.chipIcon} aria-hidden="true" />
        iOS · SwiftUI
      </span>
    )
  }
  if (platform === "flutter") {
    return (
      <span className={styles.chip} data-slot="fidelity-mirror-chip">
        <DeviceMobileIcon className={styles.chipIcon} aria-hidden="true" />
        Flutter
      </span>
    )
  }
  return (
    <span className={styles.chip} data-slot="fidelity-mirror-chip">
      <BrowserIcon className={styles.chipIcon} aria-hidden="true" />
      External
    </span>
  )
}

export { FidelityMirror }
