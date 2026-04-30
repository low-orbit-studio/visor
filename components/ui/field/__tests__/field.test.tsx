import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Field, FieldLabel, FieldDescription, FieldError } from "../field"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Field", () => {
  it("renders with default props", () => {
    render(<Field aria-label="Name field">Content</Field>)
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("renders as a group", () => {
    render(<Field>Content</Field>)
    expect(screen.getByRole("group")).toBeInTheDocument()
  })

  it("renders with custom className", () => {
    render(<Field className="custom-class">Content</Field>)
    expect(screen.getByRole("group")).toHaveClass("custom-class")
  })

  it("renders with vertical orientation by default", () => {
    render(<Field>Content</Field>)
    expect(screen.getByRole("group")).toHaveAttribute("data-orientation", "vertical")
  })

  it("renders with horizontal orientation", () => {
    render(<Field orientation="horizontal">Content</Field>)
    expect(screen.getByRole("group")).toHaveAttribute("data-orientation", "horizontal")
  })

  it("forwards ref correctly", () => {
    const ref = { current: null }
    render(<Field ref={ref}>Content</Field>)
    expect(ref.current).not.toBeNull()
  })
})

describe("FieldLabel", () => {
  it("renders label text", () => {
    render(<FieldLabel>Email address</FieldLabel>)
    expect(screen.getByText("Email address")).toBeInTheDocument()
  })

  it("renders as a label element", () => {
    render(<FieldLabel htmlFor="email">Email</FieldLabel>)
    const label = screen.getByText("Email")
    expect(label.tagName.toLowerCase()).toBe("label")
  })

  it("applies fieldLabel CSS class (which sets --font-size-sm / 14px)", () => {
    render(<FieldLabel>Label</FieldLabel>)
    const label = screen.getByText("Label")
    expect(label).toHaveClass("fieldLabel")
  })
})

describe("FieldDescription", () => {
  it("renders description text", () => {
    render(<FieldDescription>Enter your email address</FieldDescription>)
    expect(screen.getByText("Enter your email address")).toBeInTheDocument()
  })

  it("renders as a paragraph element", () => {
    render(<FieldDescription>Help text</FieldDescription>)
    const p = screen.getByText("Help text")
    expect(p.tagName.toLowerCase()).toBe("p")
  })

  it("applies fieldDescription CSS class (which sets --font-size-xs / 12px, smaller than FieldLabel)", () => {
    render(<FieldDescription>Description</FieldDescription>)
    const description = screen.getByText("Description")
    expect(description).toHaveClass("fieldDescription")
  })
})

describe("FieldError", () => {
  it("renders error text from children", () => {
    render(<FieldError>This field is required</FieldError>)
    expect(screen.getByText("This field is required")).toBeInTheDocument()
  })

  it("renders as alert", () => {
    render(<FieldError>Error message</FieldError>)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("renders nothing when no content and no errors", () => {
    const { container } = render(<FieldError errors={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders error from errors array", () => {
    render(<FieldError errors={[{ message: "Field is required" }]} />)
    expect(screen.getByText("Field is required")).toBeInTheDocument()
  })

  it("renders multiple errors as a list", () => {
    render(
      <FieldError
        errors={[{ message: "Too short" }, { message: "Invalid format" }]}
      />
    )
    expect(screen.getByText("Too short")).toBeInTheDocument()
    expect(screen.getByText("Invalid format")).toBeInTheDocument()
  })

  it("deduplicates errors with identical messages", () => {
    render(
      <FieldError
        errors={[{ message: "Required" }, { message: "Required" }]}
      />
    )
    const items = screen.getAllByText("Required")
    expect(items).toHaveLength(1)
  })

  it("renders error from string array (Conform format)", () => {
    render(<FieldError errors={["Field is required"]} />)
    expect(screen.getByText("Field is required")).toBeInTheDocument()
  })

  it("renders multiple string errors as a list", () => {
    render(<FieldError errors={["Too short", "Invalid format"]} />)
    expect(screen.getByText("Too short")).toBeInTheDocument()
    expect(screen.getByText("Invalid format")).toBeInTheDocument()
  })

  it("handles mixed string and object errors", () => {
    render(
      <FieldError errors={["String error", { message: "Object error" }]} />
    )
    expect(screen.getByText("String error")).toBeInTheDocument()
    expect(screen.getByText("Object error")).toBeInTheDocument()
  })

  it("deduplicates string errors", () => {
    render(<FieldError errors={["Required", "Required"]} />)
    const items = screen.getAllByText("Required")
    expect(items).toHaveLength(1)
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (full field structure)", async () => {
    const { container } = render(
      <Field>
        <FieldLabel htmlFor="email">Email address</FieldLabel>
        <input id="email" type="email" aria-describedby="email-desc" />
        <FieldDescription id="email-desc">Enter your work email.</FieldDescription>
      </Field>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (field with error)", async () => {
    const { container } = render(
      <Field>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <input id="name" type="text" aria-describedby="name-error" aria-invalid="true" />
        <FieldError id="name-error">Name is required</FieldError>
      </Field>
    )
    await checkA11y(container)
  })
})
