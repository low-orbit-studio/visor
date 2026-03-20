import { render } from "@testing-library/react"
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

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (decorative)", async () => {
    const { container } = render(<Separator />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (non-decorative)", async () => {
    const { container } = render(<Separator decorative={false} />)
    await checkA11y(container)
  })
})
