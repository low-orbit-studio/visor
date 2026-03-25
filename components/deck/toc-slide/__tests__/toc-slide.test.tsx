import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { TOCSlide } from "../toc-slide"
import { DeckProvider } from "../../deck-context/deck-context"
import { checkA11y } from "../../../../test-utils/a11y"

const sections = [
  {
    section: "Overview",
    items: [
      { id: "s-intro", title: "Introduction" },
      { id: "s-goals", title: "Goals" },
    ],
  },
  {
    section: "Details",
    items: [{ id: "s-detail", title: "Detail Page" }],
  },
]

function renderWithDeck(ui: React.ReactElement, navigateTo = vi.fn()) {
  return render(
    <DeckProvider value={{ goTo: vi.fn(), navigateTo }}>
      {ui}
    </DeckProvider>
  )
}

describe("TOCSlide", () => {
  it("renders section titles", () => {
    renderWithDeck(<TOCSlide sections={sections} />)
    expect(screen.getByText("Overview")).toBeInTheDocument()
    expect(screen.getByText("Details")).toBeInTheDocument()
  })

  it("renders item links", () => {
    renderWithDeck(<TOCSlide sections={sections} />)
    expect(screen.getByText("Introduction")).toBeInTheDocument()
    expect(screen.getByText("Goals")).toBeInTheDocument()
  })

  it("navigates to slide on item click", () => {
    const navigateTo = vi.fn()
    renderWithDeck(<TOCSlide sections={sections} />, navigateTo)
    fireEvent.click(screen.getByText("Introduction"))
    expect(navigateTo).toHaveBeenCalledWith("s-intro")
  })

  it("uses s-toc as default id", () => {
    renderWithDeck(<TOCSlide sections={sections} />)
    expect(document.getElementById("s-toc")).toBeInTheDocument()
  })

  it("applies stagger delay animations on sections", () => {
    renderWithDeck(<TOCSlide sections={sections} />)
    const animated = document.querySelectorAll("[data-deck-animate]")
    // subtitle + title + 2 section groups = at least 4
    expect(animated.length).toBeGreaterThanOrEqual(4)
  })
})

describe("TOCSlide accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = renderWithDeck(<TOCSlide sections={sections} />)
    await checkA11y(container)
  })
})
