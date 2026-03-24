"use client"

import * as React from "react"
import { DayPicker, type DayPickerProps } from "react-day-picker"
import { CaretLeft, CaretRight } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./calendar.module.css"

export type CalendarProps = DayPickerProps

const Calendar = React.forwardRef<
  HTMLDivElement,
  CalendarProps & { className?: string }
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} data-slot="calendar" className={cn(styles.root, className)}>
      <DayPicker
        classNames={{
          months: styles.months,
          month: styles.month,
          month_caption: styles.monthCaption,
          caption_label: styles.captionLabel,
          nav: styles.nav,
          button_previous: styles.navButton,
          button_next: styles.navButton,
          month_grid: styles.monthGrid,
          weekdays: styles.weekdays,
          weekday: styles.weekday,
          week: styles.week,
          day: styles.day,
          day_button: styles.dayButton,
          selected: styles.selected,
          today: styles.today,
          outside: styles.outside,
          disabled: styles.dayDisabled,
          range_middle: styles.rangeMiddle,
          range_start: styles.rangeStart,
          range_end: styles.rangeEnd,
          hidden: styles.hidden,
        }}
        components={{
          Chevron: ({ orientation }) =>
            orientation === "left" ? (
              <CaretLeft size={16} weight="bold" />
            ) : (
              <CaretRight size={16} weight="bold" />
            ),
        }}
        {...props}
      />
    </div>
  )
})
Calendar.displayName = "Calendar"

export { Calendar }
