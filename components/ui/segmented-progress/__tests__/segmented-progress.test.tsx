import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { SegmentedProgress } from "../segmented-progress"

describe("SegmentedProgress", () => {
  it("renders the correct number of segments", () => {
    const { container } = render(
      <SegmentedProgress total={5} value={2} aria-label="Step 2 of 5" />
    )
    const segments = container.querySelectorAll(
      '[data-slot="segmented-progress-segment"]'
    )
    expect(segments.length).toBe(5)
  })

  it("renders correct done segment count", () => {
    const { container } = render(
      <SegmentedProgress total={6} value={3} aria-label="Step 3 of 6" />
    )
    const done = container.querySelectorAll('[data-state="done"]')
    expect(done.length).toBe(3)
  })

  it("renders pending segments for remaining steps", () => {
    const { container } = render(
      <SegmentedProgress total={6} value={2} aria-label="Step 2 of 6" />
    )
    const pending = container.querySelectorAll('[data-state="pending"]')
    expect(pending.length).toBe(4)
  })

  it("renders a current segment when current prop is provided", () => {
    const { container } = render(
      <SegmentedProgress
        total={6}
        value={2}
        current={2}
        aria-label="Step 2 of 6"
      />
    )
    const current = container.querySelectorAll('[data-state="current"]')
    expect(current.length).toBe(1)
    expect(current[0]).toHaveAttribute("data-state", "current")
  })

  it("done segments take priority over current when index < value", () => {
    const { container } = render(
      <SegmentedProgress
        total={6}
        value={3}
        current={1}
        aria-label="Step 3 of 6"
      />
    )
    // index 1 is < value=3, so it should be done, not current
    const done = container.querySelectorAll('[data-state="done"]')
    const current = container.querySelectorAll('[data-state="current"]')
    expect(done.length).toBe(3)
    expect(current.length).toBe(0)
  })

  it("sets correct ARIA attributes", () => {
    render(
      <SegmentedProgress total={10} value={3} aria-label="Step 3 of 10" />
    )
    const progressbar = screen.getByRole("progressbar")
    expect(progressbar).toHaveAttribute("aria-valuemin", "0")
    expect(progressbar).toHaveAttribute("aria-valuemax", "10")
    expect(progressbar).toHaveAttribute("aria-valuenow", "3")
    expect(progressbar).toHaveAttribute("aria-label", "Step 3 of 10")
  })

  it("applies data-slot to the container", () => {
    const { container } = render(
      <SegmentedProgress total={5} value={2} aria-label="Step 2 of 5" />
    )
    expect(
      container.querySelector('[data-slot="segmented-progress"]')
    ).not.toBeNull()
  })

  it("applies data-size attribute", () => {
    const { container } = render(
      <SegmentedProgress total={5} value={2} size="md" aria-label="Step 2 of 5" />
    )
    expect(
      container.querySelector('[data-size="md"]')
    ).not.toBeNull()
  })

  it("defaults to size sm", () => {
    const { container } = render(
      <SegmentedProgress total={5} value={2} aria-label="Step 2 of 5" />
    )
    expect(
      container.querySelector('[data-size="sm"]')
    ).not.toBeNull()
  })

  it("forwards ref to the root div", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(
      <SegmentedProgress ref={ref} total={5} value={2} aria-label="Step 2 of 5" />
    )
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("DIV")
  })

  it("forwards className to the root", () => {
    const { container } = render(
      <SegmentedProgress
        total={5}
        value={2}
        aria-label="Step 2 of 5"
        className="custom-class"
      />
    )
    const root = container.querySelector('[data-slot="segmented-progress"]')
    expect(root).toHaveClass("custom-class")
  })

  it("clamps value above total to total", () => {
    const { container } = render(
      <SegmentedProgress total={5} value={10} aria-label="All done" />
    )
    const done = container.querySelectorAll('[data-state="done"]')
    expect(done.length).toBe(5)
    const progressbar = container.querySelector('[role="progressbar"]')
    expect(progressbar).toHaveAttribute("aria-valuenow", "5")
  })

  it("clamps value below 0 to 0", () => {
    const { container } = render(
      <SegmentedProgress total={5} value={-1} aria-label="Not started" />
    )
    const done = container.querySelectorAll('[data-state="done"]')
    expect(done.length).toBe(0)
    const progressbar = container.querySelector('[role="progressbar"]')
    expect(progressbar).toHaveAttribute("aria-valuenow", "0")
  })

  it("renders all pending when value=0 and no current", () => {
    const { container } = render(
      <SegmentedProgress total={4} value={0} aria-label="Not started" />
    )
    const pending = container.querySelectorAll('[data-state="pending"]')
    expect(pending.length).toBe(4)
  })

  it("renders all done when value equals total", () => {
    const { container } = render(
      <SegmentedProgress total={4} value={4} aria-label="Complete" />
    )
    const done = container.querySelectorAll('[data-state="done"]')
    expect(done.length).toBe(4)
  })

  describe("sizes", () => {
    it.each(["sm", "md"] as const)("renders %s size", (size) => {
      const { container } = render(
        <SegmentedProgress total={5} value={2} size={size} aria-label="Step 2 of 5" />
      )
      expect(
        container.querySelector(`[data-size="${size}"]`)
      ).not.toBeNull()
    })
  })
})
