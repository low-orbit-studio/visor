"use client"

import * as React from "react"
import { format } from "date-fns"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { CalendarBlank } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import { Calendar } from "../calendar/calendar"
import styles from "./date-picker.module.css"

export interface DatePickerProps {
  /** Selected date */
  value?: Date
  /** Called when date changes */
  onChange?: (date: Date | undefined) => void
  /** Placeholder text when no date is selected */
  placeholder?: string
  /** Date format string (date-fns format) */
  dateFormat?: string
  /** Whether the picker is disabled */
  disabled?: boolean
  /** Additional class name for the trigger button */
  className?: string
  /** Popover alignment against the trigger (VI-654). Defaults to "start". */
  align?: "start" | "center" | "end"
  /** Gap in px between the trigger and the popover. Defaults to 4. */
  sideOffset?: number
  /** Viewport padding in px the popover keeps clear when it collides. Defaults to 0. */
  collisionPadding?: number
  /** Whether the popover starts open (uncontrolled). Defaults to false. */
  defaultOpen?: boolean
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = "Pick a date",
      dateFormat = "PPP",
      disabled = false,
      className,
      align = "start",
      sideOffset = 4,
      collisionPadding = 0,
      defaultOpen = false,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(defaultOpen)

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger
          ref={ref}
          data-slot="date-picker"
          disabled={disabled}
          className={cn(
            styles.trigger,
            !value && styles.placeholder,
            disabled && styles.disabled,
            className
          )}
        >
          <CalendarBlank size={16} className={styles.icon} />
          <span>{value ? format(value, dateFormat) : placeholder}</span>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            data-slot="date-picker-content"
            className={styles.content}
            align={align}
            sideOffset={sideOffset}
            collisionPadding={collisionPadding}
          >
            <Calendar
              mode="single"
              selected={value}
              defaultMonth={value}
              onSelect={(date) => {
                onChange?.(date)
                setOpen(false)
              }}
              autoFocus
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    )
  }
)
DatePicker.displayName = "DatePicker"

export { DatePicker }
