import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  ColorSwatch,
  ColorSwatchGrid,
  SemanticColorItem,
  SemanticColorGrid,
} from "../color-swatch"
import { checkA11y } from "../../../../test-utils/a11y"

describe("ColorSwatch", () => {
  it("renders with token, hex, and name", () => {
    render(<ColorSwatch token="--color-blue-500" hex="#3b82f6" name="500" />)
    expect(screen.getByText("#3b82f6")).toBeInTheDocument()
    expect(screen.getByText("500")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(
      <ColorSwatch token="--color-blue-500" hex="#3b82f6" name="500" />
    )
    expect(container.querySelector("[data-slot='color-swatch']")).toBeInTheDocument()
  })

  it("renders light text color when lightText is true", () => {
    const { container } = render(
      <ColorSwatch token="--color-gray-900" hex="#111827" name="900" lightText />
    )
    const hexSpan = container.querySelector("span")
    expect(hexSpan).toHaveStyle({ color: "#ffffff" })
  })

  it("renders dark text color when lightText is false", () => {
    const { container } = render(
      <ColorSwatch token="--color-gray-50" hex="#f9fafb" name="50" />
    )
    const hexSpan = container.querySelector("span")
    expect(hexSpan).toHaveStyle({ color: "#111827" })
  })
})

describe("ColorSwatchGrid", () => {
  const swatches = [
    { token: "--color-gray-50", hex: "#f9fafb", name: "50" },
    { token: "--color-gray-900", hex: "#111827", name: "900", lightText: true },
  ]

  it("renders label and all swatches", () => {
    render(<ColorSwatchGrid label="Gray" swatches={swatches} />)
    expect(screen.getByText("Gray")).toBeInTheDocument()
    expect(screen.getByText("#f9fafb")).toBeInTheDocument()
    expect(screen.getByText("#111827")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<ColorSwatchGrid label="Gray" swatches={swatches} />)
    expect(container.querySelector("[data-slot='color-swatch-grid']")).toBeInTheDocument()
  })
})

describe("SemanticColorItem", () => {
  it("renders token label", () => {
    render(<SemanticColorItem token="--text-primary" label="text-primary" />)
    expect(screen.getByText("text-primary")).toBeInTheDocument()
  })
})

describe("SemanticColorGrid", () => {
  it("renders category and items", () => {
    render(
      <SemanticColorGrid
        category="Text"
        items={[
          { token: "--text-primary", label: "text-primary" },
          { token: "--text-secondary", label: "text-secondary" },
        ]}
      />
    )
    expect(screen.getByText("Text")).toBeInTheDocument()
    expect(screen.getByText("text-primary")).toBeInTheDocument()
    expect(screen.getByText("text-secondary")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("ColorSwatch has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <ColorSwatch token="--color-blue-500" hex="#3b82f6" name="500" />
    )
    await checkA11y(container)
  })

  it("ColorSwatchGrid has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <ColorSwatchGrid
        label="Gray"
        swatches={[{ token: "--color-gray-50", hex: "#f9fafb", name: "50" }]}
      />
    )
    await checkA11y(container)
  })
})
