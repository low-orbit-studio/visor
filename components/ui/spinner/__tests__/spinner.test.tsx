import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Spinner } from "../spinner"

describe("Spinner", () => {
  it("renders without a label (decorative — aria-hidden)", () => {
    const { container } = render(<Spinner />)
    const root = container.querySelector('[data-slot="spinner"]')
    expect(root).not.toBeNull()
    expect(root).toHaveAttribute("aria-hidden", "true")
    expect(root).not.toHaveAttribute("role")
  })

  it("renders role=status and visually-hidden text when label is provided", () => {
    render(<Spinner label="Loading results" />)
    const status = screen.getByRole("status")
    expect(status).not.toBeNull()
    expect(status).toHaveAttribute("aria-label", "Loading results")
    expect(screen.getByText("Loading results")).toBeInTheDocument()
  })

  it("applies data-slot to the root", () => {
    const { container } = render(<Spinner />)
    const root = container.querySelector('[data-slot="spinner"]')
    expect(root).not.toBeNull()
  })

  it("forwards ref to the root span", () => {
    const ref = { current: null as HTMLSpanElement | null }
    render(<Spinner ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("SPAN")
  })

  it("forwards className to the root", () => {
    const { container } = render(<Spinner className="custom-class" />)
    const root = container.querySelector('[data-slot="spinner"]')
    expect(root).toHaveClass("custom-class")
  })

  describe("sizes", () => {
    it.each(["xs", "sm", "md"] as const)("renders %s size", (size) => {
      const { container } = render(<Spinner size={size} />)
      expect(
        container.querySelector(`[data-size="${size}"]`)
      ).not.toBeNull()
    })

    it("defaults to md size", () => {
      const { container } = render(<Spinner />)
      expect(container.querySelector('[data-size="md"]')).not.toBeNull()
    })
  })

  describe("tones", () => {
    it.each(["default", "primary"] as const)("renders %s tone", (tone) => {
      const { container } = render(<Spinner tone={tone} />)
      expect(
        container.querySelector(`[data-tone="${tone}"]`)
      ).not.toBeNull()
    })

    it("defaults to default tone", () => {
      const { container } = render(<Spinner />)
      expect(container.querySelector('[data-tone="default"]')).not.toBeNull()
    })
  })

  it("does not render visually-hidden text without label", () => {
    const { container } = render(<Spinner />)
    // No .srOnly span should be present when no label is provided
    const root = container.querySelector('[data-slot="spinner"]')
    expect(root?.children.length).toBe(0)
  })
})
