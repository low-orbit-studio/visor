import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { GrainOverlay } from "../grain-overlay"

describe("GrainOverlay", () => {
  it("renders a single div", () => {
    const { container } = render(<GrainOverlay />)
    const el = container.firstElementChild as HTMLElement
    expect(el).toBeInTheDocument()
    expect(el.tagName).toBe("DIV")
  })

  it("is aria-hidden", () => {
    const { container } = render(<GrainOverlay />)
    const el = container.firstElementChild as HTMLElement
    expect(el).toHaveAttribute("aria-hidden", "true")
  })

  it("applies default opacity of 0.035", () => {
    const { container } = render(<GrainOverlay />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.opacity).toBe("0.035")
  })

  it("applies default zIndex of 30", () => {
    const { container } = render(<GrainOverlay />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.zIndex).toBe("30")
  })

  it("accepts custom opacity", () => {
    const { container } = render(<GrainOverlay opacity={0.06} />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.opacity).toBe("0.06")
  })

  it("accepts custom zIndex", () => {
    const { container } = render(<GrainOverlay zIndex={50} />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.zIndex).toBe("50")
  })

  it("has pointer-events-none via CSS class (grain class applied)", () => {
    const { container } = render(<GrainOverlay />)
    const el = container.firstElementChild as HTMLElement
    // The grain CSS class must be present — pointer-events:none is in the stylesheet
    expect(el.className).toContain("grain")
  })
})
