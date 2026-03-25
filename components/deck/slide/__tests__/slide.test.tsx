import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Slide } from "../slide"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Slide", () => {
  it("renders with data-slot attribute", () => {
    render(<Slide id="s1">Content</Slide>)
    const slide = document.querySelector('[data-slot="slide"]')
    expect(slide).toBeInTheDocument()
  })

  it("sets id on the section element", () => {
    render(<Slide id="s1">Content</Slide>)
    expect(document.getElementById("s1")).toBeInTheDocument()
  })

  it("applies light theme by default", () => {
    render(<Slide id="s1">Content</Slide>)
    const slide = document.querySelector('[data-slot="slide"]')
    expect(slide).toHaveAttribute("data-theme", "light")
  })

  it("applies dark theme when specified", () => {
    render(<Slide id="s1" theme="dark">Content</Slide>)
    const slide = document.querySelector('[data-slot="slide"]')
    expect(slide).toHaveAttribute("data-theme", "dark")
  })

  it("sets data-dot-nav attribute when dotNavTheme is provided", () => {
    render(<Slide id="s1" dotNavTheme="dark">Content</Slide>)
    const slide = document.querySelector('[data-slot="slide"]')
    expect(slide).toHaveAttribute("data-dot-nav", "dark")
  })

  it("renders hero background when hero and heroImage are set", () => {
    render(
      <Slide id="s1" hero heroImage="/hero.jpg">
        Content
      </Slide>
    )
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("renders background image when bgImage is set", () => {
    render(<Slide id="s1" bgImage="/bg.jpg">Content</Slide>)
    const img = document.querySelector("img")
    expect(img).toHaveAttribute("src", "/bg.jpg")
  })

  it("forwards custom className", () => {
    render(
      <Slide id="s1" className="custom">
        Content
      </Slide>
    )
    const slide = document.querySelector('[data-slot="slide"]')
    expect(slide).toHaveClass("custom")
  })

  it("applies center class when center prop is true", () => {
    render(<Slide id="s1" center>Content</Slide>)
    const slide = document.querySelector('[data-slot="slide"]')
    expect(slide).toHaveClass("center")
  })

  it("applies flush class when flush prop is true", () => {
    render(<Slide id="s1" flush>Content</Slide>)
    const slide = document.querySelector('[data-slot="slide"]')
    expect(slide).toHaveClass("flush")
  })

  it("applies photo class when photo prop is true", () => {
    render(<Slide id="s1" photo>Content</Slide>)
    const slide = document.querySelector('[data-slot="slide"]')
    expect(slide).toHaveClass("photo")
  })

  it("does not render hero background elements without heroImage", () => {
    render(<Slide id="s1" hero>Content</Slide>)
    const slide = document.querySelector('[data-slot="slide"]')
    expect(slide).toHaveClass("hero")
    // No hero background or overlay when heroImage is absent
    expect(document.querySelector(".heroBg")).not.toBeInTheDocument()
    expect(document.querySelector(".heroOverlay")).not.toBeInTheDocument()
  })

  it("wraps children in heroContent when hero and heroImage are set", () => {
    render(
      <Slide id="s1" hero heroImage="/hero.jpg">
        Wrapped content
      </Slide>
    )
    const heroContent = document.querySelector(".heroContent")
    expect(heroContent).toBeInTheDocument()
    expect(heroContent!.textContent).toBe("Wrapped content")
  })
})

describe("Slide accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<Slide id="s1">Content</Slide>)
    await checkA11y(container)
  })
})
