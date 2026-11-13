import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./layer-chart.module.css"
import { hueVars, type LayerHue } from "./layer-chart-layout"

export type SpanKind = "attended" | "call" | "agent"

export interface Span {
  kind: SpanKind
  /** Minutes after midnight. */
  start: number
  /** Minutes after midnight. */
  end: number
}

export interface SpanLane {
  label: string
  kinds: SpanKind[]
}

export interface SpanStripProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The day's spans, in minutes after midnight. Each is cut into cells of `cell` minutes. */
  spans: Span[]
  /** One lane per row. Defaults to "You" (attended and calls) and, when there are agent spans, "Agent". */
  lanes?: SpanLane[]
  /** The project's hue: a Paper project-hue angle, or "tide". */
  hue?: LayerHue
  /** Minutes per cell. Defaults to 5. */
  cell?: number
  /** Minutes between axis labels. Defaults to 120. */
  tickEvery?: number
  /** The legend's word for each kind. */
  kindLabels?: Partial<Record<SpanKind, string>>
  /** Formats a total in hours for the legend and the lanes' names. Defaults to `"{n} h"`. */
  formatHours?: (hours: number) => string
}

const KIND_LABEL: Record<SpanKind, string> = { attended: "Attended", call: "Call", agent: "Agent" }
const fmtHours = (h: number) => `${+h.toFixed(2)} h`
const clock = (m: number) => `${Math.floor(m / 60) % 12 || 12}${m / 60 < 12 || m / 60 >= 24 ? "am" : "pm"}`

const SpanStrip = React.forwardRef<HTMLDivElement, SpanStripProps>(
  (
    { className, style, spans, lanes, hue, cell = 5, tickEvery = 120, kindLabels, formatHours = fmtHours, ...props },
    ref
  ) => {
    const names = { ...KIND_LABEL, ...kindLabels }
    const lanesUsed =
      lanes ??
      [
        { label: "You", kinds: ["attended", "call"] as SpanKind[] },
        ...(spans.some((s) => s.kind === "agent") ? [{ label: "Agent", kinds: ["agent"] as SpanKind[] }] : []),
      ]
    // The axis runs at least 8am to 7pm, widened to whole hours around the spans.
    const a = Math.min(8 * 60, Math.floor(Math.min(...spans.map((s) => s.start), Infinity) / 60) * 60)
    const b = Math.max(19 * 60, Math.ceil(Math.max(...spans.map((s) => s.end), -Infinity) / 60) * 60)
    const pc = (m: number) => ((m - a) / (b - a)) * 100
    const total = (k: SpanKind) => spans.filter((s) => s.kind === k).reduce((t, s) => t + s.end - s.start, 0) / 60
    const kinds = (["attended", "call", "agent"] as SpanKind[]).filter((k) => spans.some((s) => s.kind === k))
    const ticks: number[] = []
    for (let m = a; m <= b; m += tickEvery) ticks.push(m)

    return (
      <div
        ref={ref}
        data-slot="span-strip"
        data-hue={hue === "tide" ? "tide" : undefined}
        className={cn(styles.strip, className)}
        style={{ ...hueVars(hue), ...style }}
        {...props}
      >
        <div className={styles.lanes}>
          {lanesUsed.map((lane) => {
            const own = spans.filter((s) => lane.kinds.includes(s.kind))
            const name = `${lane.label}: ${lane.kinds.filter((k) => own.some((s) => s.kind === k)).map((k) => `${names[k].toLowerCase()} ${formatHours(total(k))}`).join(", ") || "nothing"}`
            return (
              <React.Fragment key={lane.label}>
                <span className={styles.laneLabel} aria-hidden="true">{lane.label}</span>
                <div
                  role="img"
                  aria-label={name}
                  data-slot="span-strip-lane"
                  data-thin={lane.kinds.every((k) => k === "agent") ? "" : undefined}
                  className={styles.lane}
                >
                  {own.flatMap((s) => {
                    const out: React.ReactNode[] = []
                    for (let m = s.start; m < s.end; m += cell)
                      out.push(
                        <i
                          key={`${s.kind}${m}`}
                          data-kind={s.kind}
                          className={styles.cell}
                          style={{ left: `calc(${pc(m)}% + 0.5px)`, width: `calc(${(Math.min(cell, s.end - m) / (b - a)) * 100}% - 1px)` }}
                        />
                      )
                    return out
                  })}
                </div>
              </React.Fragment>
            )
          })}
          <span />
          <div className={styles.axis} aria-hidden="true">
            {ticks.map((m) => (
              <span key={m} style={{ left: `${pc(m)}%` }}>{clock(m)}</span>
            ))}
          </div>
        </div>
        <div className={styles.legend} data-slot="span-strip-legend">
          {kinds.map((k) => (
            <span key={k}>
              <i data-kind={k} className={styles.swatch} />
              {names[k]} {formatHours(total(k))}
            </span>
          ))}
        </div>
      </div>
    )
  }
)
SpanStrip.displayName = "SpanStrip"

export { SpanStrip }
