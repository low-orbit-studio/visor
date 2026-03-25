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
})

describe("Slide accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<Slide id="s1">Content</Slide>)
    await checkA11y(container)
  })
})
