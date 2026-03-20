import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Starfield } from "../starfield"

describe("Starfield", () => {
  it("renders a starfield container", () => {
    const { container } = render(<Starfield />)
    const starfield = container.querySelector(".starfield")
    expect(starfield).toBeInTheDocument()
  })

  it("renders 130 stars after mount", () => {
    const { container } = render(<Starfield />)
    const stars = container.querySelectorAll(".star")
    expect(stars).toHaveLength(130)
  })

  it("stars have expected CSS properties", () => {
    const { container } = render(<Starfield />)

    const star = container.querySelector(".star") as HTMLElement
    expect(star).toBeInTheDocument()
    expect(star.style.position).toBe("")  // position set via CSS class, not inline
    expect(star.style.left).toMatch(/%$/)
    expect(star.style.top).toMatch(/%$/)
    expect(star.style.getPropertyValue("--d")).toMatch(/s$/)
    expect(star.style.animationDelay).toMatch(/s$/)
  })
})
