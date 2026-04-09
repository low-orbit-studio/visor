import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { FontShowcase, FontShowcaseGrid } from "../font-showcase"
import { checkA11y } from "../../../../test-utils/a11y"

const MOCK_WEIGHTS = [
  { label: "Regular", value: 400 },
  { label: "Bold", value: 700 },
]

describe("FontShowcase", () => {
  it("renders font family name, role, and token", () => {
    render(
      <FontShowcase
        token="--font-heading"
        role="Heading & Body"
        familyName="Satoshi"
        weights={MOCK_WEIGHTS}
      />
    )
    expect(screen.getByText("Satoshi")).toBeInTheDocument()
    expect(screen.getByText("Heading & Body")).toBeInTheDocument()
    expect(screen.getByText("--font-heading")).toBeInTheDocument()
  })

  it("renders hero glyph", () => {
    render(
      <FontShowcase
        token="--font-heading"
        role="Heading"
        familyName="Satoshi"
        weights={MOCK_WEIGHTS}
      />
    )
    expect(screen.getByText("Aa")).toBeInTheDocument()
  })

  it("renders all weight specimens", () => {
    render(
      <FontShowcase
        token="--font-heading"
        role="Heading"
        familyName="Satoshi"
        weights={MOCK_WEIGHTS}
      />
    )
    expect(screen.getByText("Regular")).toBeInTheDocument()
    expect(screen.getByText("400")).toBeInTheDocument()
    expect(screen.getByText("Bold")).toBeInTheDocument()
    expect(screen.getByText("700")).toBeInTheDocument()
    expect(screen.getAllByText("The quick brown fox jumps")).toHaveLength(2)
  })

  it("applies data-slot attribute", () => {
    const { container } = render(
      <FontShowcase
        token="--font-mono"
        role="Monospace"
        familyName="JetBrains Mono"
        weights={[{ label: "Regular", value: 400 }]}
      />
    )
    expect(container.querySelector("[data-slot='font-showcase']")).toBeInTheDocument()
  })
})

describe("FontShowcaseGrid", () => {
  it("renders multiple font cards", () => {
    render(
      <FontShowcaseGrid
        fonts={[
          { token: "--font-heading", role: "Heading", familyName: "Satoshi", weights: MOCK_WEIGHTS },
          { token: "--font-mono", role: "Monospace", familyName: "Monaspace Neon", weights: [{ label: "Regular", value: 400 }] },
        ]}
      />
    )
    expect(screen.getByText("Satoshi")).toBeInTheDocument()
    expect(screen.getByText("Monaspace Neon")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(
      <FontShowcaseGrid
        fonts={[{ token: "--font-heading", role: "Heading", familyName: "Satoshi", weights: MOCK_WEIGHTS }]}
      />
    )
    expect(container.querySelector("[data-slot='font-showcase-grid']")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <FontShowcase
        token="--font-heading"
        role="Heading & Body"
        familyName="Satoshi"
        weights={MOCK_WEIGHTS}
      />
    )
    await checkA11y(container)
  })
})
