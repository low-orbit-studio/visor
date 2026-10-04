"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./position-picker.module.css"

export type PositionY = "top" | "center" | "bottom"
export type PositionX = "left" | "center" | "right"

/** The chosen anchor: a vertical and a horizontal position. */
export interface PositionValue {
  y: PositionY
  x: PositionX
}

export type PositionPickerVariant = "default" | "on-image"

const ROWS: readonly PositionY[] = ["top", "center", "bottom"]
const COLS: readonly PositionX[] = ["left", "center", "right"]

/** The accessible name of one target: "Top left", "Center", "Bottom right". */
function targetName({ y, x }: PositionValue): string {
  if (y === "center" && x === "center") return "Center"
  const name = y === "center" ? `Center ${x}` : x === "center" ? `${y} center` : `${y} ${x}`
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export interface PositionPickerTargetState {
  selected: boolean
}

export interface PositionPickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  /** Controlled value. `null` is controlled with nothing chosen. */
  value?: PositionValue | null
  /** Initial value when uncontrolled. */
  defaultValue?: PositionValue | null
  /** Called with the new `{ y, x }` pair when a target is chosen. */
  onValueChange?: (value: PositionValue) => void
  /**
   * `default` draws the grid on its own ground. `on-image` fills a positioned
   * parent (the photograph's frame) and gives every target its own scrim ring,
   * so each keeps 3:1 against any photograph without touching the photo.
   */
  variant?: PositionPickerVariant
  disabled?: boolean
  /**
   * Replaces the drawn dot of one target, for example an alignment icon in the
   * occupied row. Decorative: the target keeps its own accessible name.
   */
  renderTarget?: (position: PositionValue, state: PositionPickerTargetState) => React.ReactNode
}

const PositionPicker = React.forwardRef<HTMLDivElement, PositionPickerProps>(
  (
    {
      value: valueProp,
      defaultValue = null,
      onValueChange,
      variant = "default",
      disabled = false,
      renderTarget,
      className,
      ...props
    },
    ref,
  ) => {
    const isControlled = valueProp !== undefined
    const [inner, setInner] = React.useState<PositionValue | null>(defaultValue)
    const value = isControlled ? valueProp : inner
    const buttons = React.useRef<Array<HTMLButtonElement | null>>([])

    const select = (index: number) => {
      const next: PositionValue = { y: ROWS[Math.floor(index / 3)], x: COLS[index % 3] }
      if (!isControlled) setInner(next)
      onValueChange?.(next)
    }

    const selectedIndex = value ? ROWS.indexOf(value.y) * 3 + COLS.indexOf(value.x) : -1
    // Roving tab stop: the chosen target, or the first when nothing is chosen.
    const tabStop = selectedIndex === -1 ? 0 : selectedIndex

    const move = (from: number, key: string): number | null => {
      const row = Math.floor(from / 3)
      const col = from % 3
      switch (key) {
        case "ArrowLeft": return row * 3 + ((col + 2) % 3)
        case "ArrowRight": return row * 3 + ((col + 1) % 3)
        case "ArrowUp": return ((row + 2) % 3) * 3 + col
        case "ArrowDown": return ((row + 1) % 3) * 3 + col
        case "Home": return 0
        case "End": return 8
        default: return null
      }
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const to = move(index, event.key)
      if (to === null) return
      event.preventDefault()
      buttons.current[to]?.focus()
      select(to)
    }

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-disabled={disabled || undefined}
        data-slot="position-picker"
        data-variant={variant}
        className={cn(styles.root, variant === "on-image" && styles.onImage, className)}
        {...props}
      >
        {ROWS.flatMap((y, r) =>
          COLS.map((x, c) => {
            const index = r * 3 + c
            const position: PositionValue = { y, x }
            const selected = index === selectedIndex
            return (
              <button
                key={index}
                ref={(node) => {
                  buttons.current[index] = node
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={targetName(position)}
                tabIndex={index === tabStop ? 0 : -1}
                disabled={disabled}
                data-slot="position-picker-target"
                data-state={selected ? "checked" : "unchecked"}
                data-y={y}
                data-x={x}
                className={styles.target}
                onClick={() => select(index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                <span className={styles.mark} aria-hidden="true">
                  {renderTarget?.(position, { selected })}
                </span>
              </button>
            )
          }),
        )}
      </div>
    )
  },
)
PositionPicker.displayName = "PositionPicker"

export { PositionPicker }
