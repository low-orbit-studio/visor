import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { checkA11y } from "../../../../test-utils/a11y"
import { Fieldset, FieldsetLegend } from "../fieldset"

describe("Fieldset", () => {
  it("renders with default props", () => {
    render(
      <Fieldset>
        <FieldsetLegend>Group</FieldsetLegend>
        <input />
      </Fieldset>
    )
    expect(screen.getByRole("group")).toBeInTheDocument()
    expect(screen.getByText("Group")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<Fieldset className="custom" />)
    expect(screen.getByRole("group")).toHaveClass("custom")
  })

  it("forwards ref to fieldset element", () => {
    const ref = { current: null } as React.RefObject<HTMLFieldSetElement | null>
    render(<Fieldset ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLFieldSetElement)
  })

  it("renders data-slot attribute", () => {
    render(<Fieldset />)
    expect(screen.getByRole("group")).toHaveAttribute("data-slot", "fieldset")
  })

  it("supports disabled state", () => {
    render(
      <Fieldset disabled>
        <input data-testid="inner-input" />
      </Fieldset>
    )
    expect(screen.getByRole("group")).toBeDisabled()
  })
})

describe("FieldsetLegend", () => {
  it("renders with text content", () => {
    render(
      <Fieldset>
        <FieldsetLegend>My Legend</FieldsetLegend>
      </Fieldset>
    )
    expect(screen.getByText("My Legend")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(
      <Fieldset>
        <FieldsetLegend className="custom">Title</FieldsetLegend>
      </Fieldset>
    )
    expect(screen.getByText("Title")).toHaveClass("custom")
  })

  it("renders data-slot attribute", () => {
    render(
      <Fieldset>
        <FieldsetLegend>Title</FieldsetLegend>
      </Fieldset>
    )
    expect(screen.getByText("Title")).toHaveAttribute(
      "data-slot",
      "fieldset-legend"
    )
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Fieldset>
        <FieldsetLegend>Contact Info</FieldsetLegend>
        <label htmlFor="name">Name</label>
        <input id="name" />
      </Fieldset>
    )
    await checkA11y(container)
  })
})
