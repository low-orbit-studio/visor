import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./proportion-bar.module.css"

/**
 * A part's fill. `"hatched"`, `"striped"` and `"alert"` are built in; any other
 * string is used as the part's CSS `background` (a colour, a `var()`, a gradient).
 */
export type ProportionBarFill = "hatched" | "striped" | "alert" | (string & {})

export interface ProportionBarPart {
  /** The part's name, in the legend and the summary. */
  label: string
  /** The part's share of the total. Zero or less draws nothing in the bar and stays in the legend. */
  value: number
  /** Defaults to `--proportion-bar-fill-1` … `-4` by position. */
  fill?: ProportionBarFill
}

export interface ProportionBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The parts, in order, left to right. */
  parts: ProportionBarPart[]
  /** `default` is 30px tall (a main balance); `thin` is 8px (inside a card). */
  size?: "default" | "thin"
  /** Draw the legend row under the bar: swatch, label, value. */
  legend?: boolean
  /** Formats every value in the legend, the summary and the part tooltips. */
  formatValue?: (value: number) => string
  /** The bar's accessible text. Defaults to "186.5 h: On a package 92.25 h, …". */
  summary?: string
}

const BUILT_IN = {
  hatched: styles.hatched,
  striped: styles.striped,
  alert: styles.alert,
}
const DEFAULT_FILLS = [styles.fill1, styles.fill2, styles.fill3, styles.fill4]

/** The class and inline background that paint part `i`. */
function paint(part: ProportionBarPart, i: number): { className: string; style?: React.CSSProperties } {
  const { fill } = part
  if (fill === undefined) return { className: DEFAULT_FILLS[i % DEFAULT_FILLS.length] }
  if (fill === "hatched" || fill === "striped" || fill === "alert")
    return { className: BUILT_IN[fill as keyof typeof BUILT_IN] }
  return { className: "", style: { background: fill } }
}

const ProportionBar = React.forwardRef<HTMLDivElement, ProportionBarProps>(
  ({ className, parts, size = "default", legend = false, formatValue = String, summary, ...props }, ref) => {
    const values = parts.map((p) => Math.max(p.value, 0))
    const total = values.reduce((a, b) => a + b, 0)
    const label =
      summary ??
      (parts.length
        ? `${formatValue(total)}: ${parts.map((p, i) => `${p.label} ${formatValue(values[i])}`).join(", ")}`
        : formatValue(0))

    return (
      <div ref={ref} data-slot="proportion-bar" data-size={size} className={cn(styles.root, className)} {...props}>
        <div role="img" aria-label={label} data-slot="proportion-bar-track" className={styles.bar}>
          {total > 0 ? (
            parts.map((part, i) => {
              if (values[i] <= 0) return null
              const { className: fill, style } = paint(part, i)
              return (
                <span
                  key={i}
                  data-slot="proportion-bar-part"
                  title={`${part.label} ${formatValue(values[i])}`}
                  className={cn(styles.part, fill)}
                  style={{ ...style, flexGrow: values[i] }}
                />
              )
            })
          ) : (
            <span data-slot="proportion-bar-empty" className={styles.empty} />
          )}
        </div>
        {legend && parts.length > 0 && (
          <ul data-slot="proportion-bar-legend" className={styles.legend}>
            {parts.map((part, i) => {
              const { className: fill, style } = paint(part, i)
              return (
                <li key={i} className={cn(styles.legendItem, part.fill === "alert" && styles.legendAlert)}>
                  <span aria-hidden="true" className={cn(styles.swatch, fill)} style={style} />
                  {part.label} <b className={styles.legendValue}>{formatValue(values[i])}</b>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }
)
ProportionBar.displayName = "ProportionBar"

export { ProportionBar }
