import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Separator } from "../separator"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Separator", () => {
  it("renders without crashing", () => {
    const { container } = render(<Separator />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<Separator />)
    expect(container.firstChild).toHaveAttribute("data-slot", "separator")
  })

  it("renders with horizontal orientation by default", () => {
    const { container } = render(<Separator />)
    expect(container.firstChild).toHaveAttribute("data-orientation", "horizontal")
  })

  it("renders with vertical orientation", () => {
    const { container } = render(<Separator orientation="vertical" />)
    expect(container.firstChild).toHaveAttribute("data-orientation", "vertical")
  })

  it("renders as decorative by default", () => {
    const { container } = render(<Separator />)
    // decorative separators have role="none"
    expect(container.firstChild).toHaveAttribute("role", "none")
  })

  it("renders as non-decorative when decorative=false", () => {
    const { container } = render(<Separator decorative={false} />)
    expect(container.firstChild).toHaveAttribute("role", "separator")
  })

  it("renders with custom className", () => {
    const { container } = render(<Separator className="custom-sep" />)
    expect(container.firstChild).toHaveClass("custom-sep")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<Separator ref={ref} />)
    expect(ref.current).not.toBeNull()
  })
})

describe("label", () => {
  it("renders the label centred between two rules", () => {
    const { container } = render(<Separator label="or" />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute("data-slot", "separator")
    expect(root.children).toHaveLength(3)
    expect(root.children[1]).toHaveTextContent("or")
    expect(root.children[0]).toHaveAttribute("aria-hidden", "true")
    expect(root.children[2]).toHaveAttribute("aria-hidden", "true")
  })

  it("is not decorative: exposes role=separator named by the label", () => {
    render(<Separator label="or" />)
    expect(screen.getByRole("separator", { name: "or" })).toBeInTheDocument()
  })

  it("is not decorative even when decorative is passed true", () => {
    render(<Separator label="or" decorative />)
    expect(screen.getByRole("separator", { name: "or" })).toBeInTheDocument()
  })

  it("stays horizontal and forwards className and ref", () => {
    const ref = { current: null as HTMLDivElement | null }
    const { container } = render(
      <Separator label="or" className="custom-sep" ref={ref} />
    )
    expect(container.firstChild).toHaveAttribute("data-orientation", "horizontal")
    expect(container.firstChild).toHaveClass("custom-sep")
    expect(ref.current).toBe(container.firstChild)
  })

  it("renders the bare form when label is empty", () => {
    const { container } = render(<Separator label="" />)
    expect((container.firstChild as HTMLElement).children).toHaveLength(0)
    expect(container.firstChild).toHaveAttribute("role", "none")
  })

  it("ignores label on a vertical separator", () => {
    const { container } = render(<Separator orientation="vertical" label="or" />)
    expect((container.firstChild as HTMLElement).children).toHaveLength(0)
    expect(container.firstChild).toHaveAttribute("role", "none")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (decorative)", async () => {
    const { container } = render(<Separator />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (non-decorative)", async () => {
    const { container } = render(<Separator decorative={false} />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (labelled)", async () => {
    const { container } = render(<Separator label="or" />)
    await checkA11y(container)
  })
})
