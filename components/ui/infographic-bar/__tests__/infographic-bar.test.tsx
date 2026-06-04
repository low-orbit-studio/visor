import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { InfographicBar, type InfographicBarStat } from "../infographic-bar"
import { checkA11y } from "../../../../test-utils/a11y"

const stats: InfographicBarStat[] = [
  {
    label: "Total Revenue",
    value: "$48,120",
    delta: { value: "+12.4%", direction: "up", label: "vs last month" },
  },
  {
    label: "Active Users",
    value: "892",
    delta: { value: "+3.1%", direction: "up" },
  },
  {
    label: "Churn Rate",
    value: "3.2%",
    delta: { value: "-0.4%", direction: "down" },
  },
  { label: "Signups", value: "412", variant: "highlight" },
]

describe("InfographicBar", () => {
  it("renders a stat-card cell per stat", () => {
    const { container } = render(<InfographicBar stats={stats} />)
    const cells = container.querySelectorAll("[data-slot='stat-card']")
    expect(cells).toHaveLength(stats.length)
  })

  it("renders every label and value", () => {
    render(<InfographicBar stats={stats} />)
    expect(screen.getByText("Total Revenue")).toBeInTheDocument()
    expect(screen.getByText("$48,120")).toBeInTheDocument()
    expect(screen.getByText("Churn Rate")).toBeInTheDocument()
    expect(screen.getByText("412")).toBeInTheDocument()
  })

  it("renders cells in source order", () => {
    const { container } = render(<InfographicBar stats={stats} />)
    const labels = container.querySelectorAll("[data-slot='stat-card-label']")
    const names = Array.from(labels).map((el) => el.textContent)
    expect(names).toEqual([
      "Total Revenue",
      "Active Users",
      "Churn Rate",
      "Signups",
    ])
  })

  it("applies data-slot to the band root", () => {
    const { container } = render(<InfographicBar stats={stats} />)
    expect(
      container.querySelector("[data-slot='infographic-bar']")
    ).toBeInTheDocument()
  })

  it("renders cells as direct children of the band (continuous, no wrappers)", () => {
    const { container } = render(<InfographicBar stats={stats} />)
    const band = container.querySelector("[data-slot='infographic-bar']")!
    const directCells = band.querySelectorAll(
      ":scope > [data-slot='stat-card']"
    )
    expect(directCells).toHaveLength(stats.length)
  })

  it("forwards size to every cell, defaulting to md", () => {
    const { container, rerender } = render(<InfographicBar stats={stats} />)
    container
      .querySelectorAll("[data-slot='stat-card']")
      .forEach((cell) => expect(cell).toHaveAttribute("data-size", "md"))

    rerender(<InfographicBar stats={stats} size="sm" />)
    container
      .querySelectorAll("[data-slot='stat-card']")
      .forEach((cell) => expect(cell).toHaveAttribute("data-size", "sm"))
  })

  it("honors per-cell variant (highlight)", () => {
    const { container } = render(<InfographicBar stats={stats} />)
    const cells = container.querySelectorAll("[data-slot='stat-card']")
    expect(cells[0]).toHaveAttribute("data-variant", "default")
    expect(cells[3]).toHaveAttribute("data-variant", "highlight")
  })

  it("renders per-cell deltas", () => {
    render(<InfographicBar stats={stats} />)
    expect(screen.getByText("+12.4%")).toBeInTheDocument()
    expect(screen.getByText("-0.4%")).toBeInTheDocument()
  })

  it("forwards arbitrary HTML attributes and className to the band", () => {
    const { container } = render(
      <InfographicBar stats={stats} aria-label="Key metrics" className="custom" />
    )
    const band = container.querySelector("[data-slot='infographic-bar']")!
    expect(band).toHaveAttribute("aria-label", "Key metrics")
    expect(band.className).toContain("custom")
  })

  it("renders an empty band without crashing", () => {
    const { container } = render(<InfographicBar stats={[]} />)
    expect(
      container.querySelector("[data-slot='infographic-bar']")
    ).toBeInTheDocument()
    expect(container.querySelectorAll("[data-slot='stat-card']")).toHaveLength(0)
  })

  it("matches snapshot", () => {
    const { container } = render(<InfographicBar stats={stats} />)
    for (const attr of [
      "id",
      "aria-controls",
      "aria-labelledby",
      "aria-describedby",
      "aria-activedescendant",
    ]) {
      container
        .querySelectorAll(`[${attr}]`)
        .forEach((el) => el.setAttribute(attr, "[id]"))
    }
    expect(container.firstChild).toMatchSnapshot()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<InfographicBar stats={stats} />)
    await checkA11y(container)
  })
})
