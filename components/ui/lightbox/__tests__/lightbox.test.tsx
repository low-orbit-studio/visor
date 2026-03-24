import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Lightbox, LightboxTrigger, LightboxContent } from "../lightbox"
import { checkA11y } from "../../../../test-utils/a11y"

const testImages = [
  { src: "/img1.jpg", alt: "Image 1" },
  { src: "/img2.jpg", alt: "Image 2" },
  { src: "/img3.jpg", alt: "Image 3" },
]

function renderLightbox(images = testImages, open = true) {
  return render(
    <Lightbox images={images} open={open}>
      <LightboxTrigger>Open</LightboxTrigger>
      <LightboxContent />
    </Lightbox>
  )
}

describe("Lightbox", () => {
  it("renders trigger with data-slot", () => {
    renderLightbox(testImages, false)
    const trigger = screen.getByText("Open")
    expect(trigger).toHaveAttribute("data-slot", "lightbox-trigger")
  })

  it("renders content with data-slot when opened", () => {
    renderLightbox()
    const content = document.querySelector('[data-slot="lightbox"]')
    expect(content).toBeInTheDocument()
  })

  it("shows image counter with correct format", () => {
    renderLightbox()
    const counter = document.querySelector('[data-slot="lightbox-counter"]')
    expect(counter).toBeInTheDocument()
    expect(counter).toHaveTextContent("1 / 3")
  })

  it("renders close button with accessible label", () => {
    renderLightbox()
    const closeButton = document.querySelector('[data-slot="lightbox-close"]')
    expect(closeButton).toBeInTheDocument()
    // Close button contains sr-only "Close" text
    expect(closeButton?.textContent).toContain("Close")
  })

  it("renders navigation buttons when multiple images", () => {
    renderLightbox()
    const prevButton = document.querySelector('[data-slot="lightbox-previous"]')
    const nextButton = document.querySelector('[data-slot="lightbox-next"]')
    expect(prevButton).toBeInTheDocument()
    expect(nextButton).toBeInTheDocument()
  })

  it("hides navigation buttons when single image", () => {
    renderLightbox([{ src: "/single.jpg", alt: "Single" }])
    const prevButton = document.querySelector('[data-slot="lightbox-previous"]')
    const nextButton = document.querySelector('[data-slot="lightbox-next"]')
    expect(prevButton).not.toBeInTheDocument()
    expect(nextButton).not.toBeInTheDocument()
  })

  it("hides counter when single image", () => {
    renderLightbox([{ src: "/single.jpg", alt: "Single" }])
    const counter = document.querySelector('[data-slot="lightbox-counter"]')
    expect(counter).not.toBeInTheDocument()
  })

  it("forwards custom className to content", () => {
    render(
      <Lightbox images={testImages} open>
        <LightboxContent className="custom-class" />
      </Lightbox>
    )
    const content = document.querySelector('[data-slot="lightbox"]')
    expect(content).toHaveClass("custom-class")
  })

  it("renders the current image", () => {
    renderLightbox()
    const img = screen.getByAltText("Image 1")
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", "/img1.jpg")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (trigger/closed state)", async () => {
    const { container } = renderLightbox(testImages, false)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (open state)", async () => {
    const { container } = renderLightbox()
    await checkA11y(container)
  })
})
