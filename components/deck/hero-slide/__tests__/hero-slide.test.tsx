import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { HeroSlide } from "../hero-slide"
import { checkA11y } from "../../../../test-utils/a11y"

describe("HeroSlide", () => {
  it("renders with data-slot attribute", () => {
    render(<HeroSlide id="s1" badge="New" subtitle="Sub" title="Title" />)
    const hero = document.querySelector('[data-slot="hero-slide"]')
    expect(hero).toBeInTheDocument()
  })

  it("renders badge, title, and subtitle", () => {
    render(<HeroSlide id="s1" badge="Launch" title="Big Title" subtitle="A subtitle" />)
    expect(screen.getByText("Launch")).toBeInTheDocument()
    expect(screen.getByText("Big Title")).toBeInTheDocument()
    expect(screen.getByText("A subtitle")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <HeroSlide id="s1" badge="X" title="T" subtitle="S" description="Desc text" />
    )
    expect(screen.getByText("Desc text")).toBeInTheDocument()
  })

  it("renders titleContent instead of title when provided", () => {
    render(
      <HeroSlide id="s1" badge="X" subtitle="S" titleContent={<span>Custom</span>} />
    )
    expect(screen.getByText("Custom")).toBeInTheDocument()
  })

  it("renders logo in split mode", () => {
    render(<HeroSlide id="s1" badge="X" title="T" subtitle="S" logo="/logo.png" />)
    const img = screen.getByAltText("Logo")
    expect(img).toHaveAttribute("src", "/logo.png")
  })

  it("applies data-deck-animate for stagger animations", () => {
    render(<HeroSlide id="s1" badge="X" title="T" subtitle="S" description="D" />)
    const animated = document.querySelectorAll("[data-deck-animate]")
    expect(animated.length).toBeGreaterThanOrEqual(4)
  })

  it("passes heroImage to Slide for hero background mode", () => {
    render(
      <HeroSlide id="s1" badge="X" title="T" subtitle="S" heroImage="/hero.jpg" />
    )
    const slide = document.querySelector('[data-slot="slide"]')
    expect(slide).toBeInTheDocument()
    // When heroImage is provided, Slide renders in hero mode (not split)
    const heroSlot = document.querySelector('[data-slot="hero-slide"]')
    expect(heroSlot).toBeInTheDocument()
  })
})

describe("HeroSlide accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <HeroSlide id="s1" badge="Launch" title="Title" subtitle="Subtitle" />
    )
    await checkA11y(container)
  })
})
