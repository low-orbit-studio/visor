import { render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { describe, it, expect } from "vitest"
import { SegmentedProgress, type SegmentedProgressStep } from "../segmented-progress"
import { checkA11y } from "../../../../test-utils/a11y"

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

  it("without steps renders exactly the 1.37.0 markup", () => {
    expect(
      renderToString(<SegmentedProgress total={3} value={1} current={1} aria-label="Step 2 of 3" />)
    ).toBe(
      '<div data-slot="segmented-progress" data-size="sm" role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow="1" aria-label="Step 2 of 3" class="root sizeSm"><span data-slot="segmented-progress-segment" data-state="done" class="segment segmentDone"></span><span data-slot="segmented-progress-segment" data-state="current" class="segment segmentCurrent"></span><span data-slot="segmented-progress-segment" data-state="pending" class="segment segmentPending"></span></div>'
    )
  })
})

describe("SegmentedProgress with steps (VI-713)", () => {
  const STEPS: SegmentedProgressStep[] = [
    { label: "Your Info", state: "done" },
    { label: "Bank Details", state: "current" },
    { label: "W-9", state: "pending" },
  ]

  const steps = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('[data-slot="segmented-progress-step"]'))

  it("renders a segment and a label per step", () => {
    const { container } = render(<SegmentedProgress steps={STEPS} />)
    expect(steps(container)).toHaveLength(3)
    expect(container.querySelectorAll('[data-slot="segmented-progress-segment"]')).toHaveLength(3)
    expect(
      Array.from(container.querySelectorAll('[data-slot="segmented-progress-label"]')).map((l) => l.textContent)
    ).toEqual(["Your Info", "Bank Details", "W-9"])
  })

  it.each(["done", "current", "pending", "failed"] as const)("renders the %s state", (state) => {
    const { container } = render(<SegmentedProgress steps={[{ label: "Step", state }]} />)
    const step = steps(container)[0]
    expect(step).toHaveAttribute("data-state", state)
    const segment = step.querySelector('[data-slot="segmented-progress-segment"]')!
    expect(segment).toHaveAttribute("data-state", state)
    expect(segment).toHaveClass("fill", `segment${state[0].toUpperCase()}${state.slice(1)}`)
    // done carries a check, failed a warning; current and pending no icon
    expect(step.querySelectorAll("svg")).toHaveLength(state === "done" || state === "failed" ? 1 : 0)
  })

  it("a step without a state follows value and current", () => {
    const { container } = render(
      <SegmentedProgress value={1} current={1} steps={[{ label: "A" }, { label: "B" }, { label: "C" }]} />
    )
    expect(steps(container).map((s) => s.getAttribute("data-state"))).toEqual(["done", "current", "pending"])
  })

  it("hides the bar and reads a summary in its place", () => {
    const { container } = render(<SegmentedProgress steps={STEPS} />)
    for (const step of steps(container)) expect(step).toHaveAttribute("aria-hidden", "true")
    expect(screen.queryByRole("progressbar")).toBeNull()
    expect(container.querySelector('[data-slot="segmented-progress-summary"]')?.textContent).toBe(
      "Step 2 of 3: Bank Details"
    )
  })

  it("the summary names a failed step first", () => {
    const { container } = render(
      <SegmentedProgress steps={[{ label: "Sent", state: "done" }, { label: "Payment Starts", state: "failed" }, { label: "Paid" }]} />
    )
    expect(container.querySelector('[data-slot="segmented-progress-summary"]')?.textContent).toBe(
      "Step 2 of 3 failed: Payment Starts"
    )
  })

  it("the summary names the next step when none is current, and says so when all are done", () => {
    const { container, rerender } = render(
      <SegmentedProgress steps={[{ label: "A", state: "done" }, { label: "B", state: "pending" }]} />
    )
    const summary = () => container.querySelector('[data-slot="segmented-progress-summary"]')?.textContent
    expect(summary()).toBe("Step 2 of 2: B")
    rerender(<SegmentedProgress steps={[{ label: "A", state: "done" }, { label: "B", state: "done" }]} />)
    expect(summary()).toBe("All 2 steps done")
  })

  it("takes a host summary", () => {
    const { container } = render(<SegmentedProgress steps={STEPS} summary="2 of 3 steps done. Your W-9 is next." />)
    expect(container.querySelector('[data-slot="segmented-progress-summary"]')?.textContent).toBe(
      "2 of 3 steps done. Your W-9 is next."
    )
  })

  it("staggers each step by its index", () => {
    const { container } = render(<SegmentedProgress steps={STEPS} />)
    expect(steps(container).map((s) => (s as HTMLElement).style.getPropertyValue("--segmented-progress-index"))).toEqual([
      "0",
      "1",
      "2",
    ])
  })

  it.each(["sm", "md"] as const)("renders at size %s", (size) => {
    const { container } = render(<SegmentedProgress size={size} steps={STEPS} />)
    expect(container.querySelector('[data-slot="segmented-progress"]')).toHaveAttribute("data-size", size)
  })

  it("forwards ref and className", () => {
    const ref = { current: null as HTMLDivElement | null }
    const { container } = render(<SegmentedProgress ref={ref} className="custom" steps={STEPS} />)
    expect(ref.current?.tagName).toBe("DIV")
    expect(container.querySelector('[data-slot="segmented-progress"]')).toHaveClass("custom")
  })

  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<SegmentedProgress steps={[...STEPS, { label: "Paid", state: "failed" }]} />)
    await checkA11y(container)
  })
})
