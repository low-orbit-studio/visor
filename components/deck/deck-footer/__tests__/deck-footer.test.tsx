import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DeckFooter } from "../deck-footer"
import { DeckProvider } from "../../deck-context/deck-context"
import { checkA11y } from "../../../../test-utils/a11y"

const columns = [
  {
    title: "Services",
    links: [
      { label: "Design", slide: "s-design" },
      { label: "Engineering", href: "https://example.com" },
    ],
  },
]

function renderWithDeck(ui: React.ReactElement, navigateTo = vi.fn()) {
  return render(
    <DeckProvider value={{ goTo: vi.fn(), navigateTo }}>
      {ui}
    </DeckProvider>
  )
}

describe("DeckFooter", () => {
  it("renders with data-slot attribute", () => {
    renderWithDeck(<DeckFooter description="Test desc" />)
    const footer = document.querySelector('[data-slot="deck-footer"]')
    expect(footer).toBeInTheDocument()
  })

  it("renders brand name and description", () => {
    renderWithDeck(<DeckFooter description="Building great things" />)
    expect(screen.getAllByText(/Low Orbit Studio/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Building great things")).toBeInTheDocument()
  })

  it("renders columns with titles and links", () => {
    renderWithDeck(<DeckFooter description="Desc" columns={columns} />)
    expect(screen.getByText("Services")).toBeInTheDocument()
    expect(screen.getByText("Design")).toBeInTheDocument()
    expect(screen.getByText("Engineering")).toBeInTheDocument()
  })

  it("navigates to slide on button click", () => {
    const navigateTo = vi.fn()
    renderWithDeck(<DeckFooter description="D" columns={columns} />, navigateTo)
    fireEvent.click(screen.getByText("Design"))
    expect(navigateTo).toHaveBeenCalledWith("s-design")
  })

  it("renders copyright text", () => {
    renderWithDeck(<DeckFooter description="D" />)
    const year = new Date().getFullYear()
    expect(screen.getByText(`\u00A9 ${year} Low Orbit Studio`)).toBeInTheDocument()
  })

  it("accepts custom brand name", () => {
    renderWithDeck(<DeckFooter description="D" brandName="Acme Inc" />)
    expect(screen.getAllByText(/Acme Inc/).length).toBeGreaterThanOrEqual(1)
  })

  it("renders brand section without columns", () => {
    renderWithDeck(<DeckFooter description="Brand only" />)
    expect(screen.getByText("Brand only")).toBeInTheDocument()
    // No grid when columns are not provided
    const grid = document.querySelector('[class*="grid"]')
    expect(grid).not.toBeInTheDocument()
  })

  it("renders href links as anchor elements", () => {
    renderWithDeck(<DeckFooter description="D" columns={columns} />)
    const link = screen.getByText("Engineering").closest("a")
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "https://example.com")
  })

  it("applies accent class to slide links", () => {
    const accentColumns = [{
      title: "Links",
      links: [{ label: "Highlight", slide: "s-highlight", accent: true }],
    }]
    renderWithDeck(<DeckFooter description="D" columns={accentColumns} />)
    const btn = screen.getByText("Highlight")
    expect(btn).toHaveClass("linkAccent")
  })

  it("applies accent class to href links", () => {
    const accentColumns = [{
      title: "Links",
      links: [{ label: "External", href: "https://example.com", accent: true }],
    }]
    renderWithDeck(<DeckFooter description="D" columns={accentColumns} />)
    const link = screen.getByText("External")
    expect(link).toHaveClass("linkAccent")
  })

  it("falls back to # when href is missing on non-slide links", () => {
    const fallbackColumns = [{
      title: "Links",
      links: [{ label: "Empty" }],
    }]
    renderWithDeck(<DeckFooter description="D" columns={fallbackColumns} />)
    const link = screen.getByText("Empty").closest("a")
    expect(link).toHaveAttribute("href", "#")
  })

  it("renders colophon/bottom section", () => {
    renderWithDeck(<DeckFooter description="D" />)
    expect(screen.getByText(/Built by/)).toBeInTheDocument()
  })
})

describe("DeckFooter accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = renderWithDeck(<DeckFooter description="Desc" />)
    await checkA11y(container)
  })
})
