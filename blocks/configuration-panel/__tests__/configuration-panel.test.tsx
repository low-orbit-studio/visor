import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, beforeAll } from "vitest"
import { ConfigurationPanel } from "../configuration-panel"
import { checkA11y } from "../../../test-utils/a11y"

// jsdom doesn't implement setPointerCapture
beforeAll(() => {
  HTMLElement.prototype.setPointerCapture = () => {}
  HTMLElement.prototype.releasePointerCapture = () => {}
})

const sampleSections = [
  { label: "Geometry", children: <div>Geometry controls</div> },
  { label: "Appearance", children: <div>Appearance controls</div> },
  { label: "Color", children: <div>Color controls</div> },
]

describe("ConfigurationPanel", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

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

  // ─── Collapse / Expand ──────────────────────────────────────────────

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

  it("expand from collapsed state", async () => {
    const user = userEvent.setup()
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

    const expandButton = screen.getByRole("button", { name: "Expand panel" })
    await user.click(expandButton)

    expect(contentWrapper).not.toHaveAttribute("data-collapsed")
  })

  it("multiple collapse/expand cycles work", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <ConfigurationPanel sections={sampleSections} title="Test" />
    )

    const contentWrapper = container.querySelector(
      "[class*='contentWrapper']"
    ) as HTMLElement
    const button = screen.getByRole("button", { name: "Collapse panel" })

    // Collapse
    await user.click(button)
    expect(contentWrapper).toHaveAttribute("data-collapsed", "true")

    // Expand
    await user.click(screen.getByRole("button", { name: "Expand panel" }))
    expect(contentWrapper).not.toHaveAttribute("data-collapsed")

    // Collapse again
    await user.click(screen.getByRole("button", { name: "Collapse panel" }))
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

  it("no title/subtitle with collapsible=false renders no header", () => {
    const { container } = render(
      <ConfigurationPanel sections={sampleSections} collapsible={false} />
    )
    expect(container.querySelector("[class*='header']")).not.toBeInTheDocument()
  })

  // ─── Position ───────────────────────────────────────────────────────

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

  it.each(["bottom-left", "bottom-right", "top-left", "top-right"] as const)(
    "supports position=%s",
    (pos) => {
      const { container } = render(
        <ConfigurationPanel sections={sampleSections} position={pos} />
      )
      expect(container.firstChild).toHaveAttribute("data-position", pos)
    },
  )

  // ─── Accessibility ──────────────────────────────────────────────────

  it("uses title as aria-label for the region", () => {
    render(
      <ConfigurationPanel sections={sampleSections} title="My Panel" />
    )
    expect(
      screen.getByRole("region", { name: "My Panel" })
    ).toBeInTheDocument()
  })

  it("uses fallback aria-label when no title", () => {
    render(<ConfigurationPanel sections={sampleSections} />)
    expect(
      screen.getByRole("region", { name: "Configuration panel" })
    ).toBeInTheDocument()
  })

  // ─── Draggable ──────────────────────────────────────────────────────

  it("draggable prop sets data-draggable attribute", () => {
    const { container } = render(
      <ConfigurationPanel sections={sampleSections} title="Test" draggable />
    )
    expect(container.firstChild).toHaveAttribute("data-draggable", "true")
  })

  it("draggable is not set by default", () => {
    const { container } = render(
      <ConfigurationPanel sections={sampleSections} />
    )
    expect(container.firstChild).not.toHaveAttribute("data-draggable")
  })

  it("pointer down on header sets dragging state", () => {
    const { container } = render(
      <ConfigurationPanel
        sections={sampleSections}
        title="Test"
        draggable
      />
    )

    const header = container.querySelector("[class*='header']") as HTMLElement
    fireEvent.pointerDown(header, { clientX: 100, clientY: 100 })

    expect(container.firstChild).toHaveAttribute("data-dragging", "true")
  })

  it("pointer up ends dragging state", () => {
    const { container } = render(
      <ConfigurationPanel
        sections={sampleSections}
        title="Test"
        draggable
      />
    )

    const header = container.querySelector("[class*='header']") as HTMLElement
    fireEvent.pointerDown(header, { clientX: 100, clientY: 100 })
    expect(container.firstChild).toHaveAttribute("data-dragging", "true")

    fireEvent.pointerUp(header)
    expect(container.firstChild).not.toHaveAttribute("data-dragging")
  })

  it("pointer down on collapse button does NOT start drag", () => {
    const { container } = render(
      <ConfigurationPanel
        sections={sampleSections}
        title="Test"
        draggable
      />
    )

    const collapseButton = screen.getByRole("button", {
      name: "Collapse panel",
    })
    fireEvent.pointerDown(collapseButton, { clientX: 100, clientY: 100 })

    expect(container.firstChild).not.toHaveAttribute("data-dragging")
  })

  it("draggable panel always has transform style", () => {
    const { container } = render(
      <ConfigurationPanel
        sections={sampleSections}
        title="Test"
        draggable
      />
    )

    const root = container.firstChild as HTMLElement
    // Draggable panels start with translate(0px, 0px)
    expect(root.style.transform).toBe("translate(0px, 0px)")
  })

  it("non-draggable panel has no transform", () => {
    const { container } = render(
      <ConfigurationPanel sections={sampleSections} title="Test" />
    )
    const root = container.firstChild as HTMLElement
    expect(root.style.transform).toBe("")
  })

  // ─── Edge cases ─────────────────────────────────────────────────────

  it("empty sections array renders without crash", () => {
    const { container } = render(
      <ConfigurationPanel sections={[]} title="Empty" />
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it("single section renders without separators", () => {
    const { container } = render(
      <ConfigurationPanel
        sections={[{ label: "Only", children: <div>Content</div> }]}
      />
    )
    const separators = container.querySelectorAll("[data-slot='separator']")
    expect(separators).toHaveLength(0)
  })

  // ─── A11y ───────────────────────────────────────────────────────────

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
