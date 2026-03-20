import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Progress } from "../progress"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Progress", () => {
  it("renders without crashing", () => {
    render(<Progress value={50} />)
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<Progress value={50} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-slot", "progress")
  })

  it("renders with custom className", () => {
    render(<Progress value={50} className="custom-progress" />)
    expect(screen.getByRole("progressbar")).toHaveClass("custom-progress")
  })

  it("renders with a value prop", () => {
    render(<Progress value={75} />)
    const bar = screen.getByRole("progressbar")
    expect(bar).toBeInTheDocument()
    expect(bar).toHaveAttribute("aria-valuemax", "100")
  })

  it("renders with value 0", () => {
    const { container } = render(<Progress value={0} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")
    expect(indicator).toBeInTheDocument()
    expect((indicator as HTMLElement).style.transform).toBe("translateX(-100%)")
  })

  it("renders with value 100", () => {
    const { container } = render(<Progress value={100} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")
    expect(indicator).toBeInTheDocument()
    expect((indicator as HTMLElement).style.transform).toBe("translateX(-0%)")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<Progress ref={ref} value={50} />)
    expect(ref.current).not.toBeNull()
  })

  it("renders indicator with correct transform", () => {
    const { container } = render(<Progress value={40} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")
    expect(indicator).toBeInTheDocument()
    expect((indicator as HTMLElement).style.transform).toBe("translateX(-60%)")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<Progress value={50} aria-label="Upload progress" />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations with aria-labelledby", async () => {
    const { container } = render(
      <div>
        <p id="progress-label">Loading files...</p>
        <Progress value={75} aria-labelledby="progress-label" />
      </div>
    )
    await checkA11y(container)
  })
})
