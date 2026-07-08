"use client"

import * as React from "react"
import { CaretLeft, CaretRight } from "@phosphor-icons/react"

import { cn } from "../../lib/utils"
import styles from "./month-calendar.module.css"

/**
 * Status tone driving the leading dot on an event chip. Each tone binds to a
 * Visor semantic status token so the dot adopts the active theme's palette.
 */
export type MonthCalendarStatus =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"

/** Series tint index — keyed to the theme's five-stop chart ramp. */
export type MonthCalendarSeries = 1 | 2 | 3 | 4 | 5

export interface MonthCalendarEvent {
  /** Stable key for the event. */
  id: string
  /**
   * The day this event lands in. Only the calendar date (year/month/day) is
   * used for placement — any time component is ignored.
   */
  date: Date
  /** Chip label. */
  title: string
  /**
   * Status tone for the leading dot. Omit for a neutral dot. Binds to the
   * `--surface-{success,warning,error,info}-default` semantic tokens.
   */
  status?: MonthCalendarStatus
  /**
   * Series tint (1–5). Events sharing an index render with the same background
   * tint and accent bar, keyed to the theme's chart color ramp — the standard
   * way to color-code a recurring series or a resource lane.
   */
  series?: MonthCalendarSeries
}

export interface MonthCalendarViewOption {
  /** Machine value emitted via `onViewChange`. */
  value: string
  /** Human label rendered in the segment. */
  label: React.ReactNode
}

export interface MonthCalendarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** Any date within the month to display. Controlled. */
  month: Date
  /**
   * Fired with the first day of the previous / next month when the month-nav
   * arrows are used.
   */
  onMonthChange?: (month: Date) => void
  /** Events to place into day cells. */
  events?: MonthCalendarEvent[]
  /**
   * The day the grid marks as "today". Omit to mark none — the block never
   * reads the system clock itself, keeping server and client render identical
   * (no hydration mismatch). Pass `new Date()` from a client boundary to opt in.
   */
  today?: Date
  /** Selected day, highlighted distinctly from today. */
  selectedDate?: Date
  /** Fired when a day cell is activated (only when provided — cells are inert otherwise). */
  onSelectDate?: (date: Date) => void
  /** Fired when an event chip is activated (only when provided — chips are inert otherwise). */
  onEventSelect?: (event: MonthCalendarEvent) => void
  /** First column of the week: 0 = Sunday (default), 1 = Monday. */
  weekStartsOn?: 0 | 1
  /** Max chips shown per day before collapsing to a "+N more" row. Default 3. */
  maxChipsPerDay?: number
  /** BCP-47 locale for the month title and weekday headers. Default `"en-US"`. */
  locale?: string
  /** View-mode options for the segmented control. Default Month / Week / Day. */
  viewOptions?: MonthCalendarViewOption[]
  /** Active view value (controlled). Falls back to internal state when omitted. */
  view?: string
  /** Fired when a view-mode segment is chosen. */
  onViewChange?: (view: string) => void
}

const DEFAULT_VIEW_OPTIONS: MonthCalendarViewOption[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
]

const DAYS_IN_GRID = 42
// 2023-01-01 was a Sunday — a fixed anchor for deriving localized weekday names.
const WEEKDAY_ANCHOR_YEAR = 2023

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function isSameDay(a: Date | undefined, b: Date): boolean {
  return (
    a !== undefined &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

const MonthCalendar = React.forwardRef<HTMLDivElement, MonthCalendarProps>(
  function MonthCalendar(
    {
      month,
      onMonthChange,
      events = [],
      today,
      selectedDate,
      onSelectDate,
      onEventSelect,
      weekStartsOn = 0,
      maxChipsPerDay = 3,
      locale = "en-US",
      viewOptions = DEFAULT_VIEW_OPTIONS,
      view,
      onViewChange,
      className,
      ...rest
    },
    ref
  ) {
    const [internalView, setInternalView] = React.useState<string>(
      () => view ?? viewOptions[0]?.value ?? "month"
    )
    const activeView = view ?? internalView

    const handleViewSelect = React.useCallback(
      (next: string) => {
        if (view === undefined) setInternalView(next)
        onViewChange?.(next)
      },
      [view, onViewChange]
    )

    const monthLabel = React.useMemo(
      () =>
        new Intl.DateTimeFormat(locale, {
          month: "long",
          year: "numeric",
        }).format(month),
      [locale, month]
    )

    const weekdayLabels = React.useMemo(() => {
      const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" })
      return Array.from({ length: 7 }, (_, i) =>
        formatter.format(
          new Date(WEEKDAY_ANCHOR_YEAR, 0, 1 + ((weekStartsOn + i) % 7))
        )
      )
    }, [locale, weekStartsOn])

    const cells = React.useMemo(() => {
      const first = firstOfMonth(month)
      const offset = (first.getDay() - weekStartsOn + 7) % 7
      return Array.from({ length: DAYS_IN_GRID }, (_, i) =>
        new Date(first.getFullYear(), first.getMonth(), 1 - offset + i)
      )
    }, [month, weekStartsOn])

    const eventsByDay = React.useMemo(() => {
      const map = new Map<string, MonthCalendarEvent[]>()
      for (const event of events) {
        const key = dayKey(event.date)
        const bucket = map.get(key)
        if (bucket) bucket.push(event)
        else map.set(key, [event])
      }
      return map
    }, [events])

    const dayLabelFormatter = React.useMemo(
      () =>
        new Intl.DateTimeFormat(locale, {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      [locale]
    )

    const displayedMonth = month.getMonth()

    return (
      <div
        ref={ref}
        className={cn(styles.root, className)}
        data-slot="month-calendar"
        {...rest}
      >
        <div className={styles.header} data-slot="month-calendar-header">
          <div className={styles.nav} data-slot="month-calendar-nav">
            <button
              type="button"
              className={styles.navButton}
              onClick={() => onMonthChange?.(addMonths(month, -1))}
              disabled={!onMonthChange}
              aria-label="Previous month"
              data-slot="month-calendar-prev"
            >
              <CaretLeft weight="bold" aria-hidden />
            </button>
            <h2 className={styles.monthLabel} data-slot="month-calendar-label">
              {monthLabel}
            </h2>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => onMonthChange?.(addMonths(month, 1))}
              disabled={!onMonthChange}
              aria-label="Next month"
              data-slot="month-calendar-next"
            >
              <CaretRight weight="bold" aria-hidden />
            </button>
          </div>

          {viewOptions.length > 0 ? (
            <div
              className={styles.segmented}
              role="group"
              aria-label="Calendar view"
              data-slot="month-calendar-view"
            >
              {viewOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={styles.segment}
                  data-active={option.value === activeView ? "true" : undefined}
                  aria-pressed={option.value === activeView}
                  onClick={() => handleViewSelect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.weekdays} data-slot="month-calendar-weekdays">
          {weekdayLabels.map((label, i) => (
            <div key={i} className={styles.weekday} aria-hidden="true">
              {label}
            </div>
          ))}
        </div>

        <div className={styles.grid} data-slot="month-calendar-grid">
          {cells.map((cell) => {
            const dayEvents = eventsByDay.get(dayKey(cell)) ?? []
            const visible = dayEvents.slice(0, maxChipsPerDay)
            const overflow = dayEvents.length - visible.length
            const outside = cell.getMonth() !== displayedMonth
            const isToday = isSameDay(today, cell)
            const isSelected = isSameDay(selectedDate, cell)
            const dayLabel = dayLabelFormatter.format(cell)
            const cellLabel =
              dayEvents.length > 0
                ? `${dayLabel}, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`
                : dayLabel

            const DayTag: React.ElementType = onSelectDate ? "button" : "div"

            return (
              <div
                key={dayKey(cell)}
                className={styles.cell}
                data-slot="month-calendar-day"
                data-outside={outside ? "true" : undefined}
                data-today={isToday ? "true" : undefined}
                data-selected={isSelected ? "true" : undefined}
              >
                <DayTag
                  className={styles.dayHead}
                  {...(onSelectDate
                    ? {
                        type: "button" as const,
                        onClick: () => onSelectDate(cell),
                        "aria-label": cellLabel,
                        "aria-pressed": isSelected,
                      }
                    : {})}
                  data-slot="month-calendar-day-head"
                >
                  <span className={styles.dayNumber}>{cell.getDate()}</span>
                </DayTag>

                {dayEvents.length > 0 ? (
                  <div
                    className={styles.events}
                    data-slot="month-calendar-day-events"
                  >
                    {visible.map((event) => {
                      const ChipTag: React.ElementType = onEventSelect
                        ? "button"
                        : "div"
                      return (
                        <ChipTag
                          key={event.id}
                          className={styles.chip}
                          data-status={event.status ?? "default"}
                          data-series={event.series}
                          data-slot="month-calendar-event"
                          {...(onEventSelect
                            ? {
                                type: "button" as const,
                                onClick: () => onEventSelect(event),
                              }
                            : {})}
                        >
                          <span
                            className={styles.dot}
                            data-status={event.status ?? "default"}
                            aria-hidden="true"
                          />
                          <span className={styles.chipLabel}>{event.title}</span>
                        </ChipTag>
                      )
                    })}
                    {overflow > 0 ? (
                      <div className={styles.overflow}>+{overflow} more</div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)

MonthCalendar.displayName = "MonthCalendar"

export { MonthCalendar }
