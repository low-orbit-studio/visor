"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Clock } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./time-picker.module.css"

export type HourCycle = 12 | 24

export interface TimePickerProps {
  /** Selected time as a 24-hour "HH:MM" string, whatever the display cycle */
  value?: string
  /** Initial value when uncontrolled */
  defaultValue?: string
  /** Called with a 24-hour "HH:MM" string, or undefined when the field is cleared */
  onChange?: (value: string | undefined) => void
  /** Display and typing cycle. Defaults from the locale. */
  hourCycle?: HourCycle
  /** BCP 47 locale that decides the default hour cycle. Defaults to the document language. */
  locale?: string
  /** Minutes between choices in the popover; typed times snap to it */
  minuteStep?: number
  /** Placeholder text when no time is selected */
  placeholder?: string
  /** Whether the picker is disabled */
  disabled?: boolean
  /** Whether the popover is open (controlled) */
  open?: boolean
  /** Called when the popover opens or closes */
  onOpenChange?: (open: boolean) => void
  /** Element the popover portals into. Defaults to document.body. */
  container?: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Portal>["container"]
  /** Accessible label for the clock button */
  triggerLabel?: string
  /** Additional class name for the field wrapper */
  className?: string
  id?: string
  name?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-invalid"?: boolean | "true" | "false"
}

const MINUTES_PER_DAY = 24 * 60

const VALUE_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

/** Split a "HH:MM" value into minutes since midnight, or undefined when malformed. */
export function toMinutes(value: string | undefined): number | undefined {
  const match = value ? VALUE_PATTERN.exec(value) : null
  return match ? Number(match[1]) * 60 + Number(match[2]) : undefined
}

/** Minutes since midnight to a 24-hour "HH:MM" string. */
export function fromMinutes(total: number): string {
  const wrapped = ((Math.round(total) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const h = Math.floor(wrapped / 60)
  const m = wrapped % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** Round to the nearest step, carrying into the next hour (and past midnight). */
export function snapToStep(total: number, step: number): number {
  const safe = Number.isFinite(step) && step >= 1 ? Math.floor(step) : 1
  return (Math.round(total / safe) * safe) % MINUTES_PER_DAY
}

/** Display text for a "HH:MM" value in the given cycle. */
export function formatTime(value: string | undefined, cycle: HourCycle): string {
  const total = toMinutes(value)
  if (total === undefined) return ""
  const h = Math.floor(total / 60)
  const mm = String(total % 60).padStart(2, "0")
  if (cycle === 24) return `${String(h).padStart(2, "0")}:${mm}`
  return `${h % 12 === 0 ? 12 : h % 12}:${mm} ${h < 12 ? "AM" : "PM"}`
}

/**
 * Parse what a person types into minutes since midnight. Accepts "16:30",
 * "1630", "4:30pm", "4 pm", "4p". In the 12-hour cycle a bare 1-12 hour has
 * no period, so it keeps `fallbackPeriod` (the period of the current value).
 */
export function parseTime(
  text: string,
  cycle: HourCycle,
  fallbackPeriod: "am" | "pm" = "am"
): number | undefined {
  const match = /^(\d{1,2}):?(\d{2})?\s*(?:([ap])\.?m?\.?)?$/.exec(text.trim().toLowerCase())
  if (!match) return undefined
  let h = Number(match[1])
  const m = match[2] === undefined ? 0 : Number(match[2])
  if (m > 59) return undefined
  const period = match[3] ? (match[3] === "a" ? "am" : "pm") : undefined
  if (period) {
    if (h < 1 || h > 12) return undefined
    h = (h % 12) + (period === "pm" ? 12 : 0)
  } else if (h > 23) {
    return undefined
  } else if (cycle === 12 && h >= 1 && h <= 12) {
    h = (h % 12) + (fallbackPeriod === "pm" ? 12 : 0)
  }
  return h * 60 + m
}

/** 12 for locales that default to a 12-hour clock, otherwise 24. */
export function resolveHourCycle(locale?: string): HourCycle {
  try {
    const resolved = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions()
    if (resolved.hourCycle) return resolved.hourCycle === "h11" || resolved.hourCycle === "h12" ? 12 : 24
    return resolved.hour12 ? 12 : 24
  } catch {
    return 24
  }
}

function documentLang(): string | undefined {
  if (typeof document === "undefined") return undefined
  return document.documentElement.lang || undefined
}

const pad2 = (n: number) => String(n).padStart(2, "0")

interface ColumnProps {
  label: string
  items: { key: string; label: string; selected: boolean; onSelect: () => void }[]
  slot: string
}

/** One scrolling listbox column. Arrow keys move focus; Enter or Space selects. */
function Column({ label, items, slot }: ColumnProps) {
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"]
    if (!keys.includes(event.key)) return
    const options = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='option']")
    )
    const at = options.indexOf(document.activeElement as HTMLButtonElement)
    const next =
      event.key === "Home" ? 0
      : event.key === "End" ? options.length - 1
      : Math.min(options.length - 1, Math.max(0, at + (event.key === "ArrowDown" ? 1 : -1)))
    event.preventDefault()
    options[next]?.focus()
  }

  const tabbable = Math.max(0, items.findIndex((item) => item.selected))
  return (
    <div
      role="listbox"
      aria-label={label}
      data-slot={slot}
      className={styles.column}
      onKeyDown={onKeyDown}
    >
      {items.map((item, i) => (
        <button
          key={item.key}
          type="button"
          role="option"
          aria-selected={item.selected}
          tabIndex={i === tabbable ? 0 : -1}
          data-selected={item.selected || undefined}
          className={cn(styles.option, item.selected && styles.optionSelected)}
          onClick={item.onSelect}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      value: valueProp,
      defaultValue,
      onChange,
      hourCycle,
      locale,
      minuteStep = 1,
      placeholder,
      disabled = false,
      open: openProp,
      onOpenChange,
      container,
      triggerLabel = "Choose time",
      className,
      id,
      name,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-invalid": ariaInvalid,
    },
    ref
  ) => {
    const [innerValue, setInnerValue] = React.useState(defaultValue)
    const value = valueProp !== undefined ? valueProp : innerValue
    const [innerOpen, setInnerOpen] = React.useState(false)
    const open = openProp !== undefined ? openProp : innerOpen
    const contentRef = React.useRef<HTMLDivElement>(null)

    const cycle: HourCycle = hourCycle ?? resolveHourCycle(locale ?? documentLang())
    const step = Number.isFinite(minuteStep) && minuteStep >= 1 ? Math.floor(minuteStep) : 1
    const total = toMinutes(value)

    const [draft, setDraft] = React.useState<string | null>(null)
    const display = draft ?? formatTime(value, cycle)

    const setOpen = (next: boolean) => {
      setInnerOpen(next)
      onOpenChange?.(next)
    }

    const emit = (next: string | undefined) => {
      setInnerValue(next)
      onChange?.(next)
    }

    const commit = (text: string) => {
      setDraft(null)
      if (text.trim() === "") {
        if (value !== undefined) emit(undefined)
        return
      }
      const parsed = parseTime(text, cycle, total !== undefined && total >= 720 ? "pm" : "am")
      // Unparseable text reverts to the last good value.
      if (parsed === undefined) return
      const next = fromMinutes(snapToStep(parsed, step))
      if (next !== value) emit(next)
    }

    const stepBy = (direction: 1 | -1) => {
      const base = total ?? (direction === 1 ? -step : MINUTES_PER_DAY)
      emit(fromMinutes(snapToStep(base, step) + direction * step))
      setDraft(null)
    }

    const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown" && event.altKey) {
        event.preventDefault()
        setOpen(true)
      } else if (event.key === "Enter") {
        commit(event.currentTarget.value)
      } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault()
        stepBy(event.key === "ArrowUp" ? 1 : -1)
      }
    }

    // Setting one part keeps the other; an empty field starts from 00.
    const h24 = total === undefined ? undefined : Math.floor(total / 60)
    const minute = total === undefined ? undefined : total % 60
    const setParts = (hour: number | undefined, min: number | undefined) =>
      emit(fromMinutes((hour ?? 0) * 60 + (min ?? 0)))

    const hourItems =
      cycle === 24
        ? Array.from({ length: 24 }, (_, h) => ({
            key: String(h),
            label: pad2(h),
            selected: h24 === h,
            onSelect: () => setParts(h, minute),
          }))
        : Array.from({ length: 12 }, (_, i) => {
            const h12 = i + 1
            const isPm = h24 !== undefined && h24 >= 12
            return {
              key: String(h12),
              label: String(h12),
              selected: h24 !== undefined && (h24 % 12 === 0 ? 12 : h24 % 12) === h12,
              onSelect: () => setParts((h12 % 12) + (isPm ? 12 : 0), minute),
            }
          })

    const minuteItems = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step).map(
      (m) => ({
        key: String(m),
        label: pad2(m),
        selected: minute === m,
        onSelect: () => setParts(h24, m),
      })
    )

    const periodItems = (["AM", "PM"] as const).map((p) => {
      const isPm = p === "PM"
      return {
        key: p,
        label: p,
        selected: h24 !== undefined && (h24 >= 12) === isPm,
        onSelect: () => {
          const base = h24 ?? 0
          setParts((base % 12) + (isPm ? 12 : 0), minute)
        },
      }
    })

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Anchor asChild>
          <div
            data-slot="time-picker"
            data-disabled={disabled || undefined}
            className={cn(styles.field, disabled && styles.disabled, className)}
          >
            <input
              ref={ref}
              id={id}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              data-slot="time-picker-input"
              className={styles.input}
              value={display}
              placeholder={placeholder ?? (cycle === 24 ? "HH:MM" : "H:MM AM")}
              disabled={disabled}
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              aria-invalid={ariaInvalid}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={(e) => {
                if (draft !== null) commit(e.target.value)
              }}
              onKeyDown={onInputKeyDown}
            />
            {name && <input type="hidden" name={name} value={value ?? ""} />}
            <PopoverPrimitive.Trigger
              type="button"
              data-slot="time-picker-trigger"
              className={styles.trigger}
              disabled={disabled}
              aria-label={triggerLabel}
            >
              <Clock size={16} aria-hidden="true" />
            </PopoverPrimitive.Trigger>
          </div>
        </PopoverPrimitive.Anchor>
        <PopoverPrimitive.Portal container={container}>
          <PopoverPrimitive.Content
            ref={contentRef}
            data-slot="time-picker-content"
            data-hour-cycle={cycle}
            className={styles.content}
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(event) => {
              // Land on the chosen hour (or the first) so arrow keys work at once.
              event.preventDefault()
              const target =
                contentRef.current?.querySelector<HTMLElement>("[role='option'][tabindex='0']")
              target?.focus()
              target?.scrollIntoView?.({ block: "nearest" })
            }}
          >
            <Column label="Hour" slot="time-picker-hours" items={hourItems} />
            <Column label="Minute" slot="time-picker-minutes" items={minuteItems} />
            {cycle === 12 && (
              <Column label="AM or PM" slot="time-picker-period" items={periodItems} />
            )}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    )
  }
)
TimePicker.displayName = "TimePicker"

export { TimePicker }
