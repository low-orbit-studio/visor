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

describe("family and the success and amber inks (VI-715)", () => {
  it("unset renders the 1.29.0 classes exactly", () => {
    render(<Text>Plain</Text>)
    expect(screen.getByText("Plain").className).toBe("base sizeMd weightNormal colorPrimary leadingNormal")
  })

  it("family='body' adds no class", () => {
    render(<Text family="body">Body</Text>)
    expect(screen.getByText("Body").className).toBe("base sizeMd weightNormal colorPrimary leadingNormal")
  })

  it("family='mono' composes with size and weight", () => {
    render(<Text family="mono" size="sm" weight="bold">$400</Text>)
    expect(screen.getByText("$400")).toHaveClass("familyMono", "sizeSm", "weightBold")
  })

  it.each([
    ["success", "colorSuccess"],
    ["amber", "colorAmber"],
  ] as const)("color='%s' applies %s", (color, cls) => {
    render(<Text color={color}>Ink</Text>)
    expect(screen.getByText("Ink")).toHaveClass(cls)
    expect(screen.getByText("Ink")).not.toHaveClass("colorPrimary")
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
