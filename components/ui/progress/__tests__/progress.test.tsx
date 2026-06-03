import { render, screen, act, waitFor } from "@testing-library/react"
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

  it("starts at translateX(-100%) before rAF fires (default animate=true)", () => {
    const { container } = render(<Progress value={75} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")
    // Before rAF: displayValue is 0 → indicator at 0% fill
    expect((indicator as HTMLElement).style.transform).toBe("translateX(-100%)")
  })

  it("animates to target value after rAF fires", async () => {
    // jsdom's requestAnimationFrame does not auto-fire callbacks; mock it to
    // invoke the callback synchronously so we can assert the post-animation state.
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb) => { cb(0); return 1 })

    const { container } = render(<Progress value={75} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")

    await act(async () => {
      // rAF was called synchronously in the mock, so state is already updated.
    })

    expect((indicator as HTMLElement).style.transform).toBe("translateX(-25%)")
    rafSpy.mockRestore()
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

  it("fills instantly when prefers-reduced-motion is set", async () => {
    // Override the global matchMedia mock to return matches: true for reduced motion
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }))

    const { container } = render(<Progress value={60} />)
    const indicator = container.querySelector("[data-slot='progress-indicator']")

    // With reduced motion, setDisplayValue is called synchronously (no rAF),
    // so after useEffect flushes the value should be set.
    await act(async () => {
      await waitFor(() => {
        expect((indicator as HTMLElement).style.transform).toBe("translateX(-40%)")
      })
    })
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
