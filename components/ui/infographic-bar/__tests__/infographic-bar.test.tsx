import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
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

describe("selectable band (VI-868)", () => {
  const filters: InfographicBarStat[] = [
    { id: "all", label: "waiting", value: 7 },
    { id: "images", label: "images", value: 5 },
    { id: "pick", label: "pick one", value: 1 },
    { id: "run", label: "run", value: 1 },
  ]

  it("renders a radiogroup of radios, one pressed", () => {
    render(<InfographicBar stats={filters} defaultValue="images" aria-label="Filter" />)
    const group = screen.getByRole("radiogroup", { name: "Filter" })
    expect(group).toHaveAttribute("data-slot", "infographic-bar")
    const radios = screen.getAllByRole("radio")
    expect(radios).toHaveLength(4)
    expect(radios.map((r) => r.getAttribute("aria-checked"))).toEqual([
      "false",
      "true",
      "false",
      "false",
    ])
    expect(radios[0]).toHaveAccessibleName("7 waiting")
  })

  it("selects the first cell when uncontrolled with no default", () => {
    render(<InfographicBar stats={filters} onValueChange={() => {}} />)
    expect(screen.getAllByRole("radio")[0]).toHaveAttribute("aria-checked", "true")
  })

  it("calls onValueChange with the clicked cell id and moves the press", async () => {
    const onValueChange = vi.fn()
    render(<InfographicBar stats={filters} onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole("radio", { name: "1 pick one" }))
    expect(onValueChange).toHaveBeenCalledWith("pick")
    expect(screen.getByRole("radio", { name: "1 pick one" })).toHaveAttribute("aria-checked", "true")
  })

  it("keeps the pressed cell when it is clicked again", async () => {
    const onValueChange = vi.fn()
    render(<InfographicBar stats={filters} defaultValue="all" onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole("radio", { name: "7 waiting" }))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByRole("radio", { name: "7 waiting" })).toHaveAttribute("aria-checked", "true")
  })

  it("follows a controlled value", async () => {
    function Controlled() {
      const [value, setValue] = React.useState("run")
      return <InfographicBar stats={filters} value={value} onValueChange={setValue} />
    }
    render(<Controlled />)
    expect(screen.getByRole("radio", { name: "1 run" })).toHaveAttribute("aria-checked", "true")
    await userEvent.click(screen.getByRole("radio", { name: "5 images" }))
    expect(screen.getByRole("radio", { name: "5 images" })).toHaveAttribute("aria-checked", "true")
  })

  it("is one tab stop, and arrow keys move focus and selection together", async () => {
    const onValueChange = vi.fn()
    render(<InfographicBar stats={filters} defaultValue="all" onValueChange={onValueChange} />)
    await userEvent.tab()
    const radios = screen.getAllByRole("radio")
    expect(radios[0]).toHaveFocus()
    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1)
    await userEvent.keyboard("{ArrowRight}")
    expect(radios[1]).toHaveFocus()
    expect(radios[1]).toHaveAttribute("aria-checked", "true")
    expect(onValueChange).toHaveBeenLastCalledWith("images")
    await userEvent.keyboard("{ArrowLeft}")
    expect(radios[0]).toHaveAttribute("aria-checked", "true")
  })

  it("draws the value over a caption that keeps its own case", () => {
    const { container } = render(<InfographicBar stats={filters} onValueChange={() => {}} />)
    const radio = screen.getAllByRole("radio")[2]
    const parts = Array.from(radio.querySelectorAll("[data-slot^='infographic-bar-']")).map(
      (el) => [el.getAttribute("data-slot"), el.textContent]
    )
    expect(parts).toEqual([
      ["infographic-bar-value", "1"],
      ["infographic-bar-caption", "pick one"],
    ])
    expect(container.querySelector("[data-slot='stat-card']")).toBeNull()
  })

  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <InfographicBar stats={filters} defaultValue="all" aria-label="Filter" />
    )
    await checkA11y(container)
  })
})
