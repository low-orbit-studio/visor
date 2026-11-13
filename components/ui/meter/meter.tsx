import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./meter.module.css"

export interface MeterMark {
  /** Where the mark sits, in the same unit as `value` and `max`. */
  value: number
  /** Bold first line under the tick ("160 h"). */
  label?: React.ReactNode
  /** Second line under the tick ("heads-up"). */
  caption?: React.ReactNode
  /** How the text hangs off the tick. Defaults to `"center"`. */
  align?: "start" | "center" | "end"
  /** `"tick"` is a 2px line; `"limit"` is a 3px line for a ceiling. Defaults to `"tick"`. */
  variant?: "tick" | "limit"
  /** The heads-up point: once `value` reaches it, the label's `<strong>` turns weight 800. */
  threshold?: boolean
  /** Hide this mark's text when the meter is narrower than 30rem. The tick stays. */
  hideWhenNarrow?: boolean
}

export interface MeterZone {
  /** Start of the zone. Defaults to 0. */
  from?: number
  /** End of the zone. */
  to: number
  /** `"solid"` fills in the hue's strong fill; `"hatched"` stripes it. Defaults to `"solid"`. */
  variant?: "solid" | "hatched"
}

export interface MeterProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** What has been used. */
  value: number
  /** The limit (a contract's ceiling, a month's included hours). */
  max: number
  /** Ticks on the track: the heads-up threshold, a ceiling, the low and high totals. */
  marks?: MeterMark[]
  /** Bands drawn behind the fill: up to the low, hatched up to the high. */
  zones?: MeterZone[]
  /** A Paper project-hue angle (75, 99 … 339). Reads `--paper-hue-<angle>-fill`, `-fill-strong` and `-ink`. */
  hue?: number
  /** `"compact"` is the 10px row meter; `"contract"` is the 30px meter with zones and mark text. */
  size?: "compact" | "contract"
  /** How use past `max` draws: `"alert"` stripes it coral (unresolved), `"ink"` stripes it in ink (billable overage). */
  overflow?: "alert" | "ink"
  /** The value at the track's right edge. Defaults to `max`, or 6% past `value` when it overflows. Pass one scale to line up several meters. */
  scale?: number
  /** The one-line label under the meter. Wrap the figure in `<strong>`. */
  children?: React.ReactNode
}

const Meter = React.forwardRef<HTMLDivElement, MeterProps>(
  (
    {
      className,
      style,
      value,
      max,
      marks = [],
      zones = [],
      hue,
      size = "compact",
      overflow = "alert",
      scale,
      children,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref
  ) => {
    const labelId = React.useId()
    // Past the limit the track stretches 6% beyond `value`, so the overflow segment has room (LO-345 frame).
    const domain = scale ?? (value > max ? value * 1.06 : max)
    const pct = (v: number) => (domain > 0 ? (Math.min(Math.max(v, 0), domain) / domain) * 100 : 0)
    const threshold = marks.find((m) => m.threshold)
    const over = threshold !== undefined && value >= threshold.value
    const fillTo = overflow === "ink" ? value : Math.min(value, max)
    const markText = marks.filter((m) => m.label != null || m.caption != null)

    const hueVars =
      hue === undefined
        ? undefined
        : ({
            "--meter-hue-fill": `var(--paper-hue-${hue}-fill)`,
            "--meter-hue-fill-strong": `var(--paper-hue-${hue}-fill-strong)`,
            "--meter-hue-ink": `var(--paper-hue-${hue}-ink)`,
          } as React.CSSProperties)

    return (
      <div
        ref={ref}
        data-slot="meter"
        data-size={size}
        data-over={over ? "" : undefined}
        className={cn(styles.root, className)}
        style={{ ...hueVars, ...style }}
        {...props}
      >
        <div
          role="meter"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={Math.min(Math.max(value, 0), max)}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy ?? (ariaLabel || children == null ? undefined : labelId)}
          data-slot="meter-track"
          className={styles.track}
        >
          {zones.map((z, i) => (
            <span
              key={i}
              data-slot="meter-zone"
              data-variant={z.variant ?? "solid"}
              className={styles.zone}
              style={{ left: `${pct(z.from ?? 0)}%`, width: `${pct(z.to) - pct(z.from ?? 0)}%` }}
            />
          ))}
          {value > max && (
            <span
              data-slot="meter-overflow"
              data-variant={overflow}
              className={styles.overflow}
              style={{ left: `${pct(max)}%`, width: `${pct(value) - pct(max)}%` }}
            />
          )}
          <span
            data-slot="meter-fill"
            className={styles.fill}
            style={{ width: `max(0px, calc(${pct(fillTo)}% - var(--_inset-x) * 2))` }}
          />
          {marks.map((m, i) => (
            <span
              key={i}
              data-slot="meter-tick"
              data-variant={m.variant ?? "tick"}
              className={styles.tick}
              style={{ left: `${pct(m.value)}%` }}
            />
          ))}
        </div>
        {markText.length > 0 && (
          <div data-slot="meter-marks" className={styles.marks}>
            {markText.map((m, i) => (
              <div
                key={i}
                data-align={m.align ?? "center"}
                data-hide-narrow={m.hideWhenNarrow ? "" : undefined}
                className={styles.markText}
                style={{ left: `${pct(m.value)}%` }}
              >
                {m.label != null && <b>{m.label}</b>}
                {m.caption}
              </div>
            ))}
          </div>
        )}
        {children != null && (
          <div id={labelId} data-slot="meter-label" className={styles.label}>
            {children}
          </div>
        )}
      </div>
    )
  }
)
Meter.displayName = "Meter"

export { Meter }
