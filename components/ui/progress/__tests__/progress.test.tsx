import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
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

  // animate={false} — skip entrance animation, verify transform directly
  it("renders with value 0 (animate=false)", () => {
    const { container } = render(<Progress value={0} animate={false} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")
    expect(indicator).toBeInTheDocument()
    expect((indicator as HTMLElement).style.transform).toBe("translateX(-100%)")
  })

  it("renders with value 100 (animate=false)", () => {
    const { container } = render(<Progress value={100} animate={false} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")
    expect(indicator).toBeInTheDocument()
    expect((indicator as HTMLElement).style.transform).toBe("translateX(-0%)")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<Progress ref={ref} value={50} />)
    expect(ref.current).not.toBeNull()
  })

  it("renders indicator with correct transform (animate=false)", () => {
    const { container } = render(<Progress value={40} animate={false} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")
    expect(indicator).toBeInTheDocument()
    expect((indicator as HTMLElement).style.transform).toBe("translateX(-60%)")
  })

  it("default rendering omits data-size and data-animate attributes", () => {
    render(<Progress value={50} />)
    const bar = screen.getByRole("progressbar")
    expect(bar).not.toHaveAttribute("data-size")
    expect(bar).not.toHaveAttribute("data-animate")
  })

  it("size=\"thin\" sets data-size=\"thin\" on the root", () => {
    render(<Progress value={50} size="thin" />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-size", "thin")
  })

  it("size=\"default\" does not emit data-size attribute", () => {
    render(<Progress value={50} size="default" />)
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("data-size")
  })

  it("animate={false} sets data-animate=\"false\" on the root", () => {
    render(<Progress value={50} animate={false} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-animate", "false")
  })

  it("animate={true} does not emit data-animate attribute", () => {
    render(<Progress value={50} animate={true} />)
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("data-animate")
  })

  it("combines size=\"thin\" and animate={false} for static chrome", () => {
    render(
      <Progress
        value={72}
        size="thin"
        animate={false}
        aria-label="Time until door opens"
      />,
    )
    const bar = screen.getByRole("progressbar")
    expect(bar).toHaveAttribute("data-size", "thin")
    expect(bar).toHaveAttribute("data-animate", "false")
    expect(bar).toHaveAttribute("aria-label", "Time until door opens")
  })
})

describe("Progress entrance animation", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders the indicator at its real value immediately (no empty-bar flash)", () => {
    // The indicator's resting transform is always the real value — SSR-safe and
    // visible before/without hydration. The entrance sweep is a pure CSS keyframe.
    const { container } = render(<Progress value={75} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")
    expect((indicator as HTMLElement).style.transform).toBe("translateX(-25%)")
  })

  it("applies the entrance-animation class by default (animate=true)", () => {
    const { container } = render(<Progress value={75} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")
    const classes = Array.from((indicator as HTMLElement).classList)
    expect(classes.some((c) => c.includes("indicatorAnimated"))).toBe(true)
  })

  it("renders at value and omits the entrance class when animate={false}", () => {
    const { container } = render(<Progress value={50} animate={false} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")
    expect((indicator as HTMLElement).style.transform).toBe("translateX(-50%)")
    const classes = Array.from((indicator as HTMLElement).classList)
    expect(classes.some((c) => c.includes("indicatorAnimated"))).toBe(false)
  })

  it("sets --progress-animation-duration to default 1500ms", async () => {
    const { container } = render(<Progress value={50} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")
    // Custom property is set immediately (always present when animate=true)
    expect((indicator as HTMLElement).style.getPropertyValue("--progress-animation-duration")).toBe("1500ms")
  })

  it("sets --progress-animation-duration to custom duration", () => {
    const { container } = render(<Progress value={50} duration={300} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")
    expect((indicator as HTMLElement).style.getPropertyValue("--progress-animation-duration")).toBe("300ms")
  })

  it("does not set --progress-animation-duration when animate=false", () => {
    const { container } = render(<Progress value={50} animate={false} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")
    expect((indicator as HTMLElement).style.getPropertyValue("--progress-animation-duration")).toBe("")
  })

  // Reduced-motion handling is now CSS-only (`@media (prefers-reduced-motion: reduce)`
  // disables the keyframe + transition). The indicator already renders at its real
  // value, so there is no JS branch left to unit-test in jsdom.
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

  it("has no WCAG 2.1 AA violations on thin static-chrome variant", async () => {
    const { container } = render(
      <Progress
        value={72}
        size="thin"
        animate={false}
        aria-label="Time until door opens"
      />,
    )
    await checkA11y(container)
  })
})
