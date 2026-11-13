import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Meter } from "../meter"

const slot = (c: HTMLElement, name: string) => c.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`)

describe("Meter", () => {
  it("names the meter from its label and reports the value", () => {
    render(
      <Meter value={141} max={220}>
        <strong>64%</strong> of 220 h
      </Meter>
    )
    const meter = screen.getByRole("meter", { name: "64% of 220 h" })
    expect(meter).toHaveAttribute("aria-valuenow", "141")
    expect(meter).toHaveAttribute("aria-valuemin", "0")
    expect(meter).toHaveAttribute("aria-valuemax", "220")
  })

  it("prefers aria-label over the label slot", () => {
    render(<Meter value={10} max={40} aria-label="Hours used">10 of 40 h</Meter>)
    expect(screen.getByRole("meter", { name: "Hours used" })).toBeInTheDocument()
  })

  it("draws the fill to the value, inset inside the track", () => {
    const { container } = render(<Meter value={50} max={200} aria-label="Use" />)
    expect(slot(container, "meter-fill")[0].style.width).toBe("max(0px, calc(25% - var(--_inset-x) * 2))")
  })

  it("draws one tick per mark at its value", () => {
    const { container } = render(
      <Meter value={10} max={200} aria-label="Use" marks={[{ value: 160, threshold: true }, { value: 200, variant: "limit" }]} />
    )
    const ticks = slot(container, "meter-tick")
    expect([...ticks].map((t) => t.style.left)).toEqual(["80%", "100%"])
    expect(ticks[1]).toHaveAttribute("data-variant", "limit")
  })

  it("marks the meter over once value reaches the threshold mark", () => {
    const { container, rerender } = render(<Meter value={159} max={200} aria-label="Use" marks={[{ value: 160, threshold: true }]} />)
    expect(slot(container, "meter")[0]).not.toHaveAttribute("data-over")
    rerender(<Meter value={160} max={200} aria-label="Use" marks={[{ value: 160, threshold: true }]} />)
    expect(slot(container, "meter")[0]).toHaveAttribute("data-over")
  })

  it("maps hue to Paper's project-hue tokens", () => {
    const { container } = render(<Meter value={1} max={2} hue={219} aria-label="Use" />)
    const root = slot(container, "meter")[0]
    expect(root.style.getPropertyValue("--meter-hue-fill-strong")).toBe("var(--paper-hue-219-fill-strong)")
    expect(root.style.getPropertyValue("--meter-hue-ink")).toBe("var(--paper-hue-219-ink)")
  })

  it("stretches the scale past an overflowing value and stripes the overflow", () => {
    const { container } = render(<Meter value={212} max={200} aria-label="Use" />)
    const over = slot(container, "meter-overflow")[0]
    expect(over).toHaveAttribute("data-variant", "alert")
    // domain = 212 * 1.06; max sits at 200 / 224.72 of the track
    expect(parseFloat(over.style.left)).toBeCloseTo((200 / (212 * 1.06)) * 100, 3)
    // alert overflow: the fill stops at the limit; aria-valuenow clamps to max
    expect(slot(container, "meter-fill")[0].style.width).toContain(`${(200 / (212 * 1.06)) * 100}%`)
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "200")
  })

  it("runs the fill through ink overflow on a shared scale", () => {
    const { container } = render(<Meter value={46} max={40} scale={50} overflow="ink" aria-label="Use" />)
    expect(slot(container, "meter-overflow")[0]).toHaveAttribute("data-variant", "ink")
    expect(slot(container, "meter-overflow")[0].style.left).toBe("80%")
    expect(slot(container, "meter-fill")[0].style.width).toContain("92%")
  })

  it("draws no overflow at or under the limit", () => {
    const { container } = render(<Meter value={200} max={200} aria-label="Use" />)
    expect(slot(container, "meter-overflow")).toHaveLength(0)
  })

  it("draws zones from their start to their end", () => {
    const { container } = render(
      <Meter value={10} max={200} size="contract" aria-label="Use" zones={[{ to: 166 }, { from: 166, to: 190, variant: "hatched" }]} />
    )
    const zones = slot(container, "meter-zone")
    expect(zones[0].style.left).toBe("0%")
    expect(zones[0].style.width).toBe("83%")
    expect(zones[1]).toHaveAttribute("data-variant", "hatched")
    expect(zones[1].style.left).toBe("83%")
    expect(parseFloat(zones[1].style.width)).toBeCloseTo(12, 5)
  })

  it("writes mark text only for marks that carry it", () => {
    render(
      <Meter
        value={10}
        max={200}
        size="contract"
        aria-label="Use"
        marks={[
          { value: 160, label: "160 h", caption: "heads-up", align: "end", hideWhenNarrow: true },
          { value: 200, variant: "limit" },
        ]}
      />
    )
    const text = screen.getByText("160 h").parentElement!
    expect(text).toHaveTextContent("160 hheads-up")
    expect(text).toHaveAttribute("data-align", "end")
    expect(text).toHaveAttribute("data-hide-narrow")
    expect(text.parentElement!.children).toHaveLength(1)
  })

  it("clamps the fill at zero and handles a zero max", () => {
    const { container } = render(<Meter value={0} max={0} aria-label="Use" />)
    expect(slot(container, "meter-fill")[0].style.width).toBe("max(0px, calc(0% - var(--_inset-x) * 2))")
  })
})
