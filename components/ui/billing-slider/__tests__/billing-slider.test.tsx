import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { BillingSlider, type BillingSliderProps } from "../billing-slider"

const H = (h: number) => `${h} h`

function setup(over: Partial<BillingSliderProps> = {}) {
  const onValueChange = vi.fn()
  const onValueCommit = vi.fn()
  const utils = render(
    <BillingSlider
      aria-label="Hours it bills"
      value={9}
      savedValue={8}
      min={8}
      max={16.75}
      formatValue={H}
      onValueChange={onValueChange}
      onValueCommit={onValueCommit}
      {...over}
    />
  )
  const thumb = screen.getByRole("slider")
  const slot = (name: string) => utils.container.querySelectorAll(`[data-slot="billing-slider-${name}"]`)
  return { ...utils, thumb, slot, onValueChange, onValueCommit }
}

describe("BillingSlider", () => {
  it("exposes the floor, the end and a value text on the thumb", () => {
    const { thumb } = setup({ valueText: (h) => `Bills ${h} h, $${h * 120}` })
    expect(thumb).toHaveAttribute("aria-valuemin", "8")
    expect(thumb).toHaveAttribute("aria-valuemax", "16.75")
    expect(thumb).toHaveAttribute("aria-valuenow", "9")
    expect(thumb).toHaveAttribute("aria-valuetext", "Bills 9 h, $1080")
    expect(thumb).toHaveAccessibleName("Hours it bills")
  })

  it("steps a quarter on arrows and an hour with Shift, without committing", () => {
    const { thumb, onValueChange, onValueCommit } = setup()
    fireEvent.keyDown(thumb, { key: "ArrowRight" })
    expect(onValueChange).toHaveBeenLastCalledWith(9.25)
    fireEvent.keyDown(thumb, { key: "ArrowLeft", shiftKey: true })
    expect(onValueChange).toHaveBeenLastCalledWith(8)
    fireEvent.keyDown(thumb, { key: "ArrowUp", shiftKey: true })
    expect(onValueChange).toHaveBeenLastCalledWith(10)
    expect(onValueCommit).not.toHaveBeenCalled()
  })

  it("goes to the floor on Home and the end on End, and never past them", () => {
    const { thumb, onValueChange, rerender } = setup()
    fireEvent.keyDown(thumb, { key: "Home" })
    expect(onValueChange).toHaveBeenLastCalledWith(8)
    fireEvent.keyDown(thumb, { key: "End" })
    expect(onValueChange).toHaveBeenLastCalledWith(16.75)
    rerender(<BillingSlider aria-label="Hours it bills" value={16.75} min={8} max={16.75} onValueChange={onValueChange} />)
    onValueChange.mockClear()
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight", shiftKey: true })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("commits on Enter and goes back to the saved value on Escape", () => {
    const { thumb, onValueChange, onValueCommit } = setup({ value: 9.5 })
    fireEvent.keyDown(thumb, { key: "Enter" })
    expect(onValueCommit).toHaveBeenCalledWith(9.5)
    fireEvent.keyDown(thumb, { key: "Escape" })
    expect(onValueChange).toHaveBeenLastCalledWith(8)
  })

  it("ignores keys when disabled", () => {
    const { thumb, onValueChange, onValueCommit, container } = setup({ disabled: true })
    fireEvent.keyDown(thumb, { key: "ArrowRight" })
    fireEvent.keyDown(thumb, { key: "Enter" })
    expect(onValueChange).not.toHaveBeenCalled()
    expect(onValueCommit).not.toHaveBeenCalled()
    expect(container.firstChild).toHaveAttribute("data-disabled")
  })

  it("draws a notch per mark and stripes past the hatch mark", () => {
    const marks = [{ value: 10, label: "High", hatchPast: true }]
    const under = setup({ value: 9.5, marks })
    expect(under.slot("mark")).toHaveLength(1)
    expect(under.slot("past")).toHaveLength(0)
    under.unmount()
    const over = setup({ value: 12.5, marks })
    const fill = over.slot("fill")[0] as HTMLElement
    const past = over.slot("past")[0] as HTMLElement
    // 10 h is 2 of 8.75 h along the track; 12.5 h is 4.5 of 8.75.
    expect(parseFloat(fill.style.width)).toBeCloseTo((2 / 8.75) * 100)
    expect(parseFloat(past.style.left)).toBeCloseTo((2 / 8.75) * 100)
    expect(parseFloat(past.style.width)).toBeCloseTo((2.5 / 8.75) * 100)
  })

  it("draws the evidence strip, the agent and proposed extensions and both ticks", () => {
    const { slot } = setup({ evidence: { value: 9, agent: 1.5, proposed: 1 } })
    expect(slot("evidence")).toHaveLength(1)
    expect(slot("agent")).toHaveLength(1)
    expect(slot("proposed")).toHaveLength(1)
    const ticks = [...slot("tick")] as HTMLElement[]
    expect(ticks).toHaveLength(2)
    expect(parseFloat(ticks[0].style.left)).toBeCloseTo((2.5 / 8.75) * 100)
    expect(ticks[1]).toHaveAttribute("data-variant", "proposed")
  })

  it("turns an evidence tick past the end into an arrow at the end", () => {
    const { slot } = setup({ evidence: { value: 18 } })
    const tick = slot("tick")[0] as HTMLElement
    expect(tick).toHaveAttribute("data-out")
    expect(tick.style.left).toBe("100%")
  })

  it("hides the evidence strip and tick under the floor", () => {
    const { slot } = setup({ evidence: { value: 6.5 } })
    expect(slot("evidence")).toHaveLength(0)
    expect(slot("tick")).toHaveLength(0)
  })

  it("stripes the gap only when asked and the evidence is a step or more ahead", () => {
    expect(setup({ evidence: { value: 10.5 } }).slot("gap")).toHaveLength(0)
  })

  it("stripes the gap from the thumb to the evidence tick", () => {
    const { slot } = setup({ value: 8, gap: true, evidence: { value: 10.5 } })
    const gap = slot("gap")[0] as HTMLElement
    expect(parseFloat(gap.style.left)).toBe(0)
    expect(parseFloat(gap.style.width)).toBeCloseTo((2.5 / 8.75) * 100)
  })

  it("writes the floor, the marks and the end in the labels row", () => {
    const { slot } = setup({ minLabel: "Low", maxLabel: "Ceiling allows", marks: [{ value: 12, label: "High" }] })
    expect(slot("labels")[0]).toHaveTextContent("Low 8 hHigh 12 hCeiling allows 16.75 h")
  })

  it("sets the hue variables and the status", () => {
    const { container } = setup({ hue: 339, status: "saving", size: "lg" })
    const root = container.firstChild as HTMLElement
    expect(root.style.getPropertyValue("--billing-slider-hue-ink")).toBe("var(--paper-hue-339-ink)")
    expect(root).toHaveAttribute("data-status", "saving")
    expect(root).toHaveAttribute("data-size", "lg")
  })

  it("forwards its ref", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<BillingSlider ref={ref} aria-label="Hours" value={1} min={0} max={4} onValueChange={() => {}} />)
    expect(ref.current).toHaveAttribute("data-slot", "billing-slider")
  })
})
