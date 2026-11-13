"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "../../../lib/utils"
import styles from "./billing-slider.module.css"

export interface BillingSliderMark {
  /** Where the notch sits. A mark is not a stop: the thumb passes it freely. */
  value: number
  /** Text before the value in the labels row ("High"). */
  label?: React.ReactNode
  /** Past this mark the filled range turns to stripes (the "past the high" zone). */
  hatchPast?: boolean
}

export interface BillingSliderEvidence {
  /** Confirmed hours: a solid strip along the track's foot, and a full-height tick at its end. */
  value: number
  /** Agent hours counted as evidence: a dotted extension that moves the tick. Leave it off when they don't count. */
  agent?: number
  /** Proposed, unconfirmed hours: a pale extension past the tick, and a dashed tick at its end. */
  proposed?: number
}

export interface BillingSliderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> {
  /** What it bills. Controlled. */
  value: number
  onValueChange: (value: number) => void
  /** Enter, or releasing the thumb after a drag. Arrow keys never commit. */
  onValueCommit?: (value: number) => void
  /** The last saved value. Escape puts the thumb back here. */
  savedValue?: number
  /** The floor. Nothing below it. */
  min: number
  /** The track's end, computed by the caller (as far as the ceiling allows). */
  max: number
  /** Defaults to 0.25 (a quarter hour). Shift + arrows step four times this. */
  step?: number
  /** Notches across the track, with their text in the labels row. */
  marks?: BillingSliderMark[]
  /** What was worked, drawn along the track's foot. */
  evidence?: BillingSliderEvidence
  /** Stripe the gap between the thumb and the evidence tick (money at stake, not decided). */
  gap?: boolean
  /** A Paper project-hue angle (75, 99 … 339). Reads `--paper-hue-<angle>-fill-strong` and `-ink`. */
  hue?: number
  /** `"md"` is the 40px row track; `"lg"` is the 56px hero track. */
  size?: "md" | "lg"
  /** `"saving"` pulses the thumb. `"failed"` is a hook for styling; put `value` back to `savedValue`. */
  status?: "saving" | "failed"
  disabled?: boolean
  /** Formats a value for the bubble and the labels row. Defaults to the number. */
  formatValue?: (value: number) => string
  /** `aria-valuetext`: the formatted value and its amount ("Bills 9.5 h, $1,140"). Defaults to `formatValue`. */
  valueText?: (value: number) => string
  /** Text before the floor's value ("Low"). */
  minLabel?: React.ReactNode
  /** Text before the end's value ("Ceiling allows"). */
  maxLabel?: React.ReactNode
}

const BIG_STEP = 4

const BillingSlider = React.forwardRef<HTMLDivElement, BillingSliderProps>(
  (
    {
      className,
      style,
      value,
      onValueChange,
      onValueCommit,
      savedValue,
      min,
      max,
      step = 0.25,
      marks = [],
      evidence,
      gap = false,
      hue,
      size = "md",
      status,
      disabled = false,
      formatValue = String,
      valueText,
      minLabel,
      maxLabel,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref
  ) => {
    const span = max - min
    const pct = (v: number) => (span > 0 ? ((Math.min(Math.max(v, min), max) - min) / span) * 100 : 0)
    const at = (from: number, to: number) => ({ left: `${pct(from)}%`, width: `${Math.max(pct(to) - pct(from), 0)}%` })
    // Round to the step from the floor; the 1e6 round trip drops float noise (0.1 + 0.2).
    const snap = (v: number) =>
      Math.min(Math.max(Math.round(Math.round((v - min) / step) * step * 1e6) / 1e6 + min, min), max)

    const hatchAt = marks.find((m) => m.hatchPast)?.value
    const fillTo = hatchAt === undefined ? value : Math.min(value, hatchAt)
    const worked = evidence?.value ?? 0
    const evEnd = worked + (evidence?.agent ?? 0)
    const proposedEnd = evEnd + (evidence?.proposed ?? 0)
    const gapTo = Math.min(evEnd, max)
    const showGap = gap && evidence !== undefined && gapTo - value >= step

    const ruler: number[] = []
    for (let h = Math.floor(min) + 1; h < max; h++) ruler.push(h)

    const onKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (disabled) return
      const by = e.shiftKey ? step * BIG_STEP : step
      const next: number | undefined = {
        ArrowRight: value + by,
        ArrowUp: value + by,
        ArrowLeft: value - by,
        ArrowDown: value - by,
        PageUp: value + step * BIG_STEP,
        PageDown: value - step * BIG_STEP,
        Home: min,
        End: max,
      }[e.key]
      // preventDefault also skips Radix's own key handling, which would commit on every step.
      if (next !== undefined) {
        e.preventDefault()
        const v = next === max ? max : snap(next)
        if (v !== value) onValueChange(v)
      } else if (e.key === "Enter") {
        e.preventDefault()
        onValueCommit?.(value)
      } else if (e.key === "Escape" && savedValue !== undefined) {
        e.preventDefault()
        if (savedValue !== value) onValueChange(savedValue)
      }
    }

    const hueVars =
      hue === undefined
        ? undefined
        : ({
            "--billing-slider-hue-fill-strong": `var(--paper-hue-${hue}-fill-strong)`,
            "--billing-slider-hue-ink": `var(--paper-hue-${hue}-ink)`,
          } as React.CSSProperties)

    const markLabels = marks.filter((m) => {
      const p = pct(m.value)
      // shortcut: hides a mark's text near either end so it can't collide with the floor or end text; measure the labels if that ever clips.
      return m.label != null && p > 18 && p < 72
    })

    return (
      <div
        ref={ref}
        data-slot="billing-slider"
        data-size={size}
        data-status={status}
        data-disabled={disabled ? "" : undefined}
        className={cn(styles.root, className)}
        style={{ ...hueVars, ...style }}
        {...props}
      >
        <SliderPrimitive.Root
          className={styles.slider}
          value={[value]}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onValueChange={([v]) => onValueChange(v)}
          onValueCommit={([v]) => onValueCommit?.(v)}
          onKeyDown={onKeyDown}
        >
          <SliderPrimitive.Track data-slot="billing-slider-track" className={styles.track}>
            <span className={styles.ruler} aria-hidden>
              {ruler.map((h) => (
                <i key={h} style={{ left: `${pct(h)}%` }} />
              ))}
            </span>
            <span data-slot="billing-slider-fill" className={styles.fill} style={{ width: `${pct(fillTo)}%` }} />
            {hatchAt !== undefined && value > hatchAt && (
              <span data-slot="billing-slider-past" className={styles.past} style={at(hatchAt, value)} />
            )}
            {showGap && <span data-slot="billing-slider-gap" className={styles.gap} style={at(value, gapTo)} />}
            {evidence && worked > min && (
              <span data-slot="billing-slider-evidence" className={styles.evidence} style={{ width: `${pct(worked)}%` }} />
            )}
            {evidence?.agent && evEnd > min ? (
              <span data-slot="billing-slider-agent" className={styles.agent} style={at(Math.max(worked, min), evEnd)} />
            ) : null}
            {evidence?.proposed && proposedEnd > min ? (
              <span data-slot="billing-slider-proposed" className={styles.proposed} style={at(Math.max(evEnd, min), proposedEnd)} />
            ) : null}
            {marks.map((m, i) => (
              <span key={i} data-slot="billing-slider-mark" className={styles.mark} style={{ left: `${pct(m.value)}%` }} />
            ))}
            {evidence && evEnd >= min && (
              <span
                data-slot="billing-slider-tick"
                data-out={evEnd > max ? "" : undefined}
                className={styles.tick}
                style={{ left: `${pct(evEnd)}%` }}
              />
            )}
            {evidence?.proposed && proposedEnd >= min && proposedEnd <= max ? (
              <span
                data-slot="billing-slider-tick"
                data-variant="proposed"
                className={styles.tick}
                style={{ left: `${pct(proposedEnd)}%` }}
              />
            ) : null}
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            data-slot="billing-slider-thumb"
            className={styles.thumb}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-valuetext={(valueText ?? formatValue)(value)}
          >
            <span className={styles.bubble} aria-hidden>
              {formatValue(value)}
            </span>
          </SliderPrimitive.Thumb>
        </SliderPrimitive.Root>
        <div data-slot="billing-slider-labels" className={styles.labels}>
          <span style={{ left: 0 }}>
            {minLabel} <b>{formatValue(min)}</b>
          </span>
          {markLabels.map((m, i) => (
            <span key={i} data-align="center" style={{ left: `${pct(m.value)}%` }}>
              {m.label} <b>{formatValue(m.value)}</b>
            </span>
          ))}
          <span style={{ right: 0 }}>
            {maxLabel} <b>{formatValue(max)}</b>
          </span>
        </div>
      </div>
    )
  }
)
BillingSlider.displayName = "BillingSlider"

export { BillingSlider }
