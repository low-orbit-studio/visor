import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  ScoreIndicator,
  deriveAutoTone,
} from "../score-indicator"

describe("ScoreIndicator", () => {
  it("renders the value and default denominator", () => {
    render(<ScoreIndicator value={98} max={100} />)
    expect(screen.getByText("98")).toBeInTheDocument()
    expect(screen.getByText("/ 100")).toBeInTheDocument()
  })

  it("renders default ariaLabel as 'value out of max'", () => {
    render(<ScoreIndicator value={98} max={100} />)
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "98 out of 100"
    )
  })

  it("uses an explicit ariaLabel override", () => {
    render(
      <ScoreIndicator value={98} max={100} ariaLabel="Health score" />
    )
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "Health score"
    )
  })

  it("applies data-slot to the root", () => {
    const { container } = render(<ScoreIndicator value={50} />)
    const root = container.querySelector('[data-slot="score-indicator"]')
    expect(root).not.toBeNull()
  })

  it("forwards ref to the root span", () => {
    const ref = { current: null as HTMLSpanElement | null }
    render(<ScoreIndicator ref={ref} value={50} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("SPAN")
  })

  it("forwards className to the root", () => {
    const { container } = render(
      <ScoreIndicator value={50} className="custom-class" />
    )
    const root = container.querySelector('[data-slot="score-indicator"]')
    expect(root).toHaveClass("custom-class")
  })

  describe("auto tone mapping", () => {
    it("maps ratio >= 0.85 to success", () => {
      const { container } = render(<ScoreIndicator value={90} max={100} />)
      expect(
        container.querySelector('[data-tone="success"]')
      ).not.toBeNull()
    })

    it("maps ratio in [0.60, 0.85) to info", () => {
      const { container } = render(<ScoreIndicator value={72} max={100} />)
      expect(container.querySelector('[data-tone="info"]')).not.toBeNull()
    })

    it("maps ratio in [0.40, 0.60) to warning", () => {
      const { container } = render(<ScoreIndicator value={42} max={100} />)
      expect(
        container.querySelector('[data-tone="warning"]')
      ).not.toBeNull()
    })

    it("maps ratio < 0.40 to destructive", () => {
      const { container } = render(<ScoreIndicator value={20} max={100} />)
      expect(
        container.querySelector('[data-tone="destructive"]')
      ).not.toBeNull()
    })

    it("clamps value to [0, max] when computing the auto tone", () => {
      const { container } = render(<ScoreIndicator value={150} max={100} />)
      expect(
        container.querySelector('[data-tone="success"]')
      ).not.toBeNull()
    })
  })

  describe("explicit tone overrides auto", () => {
    it("renders destructive even at high value", () => {
      const { container } = render(
        <ScoreIndicator value={98} tone="destructive" />
      )
      expect(
        container.querySelector('[data-tone="destructive"]')
      ).not.toBeNull()
    })

    it("renders neutral at any ratio", () => {
      const { container } = render(<ScoreIndicator value={42} tone="neutral" />)
      expect(
        container.querySelector('[data-tone="neutral"]')
      ).not.toBeNull()
    })
  })

  describe("denominator modes", () => {
    it("hides the trailing label when denominator=none", () => {
      render(<ScoreIndicator value={98} denominator="none" />)
      expect(screen.queryByText("/ 100")).toBeNull()
    })

    it("shows the trailing label by default", () => {
      const { container } = render(<ScoreIndicator value={98} />)
      expect(
        container.querySelector('[data-denominator="trailing"]')
      ).not.toBeNull()
      expect(screen.getByText("/ 100")).toBeInTheDocument()
    })

    it("supports denominator=below", () => {
      const { container } = render(
        <ScoreIndicator value={98} denominator="below" />
      )
      expect(
        container.querySelector('[data-denominator="below"]')
      ).not.toBeNull()
      expect(screen.getByText("/ 100")).toBeInTheDocument()
    })
  })

  describe("sizes", () => {
    it.each(["sm", "md", "lg"] as const)("renders %s size", (size) => {
      const { container } = render(<ScoreIndicator value={50} size={size} />)
      expect(
        container.querySelector(`[data-size="${size}"]`)
      ).not.toBeNull()
    })
  })

  describe("icon overlay", () => {
    it("renders an icon overlay for destructive tone", () => {
      const { container } = render(
        <ScoreIndicator value={20} tone="destructive" />
      )
      expect(
        container.querySelector('[data-slot="score-indicator-icon"]')
      ).not.toBeNull()
    })

    it("renders an icon overlay for warning tone", () => {
      const { container } = render(<ScoreIndicator value={45} tone="warning" />)
      expect(
        container.querySelector('[data-slot="score-indicator-icon"]')
      ).not.toBeNull()
    })

    it("does not render an icon overlay for success / info / neutral", () => {
      const { container, rerender } = render(
        <ScoreIndicator value={98} tone="success" />
      )
      expect(
        container.querySelector('[data-slot="score-indicator-icon"]')
      ).toBeNull()

      rerender(<ScoreIndicator value={70} tone="info" />)
      expect(
        container.querySelector('[data-slot="score-indicator-icon"]')
      ).toBeNull()

      rerender(<ScoreIndicator value={50} tone="neutral" />)
      expect(
        container.querySelector('[data-slot="score-indicator-icon"]')
      ).toBeNull()
    })
  })

  describe("custom format", () => {
    it("uses a custom formatter for the value", () => {
      render(
        <ScoreIndicator
          value={86}
          max={100}
          format={(v) => `${v}%`}
        />
      )
      expect(screen.getByText("86%")).toBeInTheDocument()
    })

    it("does not affect the aria-label", () => {
      render(
        <ScoreIndicator
          value={86}
          max={100}
          format={(v) => `${v}%`}
        />
      )
      expect(screen.getByRole("img")).toHaveAttribute(
        "aria-label",
        "86 out of 100"
      )
    })
  })

  it("renders a track + indicator SVG circle", () => {
    const { container } = render(<ScoreIndicator value={50} max={100} />)
    const circles = container.querySelectorAll("circle")
    expect(circles.length).toBe(2)
  })

  it("falls back to max=100 when max prop is zero", () => {
    const { container } = render(<ScoreIndicator value={50} max={0} />)
    expect(container.querySelector('[data-tone]')).not.toBeNull()
    expect(screen.getByText("/ 100")).toBeInTheDocument()
  })
})

describe("deriveAutoTone", () => {
  it("returns success at ratio >= 0.85", () => {
    expect(deriveAutoTone(0.85)).toBe("success")
    expect(deriveAutoTone(1)).toBe("success")
  })

  it("returns info at ratio in [0.60, 0.85)", () => {
    expect(deriveAutoTone(0.6)).toBe("info")
    expect(deriveAutoTone(0.84)).toBe("info")
  })

  it("returns warning at ratio in [0.40, 0.60)", () => {
    expect(deriveAutoTone(0.4)).toBe("warning")
    expect(deriveAutoTone(0.59)).toBe("warning")
  })

  it("returns destructive at ratio < 0.40", () => {
    expect(deriveAutoTone(0)).toBe("destructive")
    expect(deriveAutoTone(0.39)).toBe("destructive")
  })
})
