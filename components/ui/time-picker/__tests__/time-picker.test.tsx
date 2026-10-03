import * as React from "react"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import {
  TimePicker,
  formatTime,
  fromMinutes,
  parseTime,
  resolveHourCycle,
  snapToStep,
  toMinutes,
} from "../time-picker"
import { checkA11y } from "../../../../test-utils/a11y"

const field = () => screen.getByRole("textbox") as HTMLInputElement
const type = (text: string) => {
  fireEvent.change(field(), { target: { value: text } })
  fireEvent.keyDown(field(), { key: "Enter" })
}

describe("time helpers", () => {
  it("round-trips HH:MM and minutes", () => {
    expect(toMinutes("16:05")).toBe(965)
    expect(toMinutes("24:00")).toBeUndefined()
    expect(toMinutes("4:05")).toBeUndefined()
    expect(toMinutes(undefined)).toBeUndefined()
    expect(fromMinutes(965)).toBe("16:05")
    expect(fromMinutes(-15)).toBe("23:45")
    expect(fromMinutes(1440)).toBe("00:00")
  })

  it("formats 12- and 24-hour displays", () => {
    expect(formatTime("16:00", 12)).toBe("4:00 PM")
    expect(formatTime("00:30", 12)).toBe("12:30 AM")
    expect(formatTime("12:00", 12)).toBe("12:00 PM")
    expect(formatTime("16:00", 24)).toBe("16:00")
    expect(formatTime(undefined, 24)).toBe("")
  })

  it("parses typed times", () => {
    expect(parseTime("16:30", 24)).toBe(990)
    expect(parseTime("1630", 24)).toBe(990)
    expect(parseTime("4:30pm", 12)).toBe(990)
    expect(parseTime("4 PM", 12)).toBe(960)
    expect(parseTime("4p", 12)).toBe(960)
    expect(parseTime("12am", 12)).toBe(0)
    expect(parseTime("12:15 pm", 12)).toBe(735)
    expect(parseTime("4:30", 12, "pm")).toBe(990)
    expect(parseTime("4:30", 12, "am")).toBe(270)
    expect(parseTime("16:30", 12)).toBe(990)
    expect(parseTime("25:00", 24)).toBeUndefined()
    expect(parseTime("4:75", 24)).toBeUndefined()
    expect(parseTime("13pm", 12)).toBeUndefined()
    expect(parseTime("soon", 24)).toBeUndefined()
  })

  it("snaps to a step and carries past the hour and midnight", () => {
    expect(snapToStep(607, 15)).toBe(600)
    expect(snapToStep(608, 15)).toBe(615)
    expect(snapToStep(59, 30)).toBe(60)
    expect(snapToStep(1435, 15)).toBe(0)
    expect(snapToStep(607, 0)).toBe(607)
  })

  it("resolves the hour cycle from the locale", () => {
    expect(resolveHourCycle("en-US")).toBe(12)
    expect(resolveHourCycle("de-DE")).toBe(24)
    expect(resolveHourCycle("not a locale!!")).toBe(24)
  })
})

describe("TimePicker display", () => {
  it("renders with data-slot and a clock button", () => {
    const { container } = render(<TimePicker aria-label="Start" />)
    expect(container.querySelector("[data-slot='time-picker']")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Choose time" })).toBeInTheDocument()
  })

  it("shows a 24-hour value as-is", () => {
    render(<TimePicker hourCycle={24} value="16:00" aria-label="Start" />)
    expect(field().value).toBe("16:00")
  })

  it("shows the same value as AM/PM in the 12-hour cycle", () => {
    render(<TimePicker hourCycle={12} value="16:00" aria-label="Start" />)
    expect(field().value).toBe("4:00 PM")
  })

  it("takes its default cycle from the locale prop", () => {
    const { unmount } = render(<TimePicker locale="en-US" value="16:00" aria-label="a" />)
    expect(field().value).toBe("4:00 PM")
    unmount()
    render(<TimePicker locale="de-DE" value="16:00" aria-label="a" />)
    expect(field().value).toBe("16:00")
  })

  it("shows a placeholder per cycle", () => {
    const { unmount } = render(<TimePicker hourCycle={24} aria-label="a" />)
    expect(field()).toHaveAttribute("placeholder", "HH:MM")
    unmount()
    render(<TimePicker hourCycle={12} placeholder="Opens" aria-label="a" />)
    expect(field()).toHaveAttribute("placeholder", "Opens")
  })

  it("forwards ref to the input and applies className to the wrapper", () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement | null>
    const { container } = render(<TimePicker ref={ref} className="custom" aria-label="a" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(container.querySelector("[data-slot='time-picker']")?.className).toContain("custom")
  })

  it("disables the field and the clock button", () => {
    render(<TimePicker disabled aria-label="a" />)
    expect(field()).toBeDisabled()
    expect(screen.getByRole("button", { name: "Choose time" })).toBeDisabled()
  })

  it("marks the input invalid", () => {
    render(<TimePicker aria-invalid aria-label="a" />)
    expect(field()).toHaveAttribute("aria-invalid", "true")
  })

  it("submits the 24-hour value through a named hidden input", () => {
    const { container } = render(<TimePicker name="opens" hourCycle={12} value="16:00" aria-label="a" />)
    expect(container.querySelector("input[type='hidden'][name='opens']")).toHaveValue("16:00")
  })
})

describe("TimePicker keyboard entry (no popover)", () => {
  it("emits 24-hour HH:MM from a typed 12-hour time on Enter", () => {
    const onChange = vi.fn()
    render(<TimePicker hourCycle={12} onChange={onChange} aria-label="a" />)
    type("4:30 pm")
    expect(onChange).toHaveBeenCalledWith("16:30")
    expect(document.querySelector("[data-slot='time-picker-content']")).toBeNull()
  })

  it("commits on blur", () => {
    const onChange = vi.fn()
    render(<TimePicker hourCycle={24} onChange={onChange} aria-label="a" />)
    fireEvent.change(field(), { target: { value: "0905" } })
    fireEvent.blur(field())
    expect(onChange).toHaveBeenCalledWith("09:05")
  })

  it("snaps a typed time to the minute step", () => {
    const onChange = vi.fn()
    render(<TimePicker hourCycle={24} minuteStep={15} onChange={onChange} aria-label="a" />)
    type("16:10")
    expect(onChange).toHaveBeenCalledWith("16:15")
  })

  it("keeps the current period for a bare 12-hour hour", () => {
    const onChange = vi.fn()
    render(<TimePicker hourCycle={12} value="16:00" onChange={onChange} aria-label="a" />)
    type("5:30")
    expect(onChange).toHaveBeenCalledWith("17:30")
  })

  it("reverts text that does not parse", () => {
    const onChange = vi.fn()
    render(<TimePicker hourCycle={24} value="16:00" onChange={onChange} aria-label="a" />)
    type("later")
    expect(onChange).not.toHaveBeenCalled()
    expect(field().value).toBe("16:00")
  })

  it("clears with empty text", () => {
    const onChange = vi.fn()
    render(<TimePicker hourCycle={24} value="16:00" onChange={onChange} aria-label="a" />)
    type("")
    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it("does not re-emit an unchanged value", () => {
    const onChange = vi.fn()
    render(<TimePicker hourCycle={24} value="16:00" onChange={onChange} aria-label="a" />)
    type("16:00")
    expect(onChange).not.toHaveBeenCalled()
  })

  it("steps with the arrow keys by minuteStep", () => {
    const onChange = vi.fn()
    render(<TimePicker hourCycle={24} minuteStep={15} value="16:00" onChange={onChange} aria-label="a" />)
    fireEvent.keyDown(field(), { key: "ArrowUp" })
    expect(onChange).toHaveBeenLastCalledWith("16:15")
    fireEvent.keyDown(field(), { key: "ArrowDown" })
    expect(onChange).toHaveBeenLastCalledWith("15:45")
  })

  it("steps from an empty field and wraps past midnight", () => {
    const onChange = vi.fn()
    const { unmount } = render(<TimePicker hourCycle={24} minuteStep={15} onChange={onChange} aria-label="a" />)
    fireEvent.keyDown(field(), { key: "ArrowUp" })
    expect(onChange).toHaveBeenLastCalledWith("00:00")
    unmount()
    render(<TimePicker hourCycle={24} minuteStep={15} onChange={onChange} aria-label="a" />)
    fireEvent.keyDown(field(), { key: "ArrowDown" })
    expect(onChange).toHaveBeenLastCalledWith("23:45")
  })

  it("opens the popover with Alt+ArrowDown", () => {
    render(<TimePicker aria-label="a" />)
    fireEvent.keyDown(field(), { key: "ArrowDown", altKey: true })
    expect(document.querySelector("[data-slot='time-picker-content']")).toBeTruthy()
  })

  it("works uncontrolled", () => {
    render(<TimePicker hourCycle={24} defaultValue="09:00" aria-label="a" />)
    expect(field().value).toBe("09:00")
    type("10:30")
    expect(field().value).toBe("10:30")
  })
})

describe("TimePicker popover", () => {
  const open = () => fireEvent.click(screen.getByRole("button", { name: "Choose time" }))

  it("opens on click with an hour column and a minute column (24-hour, 15-minute)", () => {
    render(<TimePicker hourCycle={24} minuteStep={15} value="16:15" aria-label="Start" />)
    open()
    const hours = screen.getByRole("listbox", { name: "Hour" })
    const minutes = screen.getByRole("listbox", { name: "Minute" })
    expect(within(hours).getAllByRole("option")).toHaveLength(24)
    expect(within(minutes).getAllByRole("option").map((o) => o.textContent)).toEqual(["00", "15", "30", "45"])
    expect(screen.queryByRole("listbox", { name: "AM or PM" })).toBeNull()
    expect(within(hours).getByRole("option", { selected: true })).toHaveTextContent("16")
    expect(within(minutes).getByRole("option", { selected: true })).toHaveTextContent("15")
  })

  it("adds an AM/PM column in the 12-hour cycle", () => {
    render(<TimePicker hourCycle={12} minuteStep={30} value="16:00" aria-label="Start" />)
    open()
    expect(within(screen.getByRole("listbox", { name: "Hour" })).getAllByRole("option")).toHaveLength(12)
    expect(within(screen.getByRole("listbox", { name: "Minute" })).getAllByRole("option")).toHaveLength(2)
    expect(within(screen.getByRole("listbox", { name: "AM or PM" })).getByRole("option", { selected: true })).toHaveTextContent("PM")
    expect(within(screen.getByRole("listbox", { name: "Hour" })).getByRole("option", { selected: true })).toHaveTextContent("4")
  })

  it("emits 24-hour values from column picks, in either cycle", () => {
    const onChange = vi.fn()
    render(<TimePicker hourCycle={12} minuteStep={15} value="16:15" onChange={onChange} aria-label="a" />)
    open()
    fireEvent.click(within(screen.getByRole("listbox", { name: "Hour" })).getByRole("option", { name: "9" }))
    expect(onChange).toHaveBeenLastCalledWith("21:15")
    fireEvent.click(within(screen.getByRole("listbox", { name: "Minute" })).getByRole("option", { name: "45" }))
    expect(onChange).toHaveBeenLastCalledWith("16:45")
    fireEvent.click(within(screen.getByRole("listbox", { name: "AM or PM" })).getByRole("option", { name: "AM" }))
    expect(onChange).toHaveBeenLastCalledWith("04:15")
  })

  it("maps 12 AM and 12 PM correctly", () => {
    const onChange = vi.fn()
    render(<TimePicker hourCycle={12} value="09:00" onChange={onChange} aria-label="a" />)
    open()
    fireEvent.click(within(screen.getByRole("listbox", { name: "Hour" })).getByRole("option", { name: "12" }))
    expect(onChange).toHaveBeenLastCalledWith("00:00")
  })

  it("starts from 00 when a part is picked in an empty field", () => {
    const onChange = vi.fn()
    render(<TimePicker hourCycle={24} minuteStep={15} onChange={onChange} aria-label="a" />)
    open()
    fireEvent.click(within(screen.getByRole("listbox", { name: "Hour" })).getByRole("option", { name: "07" }))
    expect(onChange).toHaveBeenLastCalledWith("07:00")
  })

  it("moves focus within a column with the arrow keys", () => {
    render(<TimePicker hourCycle={24} value="16:00" aria-label="a" />)
    open()
    const options = within(screen.getByRole("listbox", { name: "Hour" })).getAllByRole("option")
    options[16].focus()
    fireEvent.keyDown(options[16], { key: "ArrowDown" })
    expect(document.activeElement).toBe(options[17])
    fireEvent.keyDown(options[17], { key: "Home" })
    expect(document.activeElement).toBe(options[0])
    fireEvent.keyDown(options[0], { key: "End" })
    expect(document.activeElement).toBe(options[23])
    fireEvent.keyDown(options[23], { key: "ArrowUp" })
    expect(document.activeElement).toBe(options[22])
  })

  it("supports a controlled open state and reports changes", () => {
    const onOpenChange = vi.fn()
    render(<TimePicker open onOpenChange={onOpenChange} aria-label="a" />)
    expect(document.querySelector("[data-slot='time-picker-content']")).toBeTruthy()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("portals into a container when one is given", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    render(<TimePicker open container={host} aria-label="a" />)
    expect(host.querySelector("[data-slot='time-picker-content']")).toBeTruthy()
    host.remove()
  })
})

describe("TimePicker accessibility", () => {
  it("has no WCAG AA violations (closed, empty)", async () => {
    const { container } = render(<TimePicker aria-label="Doors open" />)
    await checkA11y(container)
  })

  it("has no WCAG AA violations (with a value, 12-hour)", async () => {
    const { container } = render(<TimePicker hourCycle={12} value="16:00" aria-label="Doors open" />)
    await checkA11y(container)
  })

  it("has no WCAG AA violations (invalid)", async () => {
    const { container } = render(<TimePicker aria-invalid aria-label="Doors open" />)
    await checkA11y(container)
  })

  it("has no WCAG AA violations (disabled)", async () => {
    const { container } = render(<TimePicker disabled aria-label="Doors open" />)
    await checkA11y(container)
  })

  it("has no WCAG AA violations (popover open, 24-hour)", async () => {
    render(<TimePicker open hourCycle={24} minuteStep={15} value="16:15" aria-label="Set start" />)
    await checkA11y(document.body)
  })

  it("has no WCAG AA violations (popover open, 12-hour)", async () => {
    render(<TimePicker open hourCycle={12} minuteStep={15} value="16:15" aria-label="Doors open" />)
    await checkA11y(document.body)
  })
})
