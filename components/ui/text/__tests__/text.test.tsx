import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Text } from "../text"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Text", () => {
  it("renders as p by default", () => {
    render(<Text>Hello world</Text>)
    const el = screen.getByText("Hello world")
    expect(el).toBeInTheDocument()
    expect(el.tagName).toBe("P")
  })

  it("renders as span when as='span'", () => {
    render(<Text as="span">Inline text</Text>)
    const el = screen.getByText("Inline text")
    expect(el.tagName).toBe("SPAN")
  })

  it("renders as div when as='div'", () => {
    render(<Text as="div">Block text</Text>)
    const el = screen.getByText("Block text")
    expect(el.tagName).toBe("DIV")
  })

  it("renders as label when as='label'", () => {
    render(<Text as="label">Label text</Text>)
    const el = screen.getByText("Label text")
    expect(el.tagName).toBe("LABEL")
  })

  it("applies custom className", () => {
    render(<Text className="custom">Text</Text>)
    expect(screen.getByText("Text")).toHaveClass("custom")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLElement | null }
    render(<Text ref={ref}>Text</Text>)
    expect(ref.current).toBeInstanceOf(HTMLElement)
  })

  it("sets data-slot attribute", () => {
    render(<Text>Text</Text>)
    expect(screen.getByText("Text")).toHaveAttribute("data-slot", "text")
  })

  it("renders children correctly", () => {
    render(
      <Text>
        Some <strong>bold</strong> text
      </Text>
    )
    expect(screen.getByText("bold")).toBeInTheDocument()
  })

  it("passes through HTML attributes", () => {
    render(<Text id="intro">Text</Text>)
    expect(screen.getByText("Text")).toHaveAttribute("id", "intro")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (default)", async () => {
    const { container } = render(<Text>Accessible text content</Text>)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (secondary color)", async () => {
    const { container } = render(<Text color="secondary">Muted text</Text>)
    await checkA11y(container)
  })
})
