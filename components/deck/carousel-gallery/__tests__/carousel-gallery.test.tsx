import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { CarouselGallery } from "../carousel-gallery"
import { checkA11y } from "../../../../test-utils/a11y"

const slides = [
  { src: "/img1.jpg", alt: "Image 1", caption: "First" },
  { src: "/img2.jpg", alt: "Image 2" },
  { src: "/img3.jpg", alt: "Image 3", caption: "Third" },
]

describe("CarouselGallery", () => {
  it("renders with data-slot attribute", () => {
    render(<CarouselGallery slides={slides} />)
    const gallery = document.querySelector('[data-slot="carousel-gallery"]')
    expect(gallery).toBeInTheDocument()
  })

  it("renders all slide images", () => {
    render(<CarouselGallery slides={slides} />)
    expect(screen.getByAltText("Image 1")).toBeInTheDocument()
    expect(screen.getByAltText("Image 2")).toBeInTheDocument()
    expect(screen.getByAltText("Image 3")).toBeInTheDocument()
  })

  it("renders captions when provided", () => {
    render(<CarouselGallery slides={slides} />)
    expect(screen.getByText("First")).toBeInTheDocument()
    expect(screen.getByText("Third")).toBeInTheDocument()
  })

  it("has accessible labels for image buttons", () => {
    render(<CarouselGallery slides={slides} />)
    expect(screen.getByLabelText("View image: Image 1")).toBeInTheDocument()
  })

  it("sets grid columns based on slide count", () => {
    render(<CarouselGallery slides={slides} />)
    const gallery = document.querySelector('[data-slot="carousel-gallery"]') as HTMLElement
    expect(gallery.style.gridTemplateColumns).toBe("repeat(3, 1fr)")
  })
})

describe("CarouselGallery accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<CarouselGallery slides={slides} />)
    await checkA11y(container)
  })
})
