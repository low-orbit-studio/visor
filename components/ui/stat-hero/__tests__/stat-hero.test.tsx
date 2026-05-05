import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { StatHero } from "../stat-hero"
import * as fs from "node:fs"
import * as path from "node:path"

const VALUES = [100, 120, 110, 140, 130, 160]

describe("StatHero", () => {
  it("renders label and value", () => {
    render(
      <StatHero label="Monthly Recurring Revenue" value="$1,240,000" values={VALUES} />
    )
    expect(screen.getByText("Monthly Recurring Revenue")).toBeInTheDocument()
    expect(screen.getByText("$1,240,000")).toBeInTheDocument()
  })

  it("renders as an <article> element", () => {
    const { container } = render(
      <StatHero label="Revenue" value="$1M" values={VALUES} />
    )
    const root = container.querySelector('[data-slot="stat-hero"]')
    expect(root?.tagName).toBe("ARTICLE")
  })

  it("renders an SVG polyline with stroke='currentColor'", () => {
    const { container } = render(
      <StatHero label="Revenue" value="$1M" values={VALUES} />
    )
    const polyline = container.querySelector("polyline")
    expect(polyline).not.toBeNull()
    expect(polyline?.getAttribute("stroke")).toBe("currentColor")
  })

  it("renders an SVG trendline when values.length >= 2", () => {
    const { container } = render(
      <StatHero label="Revenue" value="$1M" values={[100, 200]} />
    )
    expect(container.querySelector("svg")).not.toBeNull()
    expect(container.querySelector("polyline")).not.toBeNull()
  })

  it("does NOT render SVG when values.length < 2", () => {
    const { container } = render(
      <StatHero label="Revenue" value="$1M" values={[100]} />
    )
    expect(container.querySelector("svg")).toBeNull()
    expect(container.querySelector("polyline")).toBeNull()
  })

  it("does NOT render SVG when values is empty", () => {
    const { container } = render(
      <StatHero label="Revenue" value="$1M" values={[]} />
    )
    expect(container.querySelector("svg")).toBeNull()
  })

  it("renders an upward delta with accessible text", () => {
    const { container } = render(
      <StatHero
        label="Revenue"
        value="$1M"
        values={VALUES}
        delta={{ value: "+18.2%", direction: "up" }}
      />
    )
    const delta = container.querySelector('[data-slot="stat-hero-delta"]')
    expect(delta).not.toBeNull()
    expect(delta).toHaveAttribute("data-direction", "up")
    expect(delta?.textContent).toContain("+18.2%")
    expect(delta?.textContent).toContain("up")
  })

  it("renders a downward delta with accessible text", () => {
    const { container } = render(
      <StatHero
        label="Churn"
        value="3.2%"
        values={VALUES}
        delta={{ value: "-0.4%", direction: "down" }}
      />
    )
    const delta = container.querySelector('[data-slot="stat-hero-delta"]')
    expect(delta).toHaveAttribute("data-direction", "down")
    expect(delta?.textContent).toContain("-0.4%")
    expect(delta?.textContent).toContain("down")
  })

  it("renders a flat delta with accessible text", () => {
    const { container } = render(
      <StatHero
        label="Signups"
        value="412"
        values={VALUES}
        delta={{ value: "0%", direction: "flat" }}
      />
    )
    const delta = container.querySelector('[data-slot="stat-hero-delta"]')
    expect(delta).toHaveAttribute("data-direction", "flat")
    expect(delta?.textContent).toContain("flat")
  })

  it("renders caption when provided", () => {
    render(
      <StatHero
        label="Revenue"
        value="$1M"
        values={VALUES}
        caption="vs same period last year"
      />
    )
    expect(screen.getByText("vs same period last year")).toBeInTheDocument()
  })

  it("omits delta slot when not provided", () => {
    const { container } = render(
      <StatHero label="Revenue" value="$1M" values={VALUES} />
    )
    expect(container.querySelector('[data-slot="stat-hero-delta"]')).toBeNull()
  })

  it("omits caption slot when not provided", () => {
    const { container } = render(
      <StatHero label="Revenue" value="$1M" values={VALUES} />
    )
    expect(container.querySelector('[data-slot="stat-hero-caption"]')).toBeNull()
  })

  it("passes through HTML attributes", () => {
    const { container } = render(
      <StatHero
        label="Revenue"
        value="$1M"
        values={VALUES}
        id="hero-revenue"
        aria-label="Revenue hero metric"
        className="custom-class"
      />
    )
    const root = container.querySelector('[data-slot="stat-hero"]')
    expect(root).toHaveAttribute("id", "hero-revenue")
    expect(root).toHaveAttribute("aria-label", "Revenue hero metric")
    expect(root).toHaveClass("custom-class")
  })

  it("forwards ref to the root element", () => {
    const ref = { current: null as HTMLElement | null }
    render(<StatHero ref={ref} label="Revenue" value="$1M" values={VALUES} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("ARTICLE")
  })

  describe("CSS module token verification", () => {
    const CSS_PATH = path.join(
      __dirname,
      "..",
      "stat-hero.module.css"
    )
    let cssSource: string

    beforeAll(() => {
      cssSource = fs.readFileSync(CSS_PATH, "utf-8")
    })

    it("references --interactive-primary-bg", () => {
      expect(cssSource).toContain("--interactive-primary-bg")
    })

    it("references --motion-duration-800", () => {
      expect(cssSource).toContain("--motion-duration-800")
    })

    it("references --motion-easing-ease-out", () => {
      expect(cssSource).toContain("--motion-easing-ease-out")
    })

    it("references --stroke-width-medium", () => {
      expect(cssSource).toContain("--stroke-width-medium")
    })

    it("has no hardcoded hex colors", () => {
      // Strip comments, then check for hex color literals that aren't in fallbacks
      // Only strict 6-digit hex colors not inside var() fallbacks are forbidden.
      // We allow Gray fallback values (#111827, #6b7280, etc.) per token-rules.md
      // What we forbid is bare hex used as the primary value rather than a fallback.
      // Simple check: no bare color: #XXXXXX; (with semicolon, no var() on that line)
      const linesWithBareHex = cssSource
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim()
          // Skip comment lines
          if (trimmed.startsWith("/*") || trimmed.startsWith("*")) return false
          // Check for hex values not inside var()
          return /:\s*#[0-9a-fA-F]{3,6}(?!\w)/.test(trimmed) && !trimmed.includes("var(")
        })
      expect(linesWithBareHex).toHaveLength(0)
    })

    it("has no hardcoded ms/s duration literals outside var()", () => {
      const linesWithBareMs = cssSource
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim()
          if (trimmed.startsWith("/*") || trimmed.startsWith("*")) return false
          return /:\s*\d+m?s\b/.test(trimmed) && !trimmed.includes("var(")
        })
      expect(linesWithBareMs).toHaveLength(0)
    })

    it("has no hardcoded px stroke-width literals outside var()", () => {
      // stroke-width should use token, not literal px
      const linesWithBareStroke = cssSource
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim()
          if (trimmed.startsWith("/*") || trimmed.startsWith("*")) return false
          return /stroke-width\s*:\s*\d+(?:px)?/.test(trimmed) && !trimmed.includes("var(")
        })
      expect(linesWithBareStroke).toHaveLength(0)
    })
  })
})
