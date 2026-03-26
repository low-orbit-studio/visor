import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { MotionDuration, MotionEasing } from "../motion-specimen"
import { checkA11y } from "../../../../test-utils/a11y"

describe("MotionDuration", () => {
  const durations = [
    { token: "--motion-duration-200", name: "200", ms: 200 },
    { token: "--motion-duration-300", name: "300", ms: 300 },
  ]

  it("renders all durations with ms label and token", () => {
    render(<MotionDuration durations={durations} />)
    expect(screen.getByText("200ms")).toBeInTheDocument()
    expect(screen.getByText("--motion-duration-200")).toBeInTheDocument()
    expect(screen.getByText("300ms")).toBeInTheDocument()
    expect(screen.getByText("--motion-duration-300")).toBeInTheDocument()
  })

  it("renders play button", () => {
    render(<MotionDuration durations={durations} />)
    expect(screen.getByRole("button", { name: "Play animation" })).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<MotionDuration durations={durations} />)
    expect(container.querySelector("[data-slot='motion-duration']")).toBeInTheDocument()
  })
})

describe("MotionEasing", () => {
  const easings = [
    { token: "--motion-easing-ease-out", name: "ease-out", value: "cubic-bezier(0, 0, 0.2, 1)" },
  ]

  it("renders easing name and value", () => {
    render(<MotionEasing easings={easings} />)
    expect(screen.getByText("ease-out")).toBeInTheDocument()
    expect(screen.getByText("cubic-bezier(0, 0, 0.2, 1)")).toBeInTheDocument()
  })

  it("renders play button", () => {
    render(<MotionEasing easings={easings} />)
    expect(screen.getByRole("button", { name: "Play animation" })).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<MotionEasing easings={easings} />)
    expect(container.querySelector("[data-slot='motion-easing']")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("MotionDuration has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <MotionDuration durations={[{ token: "--motion-duration-200", name: "200", ms: 200 }]} />
    )
    await checkA11y(container)
  })

  it("MotionEasing has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <MotionEasing easings={[{ token: "--motion-easing-ease-out", name: "ease-out", value: "cubic-bezier(0, 0, 0.2, 1)" }]} />
    )
    await checkA11y(container)
  })
})
