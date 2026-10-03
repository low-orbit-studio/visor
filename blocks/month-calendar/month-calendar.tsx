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

/**
 * A calendar date. A `"YYYY-MM-DD"` string is the canonical form: it is read
 * field by field and never passed through `Date`, so a stay cannot shift by a
 * day across time zones. A `Date` is read through its local calendar fields
 * (`getFullYear` / `getMonth` / `getDate`), as before — any time is ignored.
 */
export type MonthCalendarDate = string | Date

export interface MonthCalendarEvent {
  /** Stable key for the event. */
  id: string
  /**
   * The day this event lands in (legacy form of `start`). Only the calendar
   * date is used — any time component is ignored.
   */
  date?: MonthCalendarDate
  /** First day of the event, `"YYYY-MM-DD"`. Wins over `date` when both are set. */
  start?: MonthCalendarDate
  /**
   * Last day of the event, inclusive. When set the event is a span: it draws as
   * one bar across the days it covers, cut at week edges with a continued mark
   * (and stacked in lanes when spans overlap). Without it the event is a chip on
   * one day.
   */
  end?: MonthCalendarDate
  /** Chip / bar label. */
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
  /**
   * A colour token for this event, for any colour a series index cannot name (a
   * region's). A custom-property name (`"--region-berlin"`), a `var()` call or
   * any CSS colour. Wins over `series`; the tint and accent bar are derived the
   * same way.
   */
  color?: string
}

/** One week row of the grid, handed to `renderWeekDetail`. */
export interface MonthCalendarWeek {
  /** Row index in the grid, 0–5. */
  index: number
  /** First day of the row, `"YYYY-MM-DD"`. */
  start: string
  /** Last day of the row, `"YYYY-MM-DD"`. */
  end: string
  /** The seven days of the row, `"YYYY-MM-DD"`. */
  days: string[]
  /** The selected day this row holds, `"YYYY-MM-DD"`. */
  selected: string
}

/** A day cell, handed to `renderDayMark`. */
export interface MonthCalendarDay {
  /** `"YYYY-MM-DD"`. */
  date: string
  /** False for the dimmed days of the neighbouring months. */
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
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
  month: MonthCalendarDate
  /**
   * Fired with the first day of the previous / next month (a local-midnight
   * `Date`) when the month-nav arrows are used.
   */
  onMonthChange?: (month: Date) => void
  /** Events to place into day cells. */
  events?: MonthCalendarEvent[]
  /**
   * The day the grid marks as "today". Omit to mark none — the block never
   * reads the system clock itself, keeping server and client render identical
   * (no hydration mismatch). Pass `new Date()` from a client boundary to opt in.
   */
  today?: MonthCalendarDate
  /** Selected day, highlighted distinctly from today. */
  selectedDate?: MonthCalendarDate
  /**
   * Fired when a day cell is activated (only when provided — cells are inert
   * otherwise). Receives a local-midnight `Date` and the `"YYYY-MM-DD"` string.
   */
  onSelectDate?: (date: Date, iso: string) => void
  /**
   * Fired when an event chip or span bar is clicked (only when provided).
   * Span bars are pointer-only art; the keyboard route to a span is its day.
   */
  onEventSelect?: (event: MonthCalendarEvent) => void
  /** First column of the week: 0 = Sunday (default), 1 = Monday. */
  weekStartsOn?: 0 | 1
  /** Max chips shown per day before collapsing to a "+N more" row. Default 3. */
  maxChipsPerDay?: number
  /**
   * Max lanes of overlapping span bars per week before a day shows "+N" for the
   * spans that did not fit. Default 3. The "+N" opens the day.
   */
  maxLanes?: number
  /**
   * Content for the slot under the week that holds `selectedDate`. The slot
   * opens in the page flow, pushes the later weeks down, points an arrow at the
   * selected day, and takes focus when the day is activated. Return nothing to
   * keep it closed.
   */
  renderWeekDetail?: (week: MonthCalendarWeek) => React.ReactNode
  /** A consumer mark in each day cell's head, opposite the day number (a count, a range end). */
  renderDayMark?: (day: MonthCalendarDay) => React.ReactNode
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

const WEEKS = 6
const DAYS_IN_WEEK = 7
const DAYS_IN_GRID = WEEKS * DAYS_IN_WEEK
const MS_PER_DAY = 86_400_000
// 2023-01-01 was a Sunday — a fixed anchor for deriving localized weekday names.
const SUNDAY_ANCHOR = Date.UTC(2023, 0, 1) / MS_PER_DAY

/*
 * Dates are handled as integer day numbers (days since 1970-01-01, UTC). A
 * calendar date has no time zone, so every step — parsing, ordering, adding a
 * day, reading the weekday, formatting — runs on UTC fields and never builds a
 * local-time Date from an instant. A DST edge cannot move a day.
 */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/

function toDayNumber(value: MonthCalendarDate | undefined): number | undefined {
  if (value === undefined) return undefined
  let y: number
  let m: number
  let d: number
  if (typeof value === "string") {
    const match = ISO_DATE.exec(value)
    if (!match) return undefined
    y = Number(match[1])
    m = Number(match[2]) - 1
    d = Number(match[3])
  } else {
    y = value.getFullYear()
    m = value.getMonth()
    d = value.getDate()
  }
  const n = Date.UTC(y, m, d) / MS_PER_DAY
  return Number.isNaN(n) ? undefined : n
}

function utcDate(day: number): Date {
  return new Date(day * MS_PER_DAY)
}

function toIso(day: number): string {
  return utcDate(day).toISOString().slice(0, 10)
}

/** A local-midnight `Date` for the calendar day — what the callbacks hand back. */
function toLocalDate(day: number): Date {
  const d = utcDate(day)
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function firstOfMonthDay(day: number): number {
  const d = utcDate(day)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) / MS_PER_DAY
}

function monthOffsetDay(day: number, delta: number): number {
  const d = utcDate(day)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1) / MS_PER_DAY
}

/** Resolve a colour token: `--name` becomes `var(--name)`, anything else passes through. */
function resolveColor(color: string): string {
  return color.startsWith("--") ? `var(${color})` : color
}

interface NormalizedEvent {
  event: MonthCalendarEvent
  start: number
  /** Inclusive last day; undefined for a single-day chip. */
  end: number | undefined
}

interface Segment {
  item: NormalizedEvent
  /** 0-based column of the first day this segment covers in its week. */
  col: number
  span: number
  continuedBefore: boolean
  continuedAfter: boolean
  lane: number
}

function normalize(events: MonthCalendarEvent[]): NormalizedEvent[] {
  const out: NormalizedEvent[] = []
  for (const event of events) {
    const start = toDayNumber(event.start ?? event.date)
    if (start === undefined) continue
    const rawEnd = toDayNumber(event.end)
    out.push({
      event,
      start,
      end: rawEnd === undefined ? undefined : Math.max(rawEnd, start),
    })
  }
  return out
}

/** Cut each span at the week's edges and give it the lowest lane it fits in. */
function layoutWeek(weekStart: number, spans: NormalizedEvent[]): Segment[] {
  const weekEnd = weekStart + DAYS_IN_WEEK - 1
  const ordered = spans
    .filter((s) => s.start <= weekEnd && (s.end as number) >= weekStart)
    .sort((a, b) => a.start - b.start || (b.end as number) - (a.end as number))
  const laneEnds: number[] = []
  return ordered.map((item) => {
    const first = Math.max(item.start, weekStart)
    const last = Math.min(item.end as number, weekEnd)
    let lane = laneEnds.findIndex((end) => end < first)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = last
    return {
      item,
      col: first - weekStart,
      span: last - first + 1,
      continuedBefore: item.start < weekStart,
      continuedAfter: (item.end as number) > weekEnd,
      lane,
    }
  })
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

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
      maxLanes = 3,
      renderWeekDetail,
      renderDayMark,
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

    const slotId = React.useId()
    const gridRef = React.useRef<HTMLDivElement>(null)
    const slotRef = React.useRef<HTMLDivElement>(null)
    const focusSlotNext = React.useRef(false)
    const [focusedDay, setFocusedDay] = React.useState<number | undefined>()

    const monthDay = toDayNumber(month) ?? 0
    const firstDay = firstOfMonthDay(monthDay)
    const displayedMonth = utcDate(firstDay).getUTCMonth()
    const todayDay = toDayNumber(today)
    const selectedDay = toDayNumber(selectedDate)

    const formatUtc = React.useCallback(
      (options: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }),
      [locale]
    )

    const monthLabel = React.useMemo(
      () =>
        formatUtc({ month: "long", year: "numeric" }).format(utcDate(firstDay)),
      [formatUtc, firstDay]
    )

    const weekdayLabels = React.useMemo(() => {
      const formatter = formatUtc({ weekday: "short" })
      return Array.from({ length: DAYS_IN_WEEK }, (_, i) =>
        formatter.format(
          utcDate(SUNDAY_ANCHOR + ((weekStartsOn + i) % DAYS_IN_WEEK))
        )
      )
    }, [formatUtc, weekStartsOn])

    // Day number of the grid's first cell — the weekday the month starts on,
    // read from UTC fields, backed up to the week start.
    const gridStart = React.useMemo(() => {
      const offset = (utcDate(firstDay).getUTCDay() - weekStartsOn + 7) % 7
      return firstDay - offset
    }, [firstDay, weekStartsOn])

    const normalized = React.useMemo(() => normalize(events), [events])

    const chipsByDay = React.useMemo(() => {
      const map = new Map<number, MonthCalendarEvent[]>()
      for (const { event, start, end } of normalized) {
        if (end !== undefined) continue
        const bucket = map.get(start)
        if (bucket) bucket.push(event)
        else map.set(start, [event])
      }
      return map
    }, [normalized])

    const spans = React.useMemo(
      () => normalized.filter((n) => n.end !== undefined),
      [normalized]
    )

    const weeks = React.useMemo(
      () =>
        Array.from({ length: WEEKS }, (_, w) => {
          const start = gridStart + w * DAYS_IN_WEEK
          const segments = layoutWeek(start, spans)
          const used = segments.reduce((max, s) => Math.max(max, s.lane + 1), 0)
          return { start, segments, lanes: Math.min(used, Math.max(maxLanes, 0)) }
        }),
      [gridStart, spans, maxLanes]
    )

    const dayLabelFormatter = React.useMemo(
      () => formatUtc({ month: "long", day: "numeric", year: "numeric" }),
      [formatUtc]
    )

    /** "July 12, 2026, Berlin stay, day 2 of 4, Launch party" */
    const labelFor = (day: number, segments: Segment[]): string => {
      const parts = [dayLabelFormatter.format(utcDate(day))]
      for (const { item } of segments) {
        const end = item.end as number
        if (day < item.start || day > end) continue
        parts.push(
          `${item.event.title}, day ${day - item.start + 1} of ${end - item.start + 1}`
        )
      }
      for (const event of chipsByDay.get(day) ?? []) parts.push(event.title)
      return parts.join(", ")
    }

    // The one roving tab stop: the last focused day, else the selected day,
    // today, or the first of the month.
    const inGrid = (day: number | undefined): day is number =>
      day !== undefined && day >= gridStart && day < gridStart + DAYS_IN_GRID
    const tabDay = inGrid(focusedDay)
      ? focusedDay
      : inGrid(selectedDay)
        ? selectedDay
        : inGrid(todayDay)
          ? todayDay
          : firstDay

    const selectedWeek =
      selectedDay !== undefined && inGrid(selectedDay)
        ? Math.floor((selectedDay - gridStart) / DAYS_IN_WEEK)
        : -1
    const detail =
      renderWeekDetail && selectedWeek >= 0 && selectedDay !== undefined
        ? renderWeekDetail({
            index: selectedWeek,
            start: toIso(weeks[selectedWeek]!.start),
            end: toIso(weeks[selectedWeek]!.start + DAYS_IN_WEEK - 1),
            days: Array.from({ length: DAYS_IN_WEEK }, (_, i) =>
              toIso(weeks[selectedWeek]!.start + i)
            ),
            selected: toIso(selectedDay),
          })
        : null
    const slotOpen = detail !== null && detail !== undefined && detail !== false

    // Focus moves into the slot when a day is activated and opens it — never
    // because a consumer changed `selectedDate` on its own.
    React.useEffect(() => {
      if (!focusSlotNext.current || !slotRef.current) return
      focusSlotNext.current = false
      const target = slotRef.current.querySelector<HTMLElement>(FOCUSABLE)
      ;(target ?? slotRef.current).focus()
    })

    const focusDay = (day: number) => {
      const cell = gridRef.current?.querySelector<HTMLElement>(
        `[data-mc-day="${day}"]`
      )
      const target = cell?.matches("[data-mc-focus]")
        ? cell
        : cell?.querySelector<HTMLElement>("[data-mc-focus]")
      target?.focus()
    }

    const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      const cell = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-mc-day]"
      )
      if (!cell) return
      const day = Number(cell.dataset.mcDay)
      const col = (day - gridStart) % DAYS_IN_WEEK
      const delta: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -DAYS_IN_WEEK,
        ArrowDown: DAYS_IN_WEEK,
        Home: -col,
        End: DAYS_IN_WEEK - 1 - col,
      }
      const step = delta[event.key]
      if (step === undefined) return
      event.preventDefault()
      const next = Math.min(
        Math.max(day + step, gridStart),
        gridStart + DAYS_IN_GRID - 1
      )
      setFocusedDay(next)
      focusDay(next)
    }

    const select = (day: number) => {
      if (renderWeekDetail) {
        focusSlotNext.current = true
        // A re-select that changes nothing renders nothing, so drop the intent.
        setTimeout(() => {
          focusSlotNext.current = false
        }, 0)
      }
      onSelectDate?.(toLocalDate(day), toIso(day))
    }

    const renderChip = (event: MonthCalendarEvent) => {
      const ChipTag: React.ElementType = onEventSelect ? "button" : "div"
      const tinted = event.color !== undefined || event.series !== undefined
      return (
        <ChipTag
          key={event.id}
          className={styles.chip}
          data-status={event.status ?? "default"}
          data-series={event.series}
          data-tinted={tinted ? "true" : undefined}
          style={
            event.color !== undefined
              ? ({ "--mc-series": resolveColor(event.color) } as React.CSSProperties)
              : undefined
          }
          data-slot="month-calendar-event"
          {...(onEventSelect
            ? { type: "button" as const, onClick: () => onEventSelect(event) }
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
    }

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
              onClick={() => onMonthChange?.(toLocalDate(monthOffsetDay(firstDay, -1)))}
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
              onClick={() => onMonthChange?.(toLocalDate(monthOffsetDay(firstDay, 1)))}
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

        <div
          ref={gridRef}
          className={styles.grid}
          role="grid"
          aria-label={monthLabel}
          data-slot="month-calendar-grid"
          onKeyDown={handleGridKeyDown}
        >
          <div
            className={styles.weekdays}
            role="row"
            data-slot="month-calendar-weekdays"
          >
            {weekdayLabels.map((label, i) => (
              <div
                key={i}
                className={styles.weekday}
                role="columnheader"
                aria-label={formatUtc({ weekday: "long" }).format(
                  utcDate(SUNDAY_ANCHOR + ((weekStartsOn + i) % DAYS_IN_WEEK))
                )}
              >
                <span aria-hidden="true">{label}</span>
              </div>
            ))}
          </div>

          {weeks.map((week, w) => (
            <React.Fragment key={week.start}>
              <div
                className={styles.week}
                role="row"
                data-slot="month-calendar-week"
                style={{ "--mc-lanes": week.lanes } as React.CSSProperties}
              >
                {Array.from({ length: DAYS_IN_WEEK }, (_, c) => {
                  const day = week.start + c
                  const chips = chipsByDay.get(day) ?? []
                  const visible = chips.slice(0, maxChipsPerDay)
                  const overflow = chips.length - visible.length
                  const hiddenSpans = week.segments.filter(
                    (s) =>
                      s.lane >= week.lanes &&
                      day >= s.item.start &&
                      day <= (s.item.end as number)
                  ).length
                  const outside = utcDate(day).getUTCMonth() !== displayedMonth
                  const isToday = day === todayDay
                  const isSelected = day === selectedDay
                  const label = labelFor(day, week.segments)
                  const iso = toIso(day)
                  const expanded = isSelected && slotOpen
                  const isTab = day === tabDay
                  const mark = renderDayMark?.({
                    date: iso,
                    inMonth: !outside,
                    isToday,
                    isSelected,
                  })

                  return (
                    <div
                      key={day}
                      className={styles.cell}
                      role="gridcell"
                      aria-selected={isSelected}
                      data-mc-day={day}
                      data-date={iso}
                      data-slot="month-calendar-day"
                      data-outside={outside ? "true" : undefined}
                      data-today={isToday ? "true" : undefined}
                      data-selected={isSelected ? "true" : undefined}
                      {...(onSelectDate
                        ? {}
                        : {
                            "aria-label": label,
                            "aria-current": isToday ? ("date" as const) : undefined,
                            tabIndex: isTab ? 0 : -1,
                            "data-mc-focus": "",
                            onFocus: () => setFocusedDay(day),
                          })}
                    >
                      <div className={styles.top}>
                        {onSelectDate ? (
                          <button
                            type="button"
                            className={styles.dayHead}
                            onClick={() => select(day)}
                            onFocus={() => setFocusedDay(day)}
                            aria-label={label}
                            aria-current={isToday ? "date" : undefined}
                            aria-expanded={expanded ? true : undefined}
                            aria-controls={expanded ? slotId : undefined}
                            tabIndex={isTab ? 0 : -1}
                            data-mc-focus=""
                            data-slot="month-calendar-day-head"
                          >
                            <span className={styles.dayNumber}>
                              {utcDate(day).getUTCDate()}
                            </span>
                          </button>
                        ) : (
                          <div
                            className={styles.dayHead}
                            data-slot="month-calendar-day-head"
                          >
                            <span className={styles.dayNumber} aria-hidden="true">
                              {utcDate(day).getUTCDate()}
                            </span>
                          </div>
                        )}
                        {mark !== undefined && mark !== null && mark !== false ? (
                          <span
                            className={styles.mark}
                            data-slot="month-calendar-day-mark"
                          >
                            {mark}
                          </span>
                        ) : null}
                      </div>

                      {week.lanes > 0 ? (
                        <div className={styles.lanes} aria-hidden="true" />
                      ) : null}
                      {hiddenSpans > 0 ? (
                        <span
                          className={styles.moreSpans}
                          aria-hidden="true"
                          data-slot="month-calendar-more-spans"
                          onClick={onSelectDate ? () => select(day) : undefined}
                        >
                          +{hiddenSpans}
                        </span>
                      ) : null}

                      {chips.length > 0 ? (
                        <div
                          className={styles.events}
                          data-slot="month-calendar-day-events"
                        >
                          {visible.map(renderChip)}
                          {overflow > 0 ? (
                            <div className={styles.overflow}>+{overflow} more</div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })}

                {week.segments.length > 0 ? (
                  <div
                    className={styles.bars}
                    aria-hidden="true"
                    data-slot="month-calendar-bars"
                  >
                    {week.segments
                      .filter((s) => s.lane < week.lanes)
                      .map((s) => {
                        const { event } = s.item
                        const tinted =
                          event.color !== undefined || event.series !== undefined
                        return (
                          <div
                            key={`${event.id}-${s.col}`}
                            className={styles.bar}
                            data-slot="month-calendar-span"
                            data-event-id={event.id}
                            data-status={event.status ?? "default"}
                            data-series={event.series}
                            data-tinted={tinted ? "true" : undefined}
                            data-continued-before={s.continuedBefore ? "true" : undefined}
                            data-continued-after={s.continuedAfter ? "true" : undefined}
                            data-clickable={onEventSelect ? "true" : undefined}
                            onClick={
                              onEventSelect ? () => onEventSelect(event) : undefined
                            }
                            style={
                              {
                                gridColumn: `${s.col + 1} / span ${s.span}`,
                                "--mc-lane": s.lane,
                                ...(event.color !== undefined
                                  ? { "--mc-series": resolveColor(event.color) }
                                  : {}),
                              } as React.CSSProperties
                            }
                          >
                            {s.continuedBefore ? (
                              <CaretLeft
                                className={styles.barCaret}
                                weight="bold"
                                aria-hidden
                                data-slot="month-calendar-span-continued-before"
                              />
                            ) : null}
                            <span className={styles.barLabel}>{event.title}</span>
                            {s.continuedAfter ? (
                              <CaretRight
                                className={styles.barCaret}
                                weight="bold"
                                aria-hidden
                                data-slot="month-calendar-span-continued-after"
                              />
                            ) : null}
                          </div>
                        )
                      })}
                  </div>
                ) : null}
              </div>

              {slotOpen && w === selectedWeek && selectedDay !== undefined ? (
                <div
                  className={styles.slotRow}
                  role="row"
                  data-slot="month-calendar-week-detail"
                  style={
                    {
                      "--mc-arrow-col": (selectedDay - gridStart) % DAYS_IN_WEEK,
                    } as React.CSSProperties
                  }
                >
                  <div role="gridcell" aria-colspan={DAYS_IN_WEEK} className={styles.slotCell}>
                    <div
                      ref={slotRef}
                      id={slotId}
                      className={styles.slot}
                      role="region"
                      aria-label={dayLabelFormatter.format(utcDate(selectedDay))}
                      tabIndex={-1}
                    >
                      {detail}
                    </div>
                  </div>
                </div>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }
)

MonthCalendar.displayName = "MonthCalendar"

export { MonthCalendar }
