import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { ConfigurationPanel } from "../configuration-panel"
import { checkA11y } from "../../../test-utils/a11y"

const sampleSections = [
  { label: "Geometry", children: <div>Geometry controls</div> },
  { label: "Appearance", children: <div>Appearance controls</div> },
  { label: "Color", children: <div>Color controls</div> },
]

describe("ConfigurationPanel", () => {
  it("renders without crashing", () => {
    render(<ConfigurationPanel sections={sampleSections} />)
    expect(screen.getByRole("region")).toBeInTheDocument()
  })

  it("renders title and subtitle", () => {
    render(
      <ConfigurationPanel
        sections={sampleSections}
        title="Controls"
        subtitle="Adjust parameters"
      />
    )
    expect(screen.getByText("Controls")).toBeInTheDocument()
    expect(screen.getByText("Adjust parameters")).toBeInTheDocument()
  })

  it("renders section labels", () => {
    render(<ConfigurationPanel sections={sampleSections} />)
    expect(screen.getByText("Geometry")).toBeInTheDocument()
    expect(screen.getByText("Appearance")).toBeInTheDocument()
    expect(screen.getByText("Color")).toBeInTheDocument()
  })

  it("renders section children", () => {
    render(<ConfigurationPanel sections={sampleSections} />)
    expect(screen.getByText("Geometry controls")).toBeInTheDocument()
    expect(screen.getByText("Appearance controls")).toBeInTheDocument()
    expect(screen.getByText("Color controls")).toBeInTheDocument()
  })

  it("renders separators between sections", () => {
    const { container } = render(
      <ConfigurationPanel sections={sampleSections} />
    )
    const separators = container.querySelectorAll("[data-slot='separator']")
    expect(separators).toHaveLength(sampleSections.length - 1)
  })

  it("accepts className prop", () => {
    const { container } = render(
      <ConfigurationPanel sections={sampleSections} className="custom" />
    )
    expect(container.firstChild).toHaveClass("custom")
  })

  it("collapse button toggles data-collapsed attribute", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <ConfigurationPanel sections={sampleSections} title="Test" />
    )

    const contentWrapper = container.querySelector(
      "[class*='contentWrapper']"
    ) as HTMLElement
    expect(contentWrapper).not.toHaveAttribute("data-collapsed")

    const collapseButton = screen.getByRole("button", {
      name: "Collapse panel",
    })
    await user.click(collapseButton)

    expect(contentWrapper).toHaveAttribute("data-collapsed", "true")
  })

  it("defaultCollapsed starts collapsed", () => {
    const { container } = render(
      <ConfigurationPanel
        sections={sampleSections}
        title="Test"
        defaultCollapsed
      />
    )

    const contentWrapper = container.querySelector(
      "[class*='contentWrapper']"
    ) as HTMLElement
    expect(contentWrapper).toHaveAttribute("data-collapsed", "true")
  })

  it("collapsible={false} hides collapse button", () => {
    render(
      <ConfigurationPanel
        sections={sampleSections}
        title="Test"
        collapsible={false}
      />
    )
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("default position is bottom-left", () => {
    const { container } = render(
      <ConfigurationPanel sections={sampleSections} />
    )
    expect(container.firstChild).toHaveAttribute(
      "data-position",
      "bottom-left"
    )
  })

  it("position prop sets data-position attribute", () => {
    const { container } = render(
      <ConfigurationPanel sections={sampleSections} position="top-right" />
    )
    expect(container.firstChild).toHaveAttribute("data-position", "top-right")
  })

  it("uses title as aria-label for the region", () => {
    render(
      <ConfigurationPanel sections={sampleSections} title="My Panel" />
    )
    expect(
      screen.getByRole("region", { name: "My Panel" })
    ).toBeInTheDocument()
  })

  it("passes accessibility checks", async () => {
    const { container } = render(
      <ConfigurationPanel
        sections={sampleSections}
        title="Controls"
        subtitle="Adjust parameters"
      />
    )
    await checkA11y(container)
  })
})
