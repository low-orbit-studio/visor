import * as fs from "node:fs"
import * as path from "node:path"
import { fireEvent, render, screen } from "@testing-library/react"
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

describe("motion", () => {
  const currentImage = () =>
    document.querySelector<HTMLImageElement>('[data-slot="lightbox"] img')!

  it("shows the photo on open with no direction, so it scales up", () => {
    renderLightbox()
    expect(currentImage()).not.toHaveAttribute("data-direction")
  })

  it("marks the photo loaded once it loads, so it eases in", () => {
    renderLightbox()
    expect(currentImage()).not.toHaveAttribute("data-loaded")
    fireEvent.load(currentImage())
    expect(currentImage()).toHaveAttribute("data-loaded")
  })

  it("next photo comes from the next side", () => {
    renderLightbox()
    fireEvent.click(document.querySelector('[data-slot="lightbox-next"]')!)
    expect(currentImage()).toHaveAttribute("alt", "Image 2")
    expect(currentImage()).toHaveAttribute("data-direction", "next")
  })

  it("previous photo comes from the previous side, including on wrap-around", () => {
    renderLightbox()
    fireEvent.click(document.querySelector('[data-slot="lightbox-previous"]')!)
    expect(currentImage()).toHaveAttribute("alt", "Image 3")
    expect(currentImage()).toHaveAttribute("data-direction", "previous")
  })

  it("arrow keys set the direction too", () => {
    renderLightbox()
    const content = document.querySelector('[data-slot="lightbox"]')!
    fireEvent.keyDown(content, { key: "ArrowRight" })
    expect(currentImage()).toHaveAttribute("data-direction", "next")
    fireEvent.keyDown(content, { key: "ArrowLeft" })
    expect(currentImage()).toHaveAttribute("data-direction", "previous")
  })

  it("reopening scales up again instead of sliding", () => {
    render(
      <Lightbox images={testImages}>
        <LightboxTrigger>Open</LightboxTrigger>
        <LightboxContent />
      </Lightbox>
    )
    fireEvent.click(screen.getByText("Open"))
    fireEvent.click(document.querySelector('[data-slot="lightbox-next"]')!)
    expect(currentImage()).toHaveAttribute("data-direction", "next")
    fireEvent.click(document.querySelector('[data-slot="lightbox-close"]')!)
    fireEvent.click(screen.getByText("Open"))
    expect(currentImage()).not.toHaveAttribute("data-direction")
  })

  describe("CSS", () => {
    const css = fs.readFileSync(
      path.resolve(__dirname, "../lightbox.module.css"),
      "utf-8"
    )

    it("next slides in from the right, previous from the left", () => {
      expect(css).toMatch(
        /@keyframes lightboxImageFromNext \{\s*from \{[^}]*translateX\(var\(--lightbox-slide-distance, 40px\)\)/
      )
      expect(css).toMatch(
        /@keyframes lightboxImageFromPrevious \{\s*from \{[^}]*translateX\(calc\(-1 \* var\(--lightbox-slide-distance, 40px\)\)\)/
      )
    })

    it("reduced motion fades only", () => {
      const block = css.match(
        /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/
      )?.[1]
      expect(block).toBeDefined()
      for (const selector of [".image[data-loaded][data-direction]", ".counter", ".close", ".navPrevious", ".navNext"]) {
        expect(block).toContain(selector)
      }
      expect(block).toContain("animation-name: fadeIn;")
      expect(block).not.toMatch(/transform|translate|scale/)
    })

    it("exposes the distance and durations as CSS variables", () => {
      for (const variable of ["--lightbox-slide-distance", "--lightbox-image-duration", "--lightbox-controls-duration"]) {
        expect(css).toContain(`var(${variable},`)
      }
    })
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
