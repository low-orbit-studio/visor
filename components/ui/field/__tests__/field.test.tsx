import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Field, FieldLabel, FieldControl, FieldDescription, FieldError } from "../field"
import { Input } from "../../input/input"
import { Textarea } from "../../textarea/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../select/select"
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

  it("renders a leading aria-hidden icon and row layout when icon is provided", () => {
    render(
      <FieldError icon={<svg data-testid="warn" />}>This field is required</FieldError>
    )
    const alert = screen.getByRole("alert")
    expect(alert).toHaveClass("fieldErrorWithIcon")
    const iconSpan = alert.querySelector('[data-slot="field-error-icon"]')
    expect(iconSpan).not.toBeNull()
    expect(iconSpan).toHaveClass("fieldErrorIcon")
    expect(iconSpan).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByTestId("warn")).toBeInTheDocument()
    expect(screen.getByText("This field is required")).toBeInTheDocument()
  })

  it("omits the icon span and row layout by default (unchanged text-only render)", () => {
    render(<FieldError>This field is required</FieldError>)
    const alert = screen.getByRole("alert")
    expect(alert).not.toHaveClass("fieldErrorWithIcon")
    expect(alert.querySelector('[data-slot="field-error-icon"]')).toBeNull()
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

describe("FieldLabel optional (VI-805)", () => {
  it("adds an optional mark inside the label, so the accessible name includes it", () => {
    render(
      <Field>
        <FieldLabel htmlFor="phone" optional>Phone</FieldLabel>
        <input id="phone" />
      </Field>
    )
    expect(screen.getByRole("textbox", { name: "Phone optional" })).toBeInTheDocument()
    const mark = document.querySelector('[data-slot="field-label-optional"]')
    expect(mark).toHaveTextContent("optional")
    expect(mark).toHaveClass("fieldLabelOptional")
  })

  it("renders the label as before without it", () => {
    render(<FieldLabel>Phone</FieldLabel>)
    expect(document.querySelector('[data-slot="field-label-optional"]')).toBeNull()
    expect(screen.getByText("Phone").tagName.toLowerCase()).toBe("label")
  })
})

describe("FieldControl (VI-805)", () => {
  it("renders the control box slot around its child", () => {
    render(
      <FieldControl data-testid="box">
        <Input aria-label="Name" />
      </FieldControl>
    )
    const box = screen.getByTestId("box")
    expect(box).toHaveAttribute("data-slot", "field-control")
    expect(box).toHaveClass("control")
    expect(box).not.toHaveClass("controlTall")
    expect(box).toContainElement(screen.getByRole("textbox", { name: "Name" }))
  })

  it("takes the tall box for a Textarea", () => {
    render(
      <FieldControl tall data-testid="box">
        <Textarea aria-label="Notes" />
      </FieldControl>
    )
    expect(screen.getByTestId("box")).toHaveClass("control", "controlTall")
  })

  it("forwards ref and passes props through", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<FieldControl ref={ref} id="box" />)
    expect(ref.current?.id).toBe("box")
  })
})

describe("accessibility with FieldControl (VI-805)", () => {
  const Form = ({ invalid }: { invalid?: boolean }) => (
    <>
      <Field>
        <FieldLabel htmlFor="n">Your name</FieldLabel>
        <FieldControl>
          <Input id="n" aria-describedby="n-hint n-error" aria-invalid={invalid || undefined} />
        </FieldControl>
        <FieldDescription id="n-hint">As it appears on your ID.</FieldDescription>
        {invalid && (
          <FieldError id="n-error" icon={<svg />}>
            Tell us your name
          </FieldError>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="t" optional>Notes</FieldLabel>
        <FieldControl tall>
          <Textarea id="t" aria-invalid={invalid || undefined} />
        </FieldControl>
      </Field>
      <Field>
        <FieldLabel htmlFor="s">Arrival</FieldLabel>
        <FieldControl>
          <Select>
            <SelectTrigger id="s" aria-invalid={invalid || undefined}>
              <SelectValue placeholder="Choose one" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fri">Friday</SelectItem>
            </SelectContent>
          </Select>
        </FieldControl>
      </Field>
    </>
  )

  it("has no WCAG 2.1 AA violations (valid)", async () => {
    const { container } = render(<Form />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (invalid, with the error line)", async () => {
    const { container } = render(<Form invalid />)
    await checkA11y(container)
    const error = screen.getByRole("alert")
    expect(error).toHaveTextContent("Tell us your name")
    expect(error.querySelector('[data-slot="field-error-icon"]')).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByRole("textbox", { name: "Your name" })).toHaveAccessibleDescription(
      "As it appears on your ID. Tell us your name"
    )
  })
})
