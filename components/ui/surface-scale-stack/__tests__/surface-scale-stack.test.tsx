import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { SurfaceScaleStack } from "../surface-scale-stack"
import { checkA11y } from "../../../../test-utils/a11y"

const surfaces = [
  { token: "--surface-page", name: "Page" },
  { token: "--surface-card", name: "Card" },
  { token: "--surface-overlay", name: "Overlay", lightText: true },
]

const surfacesWithNotes = [
  { token: "--surface-page", name: "Page", note: "Root canvas" },
  { token: "--surface-card", name: "Card", note: "Primary content card" },
  { token: "--surface-overlay", name: "Overlay", note: "Modal / sheet", lightText: true },
]

describe("SurfaceScaleStack", () => {
  it("renders all rows in order", () => {
    render(<SurfaceScaleStack surfaces={surfaces} />)
    const rows = screen.getAllByTestId
    expect(screen.getByText("Page")).toBeInTheDocument()
    expect(screen.getByText("Card")).toBeInTheDocument()
    expect(screen.getByText("Overlay")).toBeInTheDocument()
  })

  it("renders rows in the correct DOM order", () => {
    const { container } = render(<SurfaceScaleStack surfaces={surfaces} />)
    const labels = container.querySelectorAll("[data-slot='surface-row']")
    const names = Array.from(labels).map((el) => el.textContent)
    expect(names[0]).toContain("Page")
    expect(names[1]).toContain("Card")
    expect(names[2]).toContain("Overlay")
  })

  it("composes SurfaceRow per surface item", () => {
    const { container } = render(<SurfaceScaleStack surfaces={surfaces} />)
    const rows = container.querySelectorAll("[data-slot='surface-row']")
    expect(rows).toHaveLength(surfaces.length)
  })

  it("passes token to each SurfaceRow", () => {
    const { container } = render(<SurfaceScaleStack surfaces={surfaces} />)
    expect(container.querySelector("[data-slot='surface-row']")).toBeInTheDocument()
    // Each token text appears inside its row
    expect(screen.getByText("--surface-page")).toBeInTheDocument()
    expect(screen.getByText("--surface-card")).toBeInTheDocument()
    expect(screen.getByText("--surface-overlay")).toBeInTheDocument()
  })

  it("applies data-slot attribute to the stack", () => {
    const { container } = render(<SurfaceScaleStack surfaces={surfaces} />)
    expect(container.querySelector("[data-slot='surface-scale-stack']")).toBeInTheDocument()
  })

  describe("note column", () => {
    it("does not render note column when no surface has a note", () => {
      const { container } = render(<SurfaceScaleStack surfaces={surfaces} />)
      // The withNotes class controls note column rendering
      expect(container.querySelector("[class*='noteCell']")).not.toBeInTheDocument()
    })

    it("renders note column when at least one surface has a note", () => {
      const { container } = render(<SurfaceScaleStack surfaces={surfacesWithNotes} />)
      expect(container.querySelector("[class*='noteCell']")).toBeInTheDocument()
    })

    it("renders note text for surfaces that have a note", () => {
      render(<SurfaceScaleStack surfaces={surfacesWithNotes} />)
      expect(screen.getByText("Root canvas")).toBeInTheDocument()
      expect(screen.getByText("Primary content card")).toBeInTheDocument()
      expect(screen.getByText("Modal / sheet")).toBeInTheDocument()
    })

    it("renders note column for all rows when mixed (some with, some without)", () => {
      const mixed = [
        { token: "--surface-page", name: "Page", note: "Has a note" },
        { token: "--surface-card", name: "Card" }, // no note
      ]
      const { container } = render(<SurfaceScaleStack surfaces={mixed} />)
      // Both rows get a noteCell because the stack has notes
      const noteCells = container.querySelectorAll("[class*='noteCell']")
      expect(noteCells).toHaveLength(2)
    })

    it("only renders note text in rows that have a note value", () => {
      const mixed = [
        { token: "--surface-page", name: "Page", note: "Has a note" },
        { token: "--surface-card", name: "Card" }, // no note
      ]
      render(<SurfaceScaleStack surfaces={mixed} />)
      expect(screen.getByText("Has a note")).toBeInTheDocument()
      // "Card" row has no note so no note span
      expect(screen.queryByText("Card note")).not.toBeInTheDocument()
    })
  })

  it("matches snapshot", () => {
    const { container } = render(
      <SurfaceScaleStack surfaces={surfacesWithNotes} />
    )
    // Normalize Radix id-bearing attributes for stable snapshots
    for (const attr of [
      "id",
      "aria-controls",
      "aria-labelledby",
      "aria-describedby",
      "aria-activedescendant",
    ]) {
      container.querySelectorAll(`[${attr}]`).forEach((el) => el.setAttribute(attr, "[id]"))
    }
    expect(container.firstChild).toMatchSnapshot()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <SurfaceScaleStack surfaces={surfacesWithNotes} />
    )
    await checkA11y(container)
  })
})
