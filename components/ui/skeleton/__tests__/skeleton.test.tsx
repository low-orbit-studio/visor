import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Skeleton } from "../skeleton"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Skeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveAttribute("data-slot", "skeleton")
  })

  it("renders with custom className", () => {
    const { container } = render(<Skeleton className="custom-skeleton" />)
    expect(container.firstChild).toHaveClass("custom-skeleton")
  })

  it("accepts width and height styles", () => {
    const { container } = render(
      <Skeleton style={{ width: "100px", height: "20px" }} />
    )
    const el = container.firstChild as HTMLElement
    expect(el.style.width).toBe("100px")
    expect(el.style.height).toBe("20px")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<Skeleton ref={ref} />)
    expect(ref.current).not.toBeNull()
  })

  it("renders as a div element", () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild?.nodeName).toBe("DIV")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (aria-hidden skeleton)", async () => {
    // Skeletons are decorative loading placeholders; hide from AT with aria-hidden
    const { container } = render(
      <div>
        <p>Loading...</p>
        <Skeleton aria-hidden="true" style={{ width: "200px", height: "20px" }} />
      </div>
    )
    await checkA11y(container)
  })
})
