import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ErrorPlacard } from "../error-placard"
import { checkA11y } from "../../../../test-utils/a11y"

const defaultProps = {
  icon: <span>!</span>,
  title: "Could not load data",
  body: "The request timed out.",
}

describe("ErrorPlacard", () => {
  it("renders with required props", () => {
    render(<ErrorPlacard {...defaultProps} />)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("renders role=alert", () => {
    render(<ErrorPlacard {...defaultProps} />)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<ErrorPlacard {...defaultProps} />)
    expect(screen.getByRole("alert")).toHaveAttribute("data-slot", "error-placard")
  })

  it("renders title text", () => {
    render(<ErrorPlacard {...defaultProps} />)
    expect(screen.getByText("Could not load data")).toBeInTheDocument()
  })

  it("renders body text", () => {
    render(<ErrorPlacard {...defaultProps} />)
    expect(screen.getByText("The request timed out.")).toBeInTheDocument()
  })

  it("renders icon with aria-hidden", () => {
    render(<ErrorPlacard {...defaultProps} />)
    const iconSlot = document.querySelector('[data-slot="error-placard-icon"]')
    expect(iconSlot).toHaveAttribute("aria-hidden", "true")
  })

  it("renders data-slot on icon container", () => {
    render(<ErrorPlacard {...defaultProps} />)
    expect(document.querySelector('[data-slot="error-placard-icon"]')).toBeInTheDocument()
  })

  it("renders data-slot on body container", () => {
    render(<ErrorPlacard {...defaultProps} />)
    expect(document.querySelector('[data-slot="error-placard-body"]')).toBeInTheDocument()
  })

  it("renders data-slot on title element", () => {
    render(<ErrorPlacard {...defaultProps} />)
    expect(document.querySelector('[data-slot="error-placard-title"]')).toBeInTheDocument()
  })

  it("renders data-slot on message element", () => {
    render(<ErrorPlacard {...defaultProps} />)
    expect(document.querySelector('[data-slot="error-placard-message"]')).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<ErrorPlacard {...defaultProps} className="custom-class" />)
    expect(screen.getByRole("alert")).toHaveClass("custom-class")
  })

  it("forwards additional HTML attributes", () => {
    render(<ErrorPlacard {...defaultProps} data-testid="my-placard" />)
    expect(screen.getByTestId("my-placard")).toBeInTheDocument()
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<ErrorPlacard {...defaultProps} ref={ref} />)
    expect(ref.current).not.toBeNull()
  })

  it("does not render actions slot when actions not provided", () => {
    render(<ErrorPlacard {...defaultProps} />)
    expect(document.querySelector('[data-slot="error-placard-actions"]')).not.toBeInTheDocument()
  })

  it("renders actions slot when actions provided", () => {
    render(
      <ErrorPlacard
        {...defaultProps}
        actions={
          <>
            <button>Dismiss</button>
            <button>Retry</button>
          </>
        }
      />
    )
    expect(document.querySelector('[data-slot="error-placard-actions"]')).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
  })

  it("renders ReactNode title", () => {
    render(
      <ErrorPlacard
        icon={<span>!</span>}
        title={<strong>Critical failure</strong>}
        body="Something went wrong."
      />
    )
    expect(screen.getByText("Critical failure")).toBeInTheDocument()
  })

  it("renders ReactNode body", () => {
    render(
      <ErrorPlacard
        icon={<span>!</span>}
        title="Error"
        body={<em>Please try again later.</em>}
      />
    )
    expect(screen.getByText("Please try again later.")).toBeInTheDocument()
  })
})

describe("ErrorPlacard accessibility", () => {
  it("has no WCAG 2.1 AA violations (without actions)", async () => {
    const { container } = render(
      <ErrorPlacard
        icon={<span aria-label="error">!</span>}
        title="Could not load members"
        body="The request timed out. Check your connection and try again."
      />
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (with actions)", async () => {
    const { container } = render(
      <ErrorPlacard
        icon={<span aria-label="error">!</span>}
        title="Could not load members"
        body="The request timed out. Check your connection and try again."
        actions={
          <>
            <button type="button">Dismiss</button>
            <button type="button">Retry</button>
          </>
        }
      />
    )
    await checkA11y(container)
  })
})
