import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

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
})
