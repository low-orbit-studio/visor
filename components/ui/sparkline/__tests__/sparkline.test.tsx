import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Sparkline } from "../sparkline"
import { checkA11y } from "../../../../test-utils/a11y"

const SAMPLE = [12, 18, 22, 19, 27, 36, 41, 48, 54, 62, 71, 84]

describe("Sparkline", () => {
  it("renders an svg with default dimensions", () => {
    const { container } = render(<Sparkline values={SAMPLE} />)
    const svg = container.querySelector("svg")
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute("width", "96")
    expect(svg).toHaveAttribute("height", "22")
    expect(svg).toHaveAttribute("viewBox", "0 0 96 22")
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<Sparkline values={SAMPLE} />)
    expect(container.querySelector("svg")).toHaveAttribute(
      "data-slot",
      "sparkline"
    )
  })

  it("returns null for empty values", () => {
    const { container } = render(<Sparkline values={[]} />)
    expect(container.querySelector("svg")).toBeNull()
  })

  it("returns null for a single value (length < 2)", () => {
    const { container } = render(<Sparkline values={[42]} />)
    expect(container.querySelector("svg")).toBeNull()
  })

  it("renders a minimum two-point polyline", () => {
    const { container } = render(<Sparkline values={[10, 20]} />)
    const polyline = container.querySelector("polyline")
    expect(polyline).not.toBeNull()
    const points = polyline?.getAttribute("points") ?? ""
    expect(points.split(" ")).toHaveLength(2)
  })

  it("computes polyline points with x = i * width / (length - 1)", () => {
    // values=[0, 10] across width=10, height=10:
    // i=0 → x=0, y=10 (min) ; i=1 → x=10, y=0 (max)
    const { container } = render(
      <Sparkline values={[0, 10]} width={10} height={10} />
    )
    const points =
      container.querySelector("polyline")?.getAttribute("points") ?? ""
    expect(points).toBe("0.0,10.0 10.0,0.0")
  })

  it("normalizes y against min/max with a flat series safely", () => {
    // All values equal → range = 0; component should fall back to range=1
    // so points stay finite and y collapses to height (no NaN).
    const { container } = render(
      <Sparkline values={[5, 5, 5, 5]} width={30} height={10} />
    )
    const points =
      container.querySelector("polyline")?.getAttribute("points") ?? ""
    expect(points).toBe("0.0,10.0 10.0,10.0 20.0,10.0 30.0,10.0")
    expect(points).not.toMatch(/NaN/)
  })

  it("respects custom width and height", () => {
    const { container } = render(
      <Sparkline values={SAMPLE} width={160} height={48} />
    )
    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("width", "160")
    expect(svg).toHaveAttribute("height", "48")
    expect(svg).toHaveAttribute("viewBox", "0 0 160 48")
  })

  it("defaults stroke to var(--accent-primary)", () => {
    const { container } = render(<Sparkline values={SAMPLE} />)
    expect(container.querySelector("polyline")).toHaveAttribute(
      "stroke",
      "var(--accent-primary)"
    )
  })

  it("accepts a CSS variable color override", () => {
    const { container } = render(
      <Sparkline values={SAMPLE} color="var(--text-success)" />
    )
    expect(container.querySelector("polyline")).toHaveAttribute(
      "stroke",
      "var(--text-success)"
    )
  })

  it("accepts a hex color override", () => {
    const { container } = render(
      <Sparkline values={SAMPLE} color="#1A5F7A" />
    )
    expect(container.querySelector("polyline")).toHaveAttribute(
      "stroke",
      "#1A5F7A"
    )
  })

  it("defaults strokeWidth to 1.5", () => {
    const { container } = render(<Sparkline values={SAMPLE} />)
    expect(container.querySelector("polyline")).toHaveAttribute(
      "stroke-width",
      "1.5"
    )
  })

  it("respects custom strokeWidth", () => {
    const { container } = render(
      <Sparkline values={SAMPLE} strokeWidth={3} />
    )
    expect(container.querySelector("polyline")).toHaveAttribute(
      "stroke-width",
      "3"
    )
  })

  it("is decorative (aria-hidden) by default", () => {
    const { container } = render(<Sparkline values={SAMPLE} />)
    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("aria-hidden", "true")
    expect(svg).not.toHaveAttribute("aria-label")
  })

  it("becomes a labeled image when aria-label is supplied", () => {
    const { container } = render(
      <Sparkline values={SAMPLE} aria-label="RSVPs over 12 weeks" />
    )
    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("aria-label", "RSVPs over 12 weeks")
    expect(svg).not.toHaveAttribute("aria-hidden")
    expect(svg).toHaveAttribute("role", "img")
  })

  it("forwards ref", () => {
    const ref = { current: null as SVGSVGElement | null }
    render(<Sparkline ref={ref} values={SAMPLE} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName.toLowerCase()).toBe("svg")
  })

  it("forwards className", () => {
    const { container } = render(
      <Sparkline values={SAMPLE} className="custom-spark" />
    )
    expect(container.querySelector("svg")).toHaveClass("custom-spark")
  })
})

describe("Sparkline accessibility", () => {
  it("has no WCAG 2.1 AA violations when decorative", async () => {
    const { container } = render(<Sparkline values={SAMPLE} />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations when labeled", async () => {
    const { container } = render(
      <Sparkline values={SAMPLE} aria-label="RSVPs over 12 weeks" />
    )
    await checkA11y(container)
  })
})
