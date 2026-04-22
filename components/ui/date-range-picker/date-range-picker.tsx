"use client"

import * as React from "react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { CalendarBlank } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import { Calendar } from "../calendar/calendar"
import styles from "./date-range-picker.module.css"

export type { DateRange }

export interface DateRangePickerProps {
  /** Selected date range */
  value?: DateRange
  /** Called when the range changes */
  onChange?: (range: DateRange) => void
  /** Placeholder text when no range is selected */
  placeholder?: string
  /** Date format string (date-fns format) used for both endpoints */
  dateFormat?: string
  /** Whether the picker is disabled */
  disabled?: boolean
  /** Additional class name for the trigger button */
  className?: string
}

const DateRangePicker = React.forwardRef<HTMLButtonElement, DateRangePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = "Pick a date range",
      dateFormat = "PPP",
      disabled = false,
      className,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    // Tracks selection in progress when used uncontrolled (e.g. docs preview).
    // Without this, Calendar always sees selected=undefined and react-day-picker
    // treats every click as a fresh start, breaking two-phase range selection.
    const [internalRange, setInternalRange] = React.useState<DateRange | undefined>()

    // Controlled takes precedence; fall back to internal state for uncontrolled usage
    const displayValue = value ?? internalRange

    const label = (() => {
      if (displayValue?.from && displayValue?.to)
        return `${format(displayValue.from, dateFormat)} – ${format(displayValue.to, dateFormat)}`
      if (displayValue?.from) return `${format(displayValue.from, dateFormat)} –`
      return placeholder
    })()

    const showPlaceholder = !displayValue?.from

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger
          ref={ref}
          data-slot="date-range-picker"
          disabled={disabled}
          className={cn(
            styles.trigger,
            showPlaceholder && styles.placeholder,
            disabled && styles.disabled,
            className
          )}
        >
          <CalendarBlank size={16} className={styles.icon} />
          <span>{label}</span>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            data-slot="date-range-picker-content"
            className={styles.content}
            align="start"
            sideOffset={4}
          >
            <Calendar
              mode="range"
              selected={displayValue}
              onSelect={(range) => {
                const raw: DateRange = range ?? { from: undefined }
                // react-day-picker fires { from: day, to: day } on the first click
                // when selected is undefined. Normalize to { from: day } so the Calendar
                // knows we're still waiting for the end date, not that a range is complete.
                const next: DateRange =
                  raw.from && raw.to && raw.from.getTime() === raw.to.getTime()
                    ? { from: raw.from }
                    : raw
                setInternalRange(next)
                onChange?.(next)
              }}
              numberOfMonths={2}
              autoFocus
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    )
  }
)
DateRangePicker.displayName = "DateRangePicker"
export { DateRangePicker }
