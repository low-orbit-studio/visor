import * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { IconGrid, IconSizeRow } from "../icon-grid"
import { checkA11y } from "../../../../test-utils/a11y"

describe("IconGrid", () => {
  const icons = [
    { name: "House", usage: "Home / dashboard", icon: React.createElement("span", null, "HouseIcon") },
    { name: "Gear", usage: "Settings", icon: React.createElement("span", null, "GearIcon") },
  ]

  it("renders all icons with name and usage", () => {
    render(<IconGrid icons={icons} />)
    expect(screen.getByText("House")).toBeInTheDocument()
    expect(screen.getByText("Home / dashboard")).toBeInTheDocument()
    expect(screen.getByText("Gear")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("renders icon elements", () => {
    render(<IconGrid icons={icons} />)
    expect(screen.getByText("HouseIcon")).toBeInTheDocument()
    expect(screen.getByText("GearIcon")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<IconGrid icons={icons} />)
    expect(container.querySelector("[data-slot='icon-grid']")).toBeInTheDocument()
  })
})

describe("IconSizeRow", () => {
  const sizes = [
    { size: 16, icon: React.createElement("span", null, "SmIcon") },
    { size: 24, icon: React.createElement("span", null, "MdIcon") },
  ]

  it("renders all sizes with labels", () => {
    render(<IconSizeRow sizes={sizes} />)
    expect(screen.getByText("SmIcon")).toBeInTheDocument()
    expect(screen.getByText("MdIcon")).toBeInTheDocument()
    expect(screen.getByText("16px")).toBeInTheDocument()
    expect(screen.getByText("24px")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<IconSizeRow sizes={sizes} />)
    expect(container.querySelector("[data-slot='icon-size-row']")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("IconGrid has no WCAG 2.1 AA violations", async () => {
    const icons = [
      { name: "House", usage: "Home", icon: React.createElement("span", null, "Icon") },
    ]
    const { container } = render(<IconGrid icons={icons} />)
    await checkA11y(container)
  })

  it("IconSizeRow has no WCAG 2.1 AA violations", async () => {
    const sizes = [
      { size: 24, icon: React.createElement("span", null, "Icon") },
    ]
    const { container } = render(<IconSizeRow sizes={sizes} />)
    await checkA11y(container)
  })
})
