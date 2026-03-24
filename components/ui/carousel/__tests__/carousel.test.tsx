import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "../carousel"
import { checkA11y } from "../../../../test-utils/a11y"

function BasicCarousel() {
  return (
    <Carousel>
      <CarouselContent>
        <CarouselItem>Slide 1</CarouselItem>
        <CarouselItem>Slide 2</CarouselItem>
        <CarouselItem>Slide 3</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}

describe("Carousel", () => {
  it("renders with role region and aria-roledescription carousel", () => {
    render(<BasicCarousel />)
    const region = screen.getByRole("region")
    expect(region).toHaveAttribute("aria-roledescription", "carousel")
  })

  it("sets data-slot on root", () => {
    render(<BasicCarousel />)
    const region = screen.getByRole("region")
    expect(region).toHaveAttribute("data-slot", "carousel")
  })

  it("sets data-orientation on root (defaults to horizontal)", () => {
    render(<BasicCarousel />)
    const region = screen.getByRole("region")
    expect(region).toHaveAttribute("data-orientation", "horizontal")
  })

  it("sets data-slot on carousel-content", () => {
    render(<BasicCarousel />)
    const content = document.querySelector('[data-slot="carousel-content"]')
    expect(content).toBeInTheDocument()
  })

  it("sets data-slot on carousel-item", () => {
    render(<BasicCarousel />)
    const items = document.querySelectorAll('[data-slot="carousel-item"]')
    expect(items).toHaveLength(3)
  })

  it("sets data-slot on carousel-previous", () => {
    render(<BasicCarousel />)
    const prev = document.querySelector('[data-slot="carousel-previous"]')
    expect(prev).toBeInTheDocument()
  })

  it("sets data-slot on carousel-next", () => {
    render(<BasicCarousel />)
    const next = document.querySelector('[data-slot="carousel-next"]')
    expect(next).toBeInTheDocument()
  })

  it("renders carousel items with role group and aria-roledescription slide", () => {
    render(<BasicCarousel />)
    const slides = screen.getAllByRole("group")
    expect(slides).toHaveLength(3)
    slides.forEach((slide) => {
      expect(slide).toHaveAttribute("aria-roledescription", "slide")
    })
  })

  it("previous button renders with accessible label", () => {
    render(<BasicCarousel />)
    expect(screen.getByText("Previous slide")).toBeInTheDocument()
  })

  it("next button renders with accessible label", () => {
    render(<BasicCarousel />)
    expect(screen.getByText("Next slide")).toBeInTheDocument()
  })

  it("accepts custom className on root", () => {
    render(
      <Carousel className="custom-class" data-testid="carousel-root">
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
        </CarouselContent>
      </Carousel>
    )
    expect(screen.getByTestId("carousel-root")).toHaveClass("custom-class")
  })

  it("accepts custom className on CarouselContent", () => {
    render(
      <Carousel>
        <CarouselContent className="custom-content">
          <CarouselItem>Slide 1</CarouselItem>
        </CarouselContent>
      </Carousel>
    )
    const content = document.querySelector('[data-slot="carousel-content"]')
    expect(content).toHaveClass("custom-content")
  })

  it("accepts custom className on CarouselItem", () => {
    render(
      <Carousel>
        <CarouselContent>
          <CarouselItem className="custom-item">Slide 1</CarouselItem>
        </CarouselContent>
      </Carousel>
    )
    const item = document.querySelector('[data-slot="carousel-item"]')
    expect(item).toHaveClass("custom-item")
  })

  it("accepts custom className on navigation buttons", () => {
    render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
        </CarouselContent>
        <CarouselPrevious className="custom-prev" />
        <CarouselNext className="custom-next" />
      </Carousel>
    )
    const prev = document.querySelector('[data-slot="carousel-previous"]')
    const next = document.querySelector('[data-slot="carousel-next"]')
    expect(prev).toHaveClass("custom-prev")
    expect(next).toHaveClass("custom-next")
  })
})

describe("Carousel accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<BasicCarousel />)
    await checkA11y(container)
  })
})
