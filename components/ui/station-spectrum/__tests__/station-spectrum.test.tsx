import { render, screen } from "@testing-library/react"
import { describe, it, expect, beforeAll } from "vitest"
import { StationSpectrum } from "../station-spectrum"
import * as fs from "node:fs"
import * as path from "node:path"

const DEFAULT_STATIONS = [
  { num: "01", title: "Discovery", description: "Goals, audience, constraints." },
  { num: "02", title: "Brand", description: "Name, identity, voice." },
  { num: "03", title: "Product design" },
  { num: "04", title: "Engineering", description: "Apps, websites, APIs." },
  { num: "05", title: "Infrastructure", description: "Logs, metrics, deploys." },
]

const COMPACT_STATIONS = [
  { num: "01", title: "Plan" },
  { num: "02", title: "Build" },
  { num: "03", title: "Ship" },
]

describe("StationSpectrum", () => {
  it("renders all station titles", () => {
    render(<StationSpectrum stations={DEFAULT_STATIONS} />)
    expect(screen.getByText("Discovery")).toBeInTheDocument()
    expect(screen.getByText("Brand")).toBeInTheDocument()
    expect(screen.getByText("Product design")).toBeInTheDocument()
    expect(screen.getByText("Engineering")).toBeInTheDocument()
    expect(screen.getByText("Infrastructure")).toBeInTheDocument()
  })

  it("renders station numbers", () => {
    render(<StationSpectrum stations={DEFAULT_STATIONS} />)
    expect(screen.getAllByText(/0[1-5]/)).toHaveLength(5)
  })

  it("renders descriptions when provided", () => {
    render(<StationSpectrum stations={DEFAULT_STATIONS} />)
    expect(screen.getByText("Goals, audience, constraints.")).toBeInTheDocument()
    expect(screen.getByText("Name, identity, voice.")).toBeInTheDocument()
  })

  it("omits description when not provided on a station", () => {
    const { container } = render(<StationSpectrum stations={DEFAULT_STATIONS} />)
    // Find the <li> element for 'Product design' (station with no description)
    const listItems = container.querySelectorAll("li")
    const productDesign = Array.from(listItems).find((li) =>
      li.textContent?.includes("Product design") && !li.textContent?.includes("Wireframes")
    )
    expect(productDesign).not.toBeNull()
    // That li should have no description element (no element after the title span)
    const spans = productDesign?.querySelectorAll("span")
    // Should only have num and title in the label area (no description span)
    const hasDescription = Array.from(spans ?? []).some(
      (s) => s.textContent && !["03", "Product design"].includes(s.textContent)
    )
    expect(hasDescription).toBe(false)
  })

  it("renders as a <section> element with data-slot", () => {
    const { container } = render(<StationSpectrum stations={DEFAULT_STATIONS} />)
    const root = container.querySelector('[data-slot="station-spectrum"]')
    expect(root?.tagName).toBe("SECTION")
  })

  it("applies default density data attribute", () => {
    const { container } = render(<StationSpectrum stations={DEFAULT_STATIONS} />)
    const root = container.querySelector('[data-slot="station-spectrum"]')
    expect(root).toHaveAttribute("data-density", "default")
  })

  it("applies compact density data attribute", () => {
    const { container } = render(
      <StationSpectrum stations={COMPACT_STATIONS} density="compact" />
    )
    const root = container.querySelector('[data-slot="station-spectrum"]')
    expect(root).toHaveAttribute("data-density", "compact")
  })

  it("renders dot elements for each station", () => {
    const { container } = render(<StationSpectrum stations={DEFAULT_STATIONS} />)
    const dots = container.querySelectorAll('[class*="dot"]')
    // Each station has one dot; rail also has a dot class
    expect(dots.length).toBeGreaterThanOrEqual(5)
  })

  it("renders a rail element", () => {
    const { container } = render(<StationSpectrum stations={DEFAULT_STATIONS} />)
    const rail = container.querySelector('[class*="rail"]')
    expect(rail).not.toBeNull()
  })

  it("rail has aria-hidden", () => {
    const { container } = render(<StationSpectrum stations={DEFAULT_STATIONS} />)
    const rail = container.querySelector('[class*="rail"]')
    expect(rail).toHaveAttribute("aria-hidden", "true")
  })

  it("does NOT apply inView class when autoTrigger=false and inView=false", () => {
    const { container } = render(
      <StationSpectrum
        stations={DEFAULT_STATIONS}
        autoTrigger={false}
        inView={false}
      />
    )
    const root = container.querySelector('[data-slot="station-spectrum"]')
    // Should not have the inView class when not triggered
    expect(root?.className).not.toContain("inView")
  })

  it("applies inView class when autoTrigger=false and inView=true", () => {
    const { container } = render(
      <StationSpectrum
        stations={DEFAULT_STATIONS}
        autoTrigger={false}
        inView={true}
      />
    )
    const root = container.querySelector('[data-slot="station-spectrum"]')
    // Should have some indicator of active state
    expect(root?.className).toMatch(/inView/)
  })

  it("sets --idx CSS variable per station", () => {
    const { container } = render(<StationSpectrum stations={DEFAULT_STATIONS} />)
    const stationItems = container.querySelectorAll("li[style]")
    // Each li should have --idx set
    expect(stationItems.length).toBeGreaterThanOrEqual(5)
    const first = stationItems[0] as HTMLElement
    expect(first.style.getPropertyValue("--idx")).toBe("0")
  })

  it("passes through HTML attributes", () => {
    const { container } = render(
      <StationSpectrum
        stations={DEFAULT_STATIONS}
        id="process-spectrum"
        aria-label="5-phase engagement process"
        className="custom-class"
      />
    )
    const root = container.querySelector('[data-slot="station-spectrum"]')
    expect(root).toHaveAttribute("id", "process-spectrum")
    expect(root).toHaveAttribute("aria-label", "5-phase engagement process")
    expect(root).toHaveClass("custom-class")
  })

  it("forwards ref to the root element", () => {
    const ref = { current: null as HTMLElement | null }
    render(
      <StationSpectrum
        ref={ref}
        stations={DEFAULT_STATIONS}
        autoTrigger={false}
      />
    )
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("SECTION")
  })

  it("renders an accessible ordered list", () => {
    const { container } = render(<StationSpectrum stations={DEFAULT_STATIONS} />)
    const ol = container.querySelector("ol")
    expect(ol).not.toBeNull()
    expect(ol).toHaveAttribute("aria-label", "Process stages")
  })

  it("works with a 3-station compact layout", () => {
    render(
      <StationSpectrum stations={COMPACT_STATIONS} density="compact" />
    )
    expect(screen.getByText("Plan")).toBeInTheDocument()
    expect(screen.getByText("Build")).toBeInTheDocument()
    expect(screen.getByText("Ship")).toBeInTheDocument()
  })

  describe("CSS module token verification", () => {
    const CSS_PATH = path.join(
      __dirname,
      "..",
      "station-spectrum.module.css"
    )
    let cssSource: string

    beforeAll(() => {
      cssSource = fs.readFileSync(CSS_PATH, "utf-8")
    })

    it("references --motion-duration-slow", () => {
      expect(cssSource).toContain("--motion-duration-slow")
    })

    it("references --motion-easing-enter", () => {
      expect(cssSource).toContain("--motion-easing-enter")
    })

    it("references --stroke-width-thin", () => {
      expect(cssSource).toContain("--stroke-width-thin")
    })

    it("references --interactive-primary-bg", () => {
      expect(cssSource).toContain("--interactive-primary-bg")
    })

    it("references --border-default", () => {
      expect(cssSource).toContain("--border-default")
    })

    it("uses transform scaleX for rail draw animation", () => {
      expect(cssSource).toContain("scaleX(0)")
      expect(cssSource).toContain("scaleX(1)")
    })

    it("has prefers-reduced-motion guard", () => {
      expect(cssSource).toContain("prefers-reduced-motion: reduce")
    })

    it("has no hardcoded hex colors as primary values (only var() fallbacks)", () => {
      const linesWithBareHex = cssSource
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim()
          if (trimmed.startsWith("/*") || trimmed.startsWith("*")) return false
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
          // Allow intentional constants (dot-delay-step, rail-delay) documented in comments
          // These are documented as intentional constants in the file
          if (trimmed.includes("dot-delay-step") || trimmed.includes("rail-delay")) return false
          return /:\s*\d+m?s\b/.test(trimmed) && !trimmed.includes("var(")
        })
      expect(linesWithBareMs).toHaveLength(0)
    })
  })
})
