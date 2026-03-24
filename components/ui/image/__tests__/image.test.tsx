import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Image } from "../image"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Image", () => {
  it("renders an img element with src and alt", () => {
    render(<Image src="/test.jpg" alt="Test image" />)
    const img = screen.getByRole("img", { name: "Test image" })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", "/test.jpg")
  })

  it("sets data-slot on root", () => {
    const { container } = render(<Image src="/test.jpg" alt="Test" />)
    expect(container.querySelector("[data-slot='image']")).toBeTruthy()
  })

  it("shows skeleton while loading", () => {
    const { container } = render(<Image src="/test.jpg" alt="Test" />)
    expect(container.querySelector("[data-slot='image-skeleton']")).toBeTruthy()
  })

  it("hides skeleton after image loads", () => {
    const { container } = render(<Image src="/test.jpg" alt="Test" />)
    const img = screen.getByRole("img")
    fireEvent.load(img)
    expect(container.querySelector("[data-slot='image-skeleton']")).toBeNull()
  })

  it("shows fallback on error", () => {
    const { container } = render(<Image src="/bad.jpg" alt="Test" />)
    const img = screen.getByRole("img")
    fireEvent.error(img)
    expect(container.querySelector("[data-slot='image-fallback']")).toBeTruthy()
  })

  it("shows custom fallback on error", () => {
    render(
      <Image src="/bad.jpg" alt="Test" fallback={<span>Custom fallback</span>} />
    )
    const img = screen.getByRole("img")
    fireEvent.error(img)
    expect(screen.getByText("Custom fallback")).toBeInTheDocument()
  })

  it("applies aspect ratio class", () => {
    const { container } = render(
      <Image src="/test.jpg" alt="Test" aspectRatio="video" />
    )
    const root = container.querySelector("[data-slot='image']")
    expect(root?.className).toContain("video")
  })

  it("applies object-fit via data attribute", () => {
    render(<Image src="/test.jpg" alt="Test" objectFit="contain" />)
    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("data-fit", "contain")
  })

  it("defaults to lazy loading", () => {
    render(<Image src="/test.jpg" alt="Test" />)
    expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy")
  })

  it("forwards ref to img element", () => {
    const ref = { current: null } as React.RefObject<HTMLImageElement | null>
    render(<Image ref={ref} src="/test.jpg" alt="Test" />)
    expect(ref.current).toBeInstanceOf(HTMLImageElement)
  })
})

describe("Image accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Image src="/test.jpg" alt="A descriptive alt" />
    )
    await checkA11y(container)
  })
})
