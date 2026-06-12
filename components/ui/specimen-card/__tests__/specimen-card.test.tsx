import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { SpecimenCard, SpecimenCardFooter } from "../specimen-card"

describe("SpecimenCard", () => {
  it("renders the context label", () => {
    render(<SpecimenCard context="error">child</SpecimenCard>)
    expect(screen.getByText("error")).toBeInTheDocument()
  })

  it("renders the feel descriptor when provided", () => {
    render(
      <SpecimenCard context="error" feel="warm, accountable">
        child
      </SpecimenCard>
    )
    expect(screen.getByText("warm, accountable")).toBeInTheDocument()
  })

  it("omits the feel element when feel is not provided", () => {
    render(<SpecimenCard context="onboarding">child</SpecimenCard>)
    // Only the context label and the child; no feel element
    expect(screen.queryByText("warm, accountable")).toBeNull()
    expect(screen.getByText("onboarding")).toBeInTheDocument()
  })

  it("renders children inside the body slot", () => {
    render(
      <SpecimenCard context="success">
        <span data-testid="specimen-child">live component</span>
      </SpecimenCard>
    )
    expect(screen.getByTestId("specimen-child")).toBeInTheDocument()
  })

  it("renders multiple children in the body slot", () => {
    render(
      <SpecimenCard context="onboarding">
        <span data-testid="child-1">first</span>
        <span data-testid="child-2">second</span>
      </SpecimenCard>
    )
    expect(screen.getByTestId("child-1")).toBeInTheDocument()
    expect(screen.getByTestId("child-2")).toBeInTheDocument()
  })

  it("applies data-slot to the root element", () => {
    const { container } = render(
      <SpecimenCard context="error">child</SpecimenCard>
    )
    expect(
      container.querySelector('[data-slot="specimen-card"]')
    ).not.toBeNull()
  })

  it("applies data-slot to the label row", () => {
    const { container } = render(
      <SpecimenCard context="error">child</SpecimenCard>
    )
    expect(
      container.querySelector('[data-slot="specimen-card-label"]')
    ).not.toBeNull()
  })

  it("applies data-slot to the body", () => {
    const { container } = render(
      <SpecimenCard context="error">child</SpecimenCard>
    )
    expect(
      container.querySelector('[data-slot="specimen-card-body"]')
    ).not.toBeNull()
  })

  it("forwards className to the root", () => {
    const { container } = render(
      <SpecimenCard context="error" className="custom-class">
        child
      </SpecimenCard>
    )
    const root = container.querySelector('[data-slot="specimen-card"]')
    expect(root).toHaveClass("custom-class")
  })

  it("forwards ref to the root div", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(
      <SpecimenCard ref={ref} context="error">
        child
      </SpecimenCard>
    )
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("DIV")
  })

  describe("semantic structure", () => {
    it("renders the context label as a span with uppercase styling", () => {
      const { container } = render(
        <SpecimenCard context="error">child</SpecimenCard>
      )
      const label = container.querySelector('[data-slot="specimen-card-label"] span')
      expect(label).not.toBeNull()
      expect(label?.textContent).toBe("error")
    })

    it("nests the feel span inside the label row", () => {
      const { container } = render(
        <SpecimenCard context="error" feel="warm, accountable">
          child
        </SpecimenCard>
      )
      const labelRow = container.querySelector('[data-slot="specimen-card-label"]')
      const spans = labelRow?.querySelectorAll("span")
      expect(spans?.length).toBe(2)
    })
  })
})

describe("SpecimenCardFooter", () => {
  it("renders footer content", () => {
    render(
      <SpecimenCard context="onboarding">
        <span>specimen</span>
        <SpecimenCardFooter>voice — precise · warm · direct</SpecimenCardFooter>
      </SpecimenCard>
    )
    expect(
      screen.getByText("voice — precise · warm · direct")
    ).toBeInTheDocument()
  })

  it("applies data-slot to the footer", () => {
    const { container } = render(
      <SpecimenCard context="onboarding">
        <SpecimenCardFooter>footer content</SpecimenCardFooter>
      </SpecimenCard>
    )
    expect(
      container.querySelector('[data-slot="specimen-card-footer"]')
    ).not.toBeNull()
  })

  it("forwards className to the footer", () => {
    const { container } = render(
      <SpecimenCardFooter className="footer-class">footer</SpecimenCardFooter>
    )
    const footer = container.querySelector('[data-slot="specimen-card-footer"]')
    expect(footer).toHaveClass("footer-class")
  })

  it("forwards ref to the footer div", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(
      <SpecimenCardFooter ref={ref}>footer</SpecimenCardFooter>
    )
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("DIV")
  })
})
