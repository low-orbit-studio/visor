import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { FormError, FormErrorTitle, FormErrorDescription } from "../form-error"
import { checkA11y } from "../../../../test-utils/a11y"

describe("FormError", () => {
  it("renders with children", () => {
    render(<FormError>Error content</FormError>)
    expect(screen.getByText("Error content")).toBeInTheDocument()
  })

  it("renders with role='alert'", () => {
    render(<FormError>Error</FormError>)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("applies data-slot='form-error'", () => {
    render(<FormError>Error</FormError>)
    expect(screen.getByRole("alert")).toHaveAttribute("data-slot", "form-error")
  })

  it("renders with custom className", () => {
    render(<FormError className="custom-class">Error</FormError>)
    expect(screen.getByRole("alert")).toHaveClass("custom-class")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<FormError ref={ref}>Error</FormError>)
    expect(ref.current).not.toBeNull()
  })

  it("renders icon when provided", () => {
    render(
      <FormError icon={<svg data-testid="error-icon" />}>Error</FormError>
    )
    expect(screen.getByTestId("error-icon")).toBeInTheDocument()
  })

  it("icon slot is aria-hidden", () => {
    render(
      <FormError icon={<svg data-testid="icon" />}>Error</FormError>
    )
    const iconSlot = screen.getByRole("alert").querySelector('[data-slot="form-error-icon"]')
    expect(iconSlot).not.toBeNull()
    expect(iconSlot).toHaveAttribute("aria-hidden", "true")
  })

  it("does not render icon slot when icon is not provided", () => {
    render(<FormError>Error</FormError>)
    const iconSlot = screen.getByRole("alert").querySelector('[data-slot="form-error-icon"]')
    expect(iconSlot).toBeNull()
  })

  it("renders content slot", () => {
    render(<FormError>Content here</FormError>)
    const content = screen.getByRole("alert").querySelector('[data-slot="form-error-content"]')
    expect(content).not.toBeNull()
  })
})

describe("FormErrorTitle", () => {
  it("renders title text", () => {
    render(<FormErrorTitle>Please fix the errors below</FormErrorTitle>)
    expect(screen.getByText("Please fix the errors below")).toBeInTheDocument()
  })

  it("applies data-slot='form-error-title'", () => {
    render(<FormErrorTitle>Title</FormErrorTitle>)
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "form-error-title")
  })

  it("renders as a paragraph element", () => {
    render(<FormErrorTitle>Title</FormErrorTitle>)
    const el = screen.getByText("Title")
    expect(el.tagName.toLowerCase()).toBe("p")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<FormErrorTitle ref={ref}>Title</FormErrorTitle>)
    expect(ref.current).not.toBeNull()
  })
})

describe("FormErrorDescription", () => {
  it("renders description text", () => {
    render(<FormErrorDescription>2 fields need your attention.</FormErrorDescription>)
    expect(screen.getByText("2 fields need your attention.")).toBeInTheDocument()
  })

  it("applies data-slot='form-error-description'", () => {
    render(<FormErrorDescription>Description</FormErrorDescription>)
    expect(screen.getByText("Description")).toHaveAttribute("data-slot", "form-error-description")
  })

  it("renders as a paragraph element", () => {
    render(<FormErrorDescription>Description</FormErrorDescription>)
    const el = screen.getByText("Description")
    expect(el.tagName.toLowerCase()).toBe("p")
  })
})

describe("FormError compound usage", () => {
  it("renders full structure with icon, title, and description", () => {
    render(
      <FormError icon={<svg data-testid="warn-icon" />}>
        <FormErrorTitle>Please fix the errors below before continuing</FormErrorTitle>
        <FormErrorDescription>2 fields need your attention.</FormErrorDescription>
      </FormError>
    )
    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.getByTestId("warn-icon")).toBeInTheDocument()
    expect(screen.getByText("Please fix the errors below before continuing")).toBeInTheDocument()
    expect(screen.getByText("2 fields need your attention.")).toBeInTheDocument()
  })

  it("renders without icon", () => {
    render(
      <FormError>
        <FormErrorTitle>Fix errors before submitting</FormErrorTitle>
      </FormError>
    )
    const alert = screen.getByRole("alert")
    expect(alert.querySelector('[data-slot="form-error-icon"]')).toBeNull()
    expect(screen.getByText("Fix errors before submitting")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (title only)", async () => {
    const { container } = render(
      <FormError>
        <FormErrorTitle>Please fix the errors below before continuing</FormErrorTitle>
      </FormError>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (with icon, title, and description)", async () => {
    const { container } = render(
      <FormError icon={<svg aria-label="Error" role="img" />}>
        <FormErrorTitle>Please fix the errors below before continuing</FormErrorTitle>
        <FormErrorDescription>2 fields need your attention.</FormErrorDescription>
      </FormError>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (form validation composition)", async () => {
    const { container } = render(
      <div>
        <FormError>
          <FormErrorTitle>Please fix the errors below before continuing</FormErrorTitle>
          <FormErrorDescription>2 fields need your attention.</FormErrorDescription>
        </FormError>
        <div>
          <label htmlFor="name-test">Full name</label>
          <input
            id="name-test"
            type="text"
            aria-invalid="true"
            aria-describedby="name-test-error"
          />
          <div id="name-test-error" role="alert">Full name is required</div>
        </div>
      </div>
    )
    await checkA11y(container)
  })
})
