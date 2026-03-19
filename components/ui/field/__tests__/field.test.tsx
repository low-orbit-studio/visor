import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Field, FieldLabel, FieldDescription, FieldError } from "../field"

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
})
