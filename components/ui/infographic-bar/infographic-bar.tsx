"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import { StatCard, type StatCardProps } from "../stat-card/stat-card"
import { ToggleGroup, ToggleGroupItem } from "../toggle-group/toggle-group"
import styles from "./infographic-bar.module.css"

/**
 * One cell in the band. A focused subset of {@link StatCardProps} — the bar
 * owns layout-level concerns (`size`, chrome), so those props live on the bar,
 * not the cell. Picking from `StatCardProps` keeps the cell API in lockstep
 * with stat-card and avoids prop drift.
 */
export type InfographicBarStat = Pick<
  StatCardProps,
  | "label"
  | "value"
  | "delta"
  | "trend"
  | "trendPosition"
  | "footer"
  | "valueAs"
  | "variant"
> & {
  /**
   * Stable React key for the cell, and its value in a selectable band. Falls
   * back to the array index (as a string) when omitted.
   */
  id?: string
}

export interface InfographicBarProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children" | "defaultValue" | "onChange" | "dir"
> {
  /** Ordered stat cells, rendered left-to-right as a single continuous band. */
  stats: InfographicBarStat[]
  /** Dimensional density forwarded to every cell of a read-only band. Defaults to `"md"`. */
  size?: StatCardProps["size"]
  /**
   * Selected cell `id`. Passing `value`, `defaultValue` or `onValueChange`
   * makes the band selectable: a radiogroup filter with one cell pressed.
   */
  value?: string
  /** Uncontrolled initial selection. Falls back to the first cell. */
  defaultValue?: string
  /** Fires with the newly selected cell `id`. Never fires with an empty string. */
  onValueChange?: (value: string) => void
  /** Reading direction; a selectable band's arrow keys follow it. */
  dir?: "ltr" | "rtl"
}

const ARROW_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"])

/**
 * InfographicBar composes N {@link StatCard}s into one continuous band: outer
 * corners rounded, inner corners square, hairline dividers between cells, and
 * no full per-card borders. Theme-agnostic — the outer frame follows
 * `--border-default` (so borderless themes drop it) and dividers follow
 * `--hairline` (retunable via `--infographic-bar-divider`).
 *
 * Selectable (VI-868): with `value`, `defaultValue` or `onValueChange` the band
 * becomes a filter, built on ToggleGroup (radiogroup, roving focus, sliding
 * indicator). Each cell shows its value over a sentence-case caption; the
 * `delta`, `trend`, `footer`, `variant` and `valueAs` cell props apply to the
 * read-only band only.
 */
const InfographicBar = React.forwardRef<HTMLDivElement, InfographicBarProps>(
  (
    {
      className,
      stats,
      size = "md",
      value: valueProp,
      defaultValue,
      onValueChange,
      onKeyDownCapture,
      ...props
    },
    ref
  ) => {
    const selectable =
      valueProp !== undefined ||
      defaultValue !== undefined ||
      onValueChange !== undefined
    const ids = stats.map(({ id }, index) => id ?? String(index))
    const [inner, setInner] = React.useState(defaultValue ?? ids[0])
    const controlled = valueProp !== undefined
    const selected = controlled ? valueProp : inner
    const arrowKey = React.useRef(false)

    const select = (next: string) => {
      // Radix reports "" when the pressed cell is clicked again; one cell stays pressed.
      if (!next || next === selected) return
      if (!controlled) setInner(next)
      onValueChange?.(next)
    }

    if (!selectable) {
      return (
        <div
          ref={ref}
          data-slot="infographic-bar"
          className={cn(styles.bar, className)}
          onKeyDownCapture={onKeyDownCapture}
          {...props}
        >
          {stats.map(({ id, ...stat }, index) => (
            <StatCard
              key={id ?? index}
              size={size}
              className={styles.cell}
              {...stat}
            />
          ))}
        </div>
      )
    }

    return (
      <ToggleGroup
        {...props}
        ref={ref}
        type="single"
        variant="outline"
        value={selected ?? ""}
        onValueChange={select}
        // Radio pattern: an arrow key moves focus and selection together. Capture
        // phase, because roving focus moves focus on the item before the root hears it.
        onKeyDownCapture={(event) => {
          arrowKey.current = ARROW_KEYS.has(event.key)
          onKeyDownCapture?.(event)
        }}
        data-slot="infographic-bar"
        data-selectable="true"
        className={cn(styles.bar, styles.selectable, className)}
      >
        {stats.map(({ label, value }, index) => (
          <ToggleGroupItem
            key={ids[index]}
            value={ids[index]}
            className={styles.option}
            onFocus={() => {
              if (arrowKey.current) select(ids[index])
              arrowKey.current = false
            }}
          >
            {/* A fragment, so ToggleGroupItem leaves the bare space unwrapped. */}
            <>
              <span data-slot="infographic-bar-value" className={styles.value}>
                {value}
              </span>
              {/* Names the radio "7 waiting", not "7waiting"; a flex row draws no space. */}{" "}
              <span
                data-slot="infographic-bar-caption"
                className={styles.caption}
              >
                {label}
              </span>
            </>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    )
  }
)
InfographicBar.displayName = "InfographicBar"

export { InfographicBar }
