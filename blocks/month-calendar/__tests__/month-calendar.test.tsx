import { readFileSync } from "node:fs"
import { join } from "node:path"
import * as React from "react"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"

import {
  MonthCalendar,
  type MonthCalendarEvent,
} from "../month-calendar"
import { checkA11y } from "../../../test-utils/a11y"

// July 2026 — a stable anchor month for deterministic grid assertions.
const JULY_2026 = new Date(2026, 6, 15)

const events: MonthCalendarEvent[] = [
  { id: "a", date: new Date(2026, 6, 4), title: "Launch party", status: "success", series: 1 },
  { id: "b", date: new Date(2026, 6, 4), title: "Standup", status: "info", series: 2 },
  { id: "c", date: new Date(2026, 6, 4), title: "Retro", status: "warning" },
  { id: "d", date: new Date(2026, 6, 4), title: "Overflow one" },
  { id: "e", date: new Date(2026, 6, 18), title: "Deadline", status: "danger" },
]

describe("MonthCalendar", () => {
  // ─── Grid structure ──────────────────────────────────────────────────────

  it("renders a 6×7 grid of 42 day cells", () => {
    const { container } = render(<MonthCalendar month={JULY_2026} />)
    expect(
      container.querySelectorAll('[data-slot="month-calendar-day"]')
    ).toHaveLength(42)
  })

  it("renders a 7-column weekday header", () => {
    const { container } = render(<MonthCalendar month={JULY_2026} />)
    const weekdays = container.querySelector(
      '[data-slot="month-calendar-weekdays"]'
    )
    expect(weekdays?.children).toHaveLength(7)
  })

  it("renders the localized month + year label", () => {
    render(<MonthCalendar month={JULY_2026} />)
    expect(screen.getByText("July 2026")).toBeInTheDocument()
  })

  it("marks days outside the displayed month", () => {
    const { container } = render(<MonthCalendar month={JULY_2026} />)
    // July 1 2026 is a Wednesday → 3 leading days from the previous month.
    const outside = container.querySelectorAll(
      '[data-slot="month-calendar-day"][data-outside="true"]'
    )
    expect(outside.length).toBeGreaterThan(0)
  })

  it("honors weekStartsOn=1 (Monday-first header)", () => {
    const { container } = render(
      <MonthCalendar month={JULY_2026} weekStartsOn={1} />
    )
    const first = container.querySelector(
      '[data-slot="month-calendar-weekdays"]'
    )?.firstElementChild
    expect(first?.textContent).toBe("Mon")
  })

  // ─── Month navigation ────────────────────────────────────────────────────

  it("fires onMonthChange with the previous/next month", () => {
    const onMonthChange = vi.fn()
    render(<MonthCalendar month={JULY_2026} onMonthChange={onMonthChange} />)

    fireEvent.click(screen.getByLabelText("Previous month"))
    fireEvent.click(screen.getByLabelText("Next month"))

    expect(onMonthChange).toHaveBeenCalledTimes(2)
    expect(onMonthChange.mock.calls[0][0].getMonth()).toBe(5) // June
    expect(onMonthChange.mock.calls[1][0].getMonth()).toBe(7) // August
  })

  it("disables nav arrows when onMonthChange is omitted", () => {
    render(<MonthCalendar month={JULY_2026} />)
    expect(screen.getByLabelText("Previous month")).toBeDisabled()
    expect(screen.getByLabelText("Next month")).toBeDisabled()
  })

  // ─── Event chips ─────────────────────────────────────────────────────────

  it("places event chips in the correct day cell", () => {
    render(<MonthCalendar month={JULY_2026} events={events} maxChipsPerDay={10} />)
    expect(screen.getByText("Launch party")).toBeInTheDocument()
    expect(screen.getByText("Deadline")).toBeInTheDocument()
  })

  it("collapses to a +N more row past maxChipsPerDay", () => {
    render(<MonthCalendar month={JULY_2026} events={events} maxChipsPerDay={3} />)
    // Day 4 has 4 events → 3 shown, 1 collapsed.
    expect(screen.getByText("+1 more")).toBeInTheDocument()
    expect(screen.queryByText("Overflow one")).not.toBeInTheDocument()
  })

  it("carries the status dot tone via data-status", () => {
    const { container } = render(
      <MonthCalendar month={JULY_2026} events={events} maxChipsPerDay={10} />
    )
    expect(
      container.querySelector('.dot[data-status="success"]') ??
        container.querySelector('[data-slot="month-calendar-event"] [data-status="success"]')
    ).toBeTruthy()
  })

  it("carries the series tint via data-series", () => {
    const { container } = render(
      <MonthCalendar month={JULY_2026} events={events} maxChipsPerDay={10} />
    )
    const chips = container.querySelectorAll(
      '[data-slot="month-calendar-event"]'
    )
    const withSeries = Array.from(chips).filter((c) =>
      c.getAttribute("data-series")
    )
    expect(withSeries.length).toBeGreaterThanOrEqual(2)
  })

  it("renders chips as buttons and fires onEventSelect", () => {
    const onEventSelect = vi.fn()
    render(
      <MonthCalendar
        month={JULY_2026}
        events={events}
        onEventSelect={onEventSelect}
        maxChipsPerDay={10}
      />
    )
    fireEvent.click(screen.getByText("Deadline"))
    expect(onEventSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "e" })
    )
  })

  // ─── Day selection ───────────────────────────────────────────────────────

  it("renders day heads as buttons and fires onSelectDate", () => {
    const onSelectDate = vi.fn()
    render(<MonthCalendar month={JULY_2026} onSelectDate={onSelectDate} />)
    // "July 18, 2026" cell.
    fireEvent.click(screen.getByRole("button", { name: /July 18, 2026/ }))
    expect(onSelectDate).toHaveBeenCalledTimes(1)
    expect(onSelectDate.mock.calls[0][0].getDate()).toBe(18)
  })

  it("highlights today and selected days", () => {
    const { container } = render(
      <MonthCalendar
        month={JULY_2026}
        today={new Date(2026, 6, 10)}
        selectedDate={new Date(2026, 6, 20)}
      />
    )
    expect(
      container.querySelector('[data-slot="month-calendar-day"][data-today="true"]')
    ).toBeTruthy()
    expect(
      container.querySelector('[data-slot="month-calendar-day"][data-selected="true"]')
    ).toBeTruthy()
  })

  // ─── View-mode segmented control ─────────────────────────────────────────

  it("renders the view-mode segmented control with a default active view", () => {
    render(<MonthCalendar month={JULY_2026} />)
    const monthSegment = screen.getByRole("button", { name: "Month" })
    expect(monthSegment).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  it("fires onViewChange when a segment is chosen", () => {
    const onViewChange = vi.fn()
    render(<MonthCalendar month={JULY_2026} onViewChange={onViewChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Week" }))
    expect(onViewChange).toHaveBeenCalledWith("week")
  })

  // ─── Accessibility ───────────────────────────────────────────────────────

  it("has no axe violations (static)", async () => {
    const { container } = render(
      <MonthCalendar month={JULY_2026} events={events} today={new Date(2026, 6, 10)} />
    )
    await checkA11y(container)
  })

  it("has no axe violations (interactive)", async () => {
    const { container } = render(
      <MonthCalendar
        month={JULY_2026}
        events={events}
        onMonthChange={vi.fn()}
        onSelectDate={vi.fn()}
        onEventSelect={vi.fn()}
      />
    )
    await checkA11y(container)
  })

  // ─── Spans (VI-669) ──────────────────────────────────────────────────────

  const bars = (container: HTMLElement, id?: string) =>
    Array.from(
      container.querySelectorAll<HTMLElement>(
        `[data-slot="month-calendar-span"]${id ? `[data-event-id="${id}"]` : ""}`
      )
    )

  it("draws a span inside one week as a single bar over its columns", () => {
    const { container } = render(
      <MonthCalendar
        month="2026-07-01"
        events={[{ id: "s", start: "2026-07-07", end: "2026-07-09", title: "Stay" }]}
      />
    )
    const [bar, ...more] = bars(container, "s")
    expect(more).toHaveLength(0)
    // 2026-07-07 is a Tuesday: column 3 of a Sunday-first week, three days wide.
    expect(bar!.style.gridColumn).toBe("3 / span 3")
    expect(bar!).not.toHaveAttribute("data-continued-before")
    expect(bar!).not.toHaveAttribute("data-continued-after")
  })

  it("splits a span that crosses a week edge into two segments with a continued mark", () => {
    const { container } = render(
      <MonthCalendar
        month="2026-07-01"
        events={[{ id: "s", start: "2026-07-10", end: "2026-07-14", title: "Berlin stay" }]}
      />
    )
    const segments = bars(container, "s")
    expect(segments).toHaveLength(2)
    const [first, second] = segments as [HTMLElement, HTMLElement]
    // Fri 10 – Sat 11, then Sun 12 – Tue 14.
    expect(first.style.gridColumn).toBe("6 / span 2")
    expect(first).toHaveAttribute("data-continued-after", "true")
    expect(first).not.toHaveAttribute("data-continued-before")
    expect(first.querySelector('[data-slot="month-calendar-span-continued-after"]')).toBeTruthy()
    expect(second.style.gridColumn).toBe("1 / span 3")
    expect(second).toHaveAttribute("data-continued-before", "true")
    expect(second).not.toHaveAttribute("data-continued-after")
    expect(second.querySelector('[data-slot="month-calendar-span-continued-before"]')).toBeTruthy()
    // Each segment sits in its own week row.
    const rows = container.querySelectorAll('[data-slot="month-calendar-week"]')
    expect(Array.from(rows).filter((r) => r.contains(first) || r.contains(second))).toHaveLength(2)
  })

  it("honors weekStartsOn when cutting a span", () => {
    const { container } = render(
      <MonthCalendar
        month="2026-07-01"
        weekStartsOn={1}
        events={[{ id: "s", start: "2026-07-10", end: "2026-07-14", title: "Stay" }]}
      />
    )
    // Monday-first: Fri 10 – Sun 12, then Mon 13 – Tue 14.
    expect(bars(container, "s").map((b) => b.style.gridColumn)).toEqual([
      "5 / span 3",
      "1 / span 2",
    ])
  })

  it("keeps bars out of the accessibility tree", () => {
    const { container } = render(
      <MonthCalendar
        month="2026-07-01"
        events={[{ id: "s", start: "2026-07-07", end: "2026-07-09", title: "Stay" }]}
      />
    )
    for (const layer of container.querySelectorAll('[data-slot="month-calendar-bars"]')) {
      expect(layer).toHaveAttribute("aria-hidden", "true")
    }
  })

  it("names each day's events in its cell, with the day of the span", () => {
    render(
      <MonthCalendar
        month="2026-06-01"
        onSelectDate={vi.fn()}
        events={[
          { id: "s", start: "2026-06-11", end: "2026-06-14", title: "Berlin stay" },
          { id: "c", date: "2026-06-12", title: "Soundcheck" },
        ]}
      />
    )
    expect(
      screen.getByRole("button", {
        name: "June 12, 2026, Berlin stay, day 2 of 4, Soundcheck",
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "June 14, 2026, Berlin stay, day 4 of 4" })
    ).toBeInTheDocument()
  })

  it("stacks overlapping spans in lanes and shows +N past maxLanes", () => {
    const overlap: MonthCalendarEvent[] = ["a", "b", "c", "d"].map((id) => ({
      id,
      start: "2026-07-07",
      end: "2026-07-09",
      title: `Stay ${id}`,
    }))
    const { container } = render(<MonthCalendar month="2026-07-01" events={overlap} />)
    // Three lanes drawn, the fourth span not drawn.
    const lanes = bars(container).map((b) => b.style.getPropertyValue("--mc-lane"))
    expect(lanes.sort()).toEqual(["0", "1", "2"])
    expect(bars(container, "d")).toHaveLength(0)
    // Each of the three days the spans share reads "+1".
    const more = container.querySelectorAll('[data-slot="month-calendar-more-spans"]')
    expect(Array.from(more).map((m) => m.textContent)).toEqual(["+1", "+1", "+1"])
    // The hidden span is still named by the day cell.
    expect(
      screen.getByLabelText(/July 7, 2026.*Stay d, day 1 of 3/)
    ).toBeInTheDocument()
  })

  it("lets a span reuse a lane freed earlier in the week", () => {
    const { container } = render(
      <MonthCalendar
        month="2026-07-01"
        events={[
          { id: "a", start: "2026-07-05", end: "2026-07-06", title: "A" },
          { id: "b", start: "2026-07-07", end: "2026-07-08", title: "B" },
        ]}
      />
    )
    expect(bars(container, "b")[0]!.style.getPropertyValue("--mc-lane")).toBe("0")
  })

  it("opens the day from the +N", () => {
    const onSelectDate = vi.fn()
    const overlap: MonthCalendarEvent[] = ["a", "b"].map((id) => ({
      id,
      start: "2026-07-07",
      end: "2026-07-07",
      title: id,
    }))
    const { container } = render(
      <MonthCalendar
        month="2026-07-01"
        maxLanes={1}
        events={overlap}
        onSelectDate={onSelectDate}
      />
    )
    fireEvent.click(container.querySelector('[data-slot="month-calendar-more-spans"]')!)
    expect(onSelectDate).toHaveBeenCalledTimes(1)
    expect(onSelectDate.mock.calls[0]![1]).toBe("2026-07-07")
  })

  it("takes an event colour token as well as a series", () => {
    const { container } = render(
      <MonthCalendar
        month="2026-07-01"
        events={[
          { id: "s", start: "2026-07-07", end: "2026-07-08", title: "Region", color: "--region-berlin", series: 2 },
          { id: "v", start: "2026-07-14", end: "2026-07-15", title: "Var", color: "var(--chart-4)" },
          { id: "c", date: "2026-07-20", title: "Chip", color: "--region-lisbon" },
        ]}
      />
    )
    expect(bars(container, "s")[0]!.style.getPropertyValue("--mc-series")).toBe("var(--region-berlin)")
    expect(bars(container, "v")[0]!.style.getPropertyValue("--mc-series")).toBe("var(--chart-4)")
    const chip = container.querySelector<HTMLElement>('[data-slot="month-calendar-event"]')!
    expect(chip.style.getPropertyValue("--mc-series")).toBe("var(--region-lisbon)")
    expect(chip).toHaveAttribute("data-tinted", "true")
  })

  it("fires onEventSelect from a bar click", () => {
    const onEventSelect = vi.fn()
    const { container } = render(
      <MonthCalendar
        month="2026-07-01"
        onEventSelect={onEventSelect}
        events={[{ id: "s", start: "2026-07-07", end: "2026-07-08", title: "Stay" }]}
      />
    )
    fireEvent.click(bars(container, "s")[0]!)
    expect(onEventSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "s" }))
  })

  // ─── Day mark ────────────────────────────────────────────────────────────

  it("renders a consumer mark in the day cell", () => {
    render(
      <MonthCalendar
        month="2026-07-01"
        renderDayMark={(day) => (day.date === "2026-07-17" ? <b>3 left</b> : null)}
      />
    )
    const cell = document.querySelector('[data-date="2026-07-17"]') as HTMLElement
    expect(within(cell).getByText("3 left")).toBeInTheDocument()
    expect(screen.getAllByText("3 left")).toHaveLength(1)
  })

  // ─── Week detail slot ────────────────────────────────────────────────────

  it("opens the detail slot under the week that holds selectedDate", () => {
    const renderWeekDetail = vi.fn((week: { start: string }) => (
      <p>Detail for {week.start}</p>
    ))
    const { container } = render(
      <MonthCalendar
        month="2026-07-01"
        selectedDate="2026-07-22"
        renderWeekDetail={renderWeekDetail}
      />
    )
    expect(renderWeekDetail).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 3,
        start: "2026-07-19",
        end: "2026-07-25",
        selected: "2026-07-22",
      })
    )
    const rows = Array.from(container.querySelectorAll('[role="grid"] > [role="row"]'))
    const slotIndex = rows.findIndex((r) => r.matches('[data-slot="month-calendar-week-detail"]'))
    // Header row + weeks 0-3, then the slot, then weeks 4-5.
    expect(slotIndex).toBe(5)
    expect(rows[slotIndex - 1]!.querySelector('[data-date="2026-07-22"]')).toBeTruthy()
    expect(rows[slotIndex]).toHaveTextContent("Detail for 2026-07-19")
    expect(rows).toHaveLength(8)
  })

  it("keeps the slot closed without a selected day, or when the render returns nothing", () => {
    const { container, rerender } = render(
      <MonthCalendar month="2026-07-01" renderWeekDetail={() => <p>x</p>} />
    )
    expect(container.querySelector('[data-slot="month-calendar-week-detail"]')).toBeNull()
    rerender(
      <MonthCalendar
        month="2026-07-01"
        selectedDate="2026-07-22"
        renderWeekDetail={() => null}
      />
    )
    expect(container.querySelector('[data-slot="month-calendar-week-detail"]')).toBeNull()
  })

  it("sets aria-expanded on the selected day while its slot is open, and moves focus into the slot", () => {
    function Harness() {
      const [selected, setSelected] = React.useState<string | undefined>()
      return (
        <MonthCalendar
          month="2026-07-01"
          selectedDate={selected}
          onSelectDate={(_, iso) => setSelected(iso)}
          renderWeekDetail={() => (
            <button type="button">Book this day</button>
          )}
        />
      )
    }
    render(<Harness />)
    const day = () => screen.getByRole("button", { name: /July 22, 2026/ })
    expect(day()).not.toHaveAttribute("aria-expanded")
    fireEvent.click(day())
    expect(day()).toHaveAttribute("aria-expanded", "true")
    expect(day()).toHaveAttribute("aria-controls", screen.getByRole("region").id)
    expect(screen.getByRole("button", { name: "Book this day" })).toHaveFocus()
    // Another day in the same grid is not expanded.
    expect(screen.getByRole("button", { name: /July 21, 2026/ })).not.toHaveAttribute("aria-expanded")
  })

  it("does not steal focus when selectedDate changes without a click", () => {
    const { rerender } = render(
      <MonthCalendar month="2026-07-01" renderWeekDetail={() => <button type="button">Inside</button>} />
    )
    rerender(
      <MonthCalendar
        month="2026-07-01"
        selectedDate="2026-07-22"
        renderWeekDetail={() => <button type="button">Inside</button>}
      />
    )
    expect(screen.getByRole("button", { name: "Inside" })).not.toHaveFocus()
  })

  it("points the slot's arrow at the selected day's column", () => {
    const { container } = render(
      <MonthCalendar
        month="2026-07-01"
        selectedDate="2026-07-22"
        renderWeekDetail={() => <p>x</p>}
      />
    )
    const row = container.querySelector<HTMLElement>('[data-slot="month-calendar-week-detail"]')!
    // Wednesday, third column from a Sunday start: index 3.
    expect(row.style.getPropertyValue("--mc-arrow-col")).toBe("3")
  })

  // ─── Grid semantics + keyboard ───────────────────────────────────────────

  it("is a grid of rows and cells", () => {
    render(<MonthCalendar month="2026-07-01" onSelectDate={vi.fn()} />)
    expect(screen.getByRole("grid", { name: "July 2026" })).toBeInTheDocument()
    expect(screen.getAllByRole("columnheader")).toHaveLength(7)
    expect(screen.getAllByRole("gridcell")).toHaveLength(42)
  })

  it("moves focus by day with the arrow keys, one tab stop for the grid", () => {
    render(
      <MonthCalendar
        month="2026-07-01"
        selectedDate="2026-07-15"
        onSelectDate={vi.fn()}
      />
    )
    // Attribute lookups: a role query over 42 labelled cells is slow enough to time out.
    const day = (n: number) =>
      document.querySelector<HTMLElement>(`[data-date="2026-07-${String(n).padStart(2, "0")}"] button`)!
    expect(day(15)).toHaveAttribute("tabindex", "0")
    expect(day(16)).toHaveAttribute("tabindex", "-1")
    day(15).focus()
    fireEvent.keyDown(day(15), { key: "ArrowRight" })
    expect(day(16)).toHaveFocus()
    fireEvent.keyDown(day(16), { key: "ArrowDown" })
    expect(day(23)).toHaveFocus()
    fireEvent.keyDown(day(23), { key: "ArrowLeft" })
    expect(day(22)).toHaveFocus()
    fireEvent.keyDown(day(22), { key: "ArrowUp" })
    expect(day(15)).toHaveFocus()
    fireEvent.keyDown(day(15), { key: "Home" })
    expect(day(12)).toHaveFocus()
    fireEvent.keyDown(day(12), { key: "End" })
    expect(day(18)).toHaveFocus()
    expect(day(18)).toHaveAttribute("tabindex", "0")
    expect(day(15)).toHaveAttribute("tabindex", "-1")
  })

  it("moves focus between inert cells too, when days are not selectable", () => {
    render(<MonthCalendar month="2026-07-01" today="2026-07-15" />)
    const cell = (n: number) =>
      document.querySelector<HTMLElement>(`[data-date="2026-07-${String(n).padStart(2, "0")}"]`)!
    expect(cell(15)).toHaveAttribute("tabindex", "0")
    cell(15).focus()
    fireEvent.keyDown(cell(15), { key: "ArrowRight" })
    expect(cell(16)).toHaveFocus()
  })

  // ─── Calendar dates, not instants ────────────────────────────────────────

  describe("under a non-UTC time zone", () => {
    const originalTz = process.env.TZ
    afterEach(() => {
      if (originalTz === undefined) delete process.env.TZ
      else process.env.TZ = originalTz
    })

    // [zone, a span over that zone's DST edge, expected columns of its bar]
    // [zone, span start, span end, weekday column of the 1st of that month]
    const zones: Array<[string, string, string, number]> = [
      ["Pacific/Auckland", "2026-04-04", "2026-04-06", 3], // NZ DST ends 5 Apr; 1 Apr is a Wednesday
      ["America/Los_Angeles", "2026-03-07", "2026-03-09", 0], // US DST starts 8 Mar; 1 Mar is a Sunday
    ]

    for (const [zone, start, end, firstColumn] of zones) {
      it(`${zone}: a stay keeps its days (${start} to ${end})`, () => {
        process.env.TZ = zone
        // The zone really took effect: a local Date's offset is not UTC's.
        expect(new Date(2026, 5, 1).getTimezoneOffset()).not.toBe(0)

        const month = start.slice(0, 7) + "-01"
        const { container } = render(
          <MonthCalendar
            month={month}
            onSelectDate={vi.fn()}
            events={[{ id: "s", start, end, title: "Stay" }]}
          />
        )
        const day = (iso: string) => container.querySelector(`[data-date="${iso}"]`)
        const dateOf = (iso: string) => Number(iso.slice(8))
        const covered = Array.from(
          container.querySelectorAll<HTMLElement>('[data-slot="month-calendar-day"]')
        )
          .filter((c) => /Stay, day/.test(c.querySelector("button")!.getAttribute("aria-label")!))
          .map((c) => c.getAttribute("data-date"))
        expect(covered).toEqual([start, `${start.slice(0, 8)}${String(dateOf(start) + 1).padStart(2, "0")}`, end])
        expect(day(start)!.textContent).toBe(String(dateOf(start)))
        // The first of the month lands on the right weekday.
        const first = container.querySelector('[data-slot="month-calendar-day"]:not([data-outside])')!
        expect(first.getAttribute("data-date")).toBe(month)
        expect(
          Array.from(first.parentElement!.querySelectorAll('[role="gridcell"]')).indexOf(first)
        ).toBe(firstColumn)
      })
    }

    it("a Date prop reads local calendar fields; a date string never goes through Date", () => {
      process.env.TZ = "Pacific/Auckland"
      render(
        <MonthCalendar
          month={new Date(2026, 6, 15)}
          today={new Date(2026, 6, 1)}
          selectedDate="2026-07-31"
          onSelectDate={vi.fn()}
        />
      )
      expect(screen.getByText("July 2026")).toBeInTheDocument()
      expect(document.querySelector('[data-today="true"]')!.getAttribute("data-date")).toBe("2026-07-01")
      expect(document.querySelector('[data-selected="true"]')!.getAttribute("data-date")).toBe("2026-07-31")
    })
  })

  // ─── Edges (VI-655 / VI-680) ─────────────────────────────────────────────

  describe("edges", () => {
    const css = readFileSync(
      join(process.cwd(), "blocks/month-calendar/month-calendar.module.css"),
      "utf-8"
    ).replace(/\/\*[\s\S]*?\*\//g, "")

    it("draws no visible border: every border is transparent, 0 or none", () => {
      const visible = [
        ...css.matchAll(/(?:^|[{;\s])(border(?:-(?:top|right|bottom|left))?(?:-color)?)\s*:\s*([^;}]+)/g),
      ].filter(([, , value]) => !/^(0|none)$/.test(value!.trim()) && !/\btransparent\b/.test(value!))
      expect(visible.map(([, p, v]) => `${p}: ${v}`)).toEqual([])
    })

    it("reads the control-edge switch for the resting edge", () => {
      expect(css).toContain("var(--control-edge-width")
    })

    it("reads the hairline switch for the grid lines", () => {
      expect(css).toContain("var(--hairline-width")
    })
  })

  // ─── Accessibility (spans, slot) ─────────────────────────────────────────

  it("has no axe violations with spans, marks and the slot open", async () => {
    const { container } = render(
      <MonthCalendar
        month="2026-07-01"
        today="2026-07-09"
        selectedDate="2026-07-15"
        onSelectDate={vi.fn()}
        onEventSelect={vi.fn()}
        onMonthChange={vi.fn()}
        maxLanes={2}
        events={[
          { id: "a", start: "2026-07-10", end: "2026-07-14", title: "Berlin stay", series: 1 },
          { id: "b", start: "2026-07-10", end: "2026-07-12", title: "Overlap", color: "--chart-3" },
          { id: "c", start: "2026-07-11", end: "2026-07-12", title: "Third" },
          { id: "d", date: "2026-07-15", title: "Chip" },
        ]}
        renderDayMark={(d) => (d.date === "2026-07-16" ? "2" : null)}
        renderWeekDetail={() => <button type="button">Open</button>}
      />
    )
    await checkA11y(container)
  })

  it("has no axe violations on inert cells with spans", async () => {
    const { container } = render(
      <MonthCalendar
        month="2026-07-01"
        today="2026-07-09"
        events={[{ id: "a", start: "2026-07-10", end: "2026-07-14", title: "Berlin stay" }]}
      />
    )
    await checkA11y(container)
  })
})
