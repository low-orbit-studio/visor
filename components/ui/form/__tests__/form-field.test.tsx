import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { z } from "zod"
import { Form } from "../form"
import { FormField } from "../form-field"
import { checkA11y } from "../../../../test-utils/a11y"

const testSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
})

const mockAction = vi.fn(async () => null)

function renderFormField(props: {
  fieldName: "name" | "email"
  label: string
  description?: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
}) {
  return render(
    <Form schema={testSchema} action={mockAction}>
      {({ fields }) => (
        <FormField
          field={fields[props.fieldName]}
          label={props.label}
          description={props.description}
          type={props.type}
          placeholder={props.placeholder}
        />
      )}
    </Form>
  )
}

describe("FormField", () => {
  it("renders label and input", () => {
    renderFormField({ fieldName: "name", label: "Name" })

    expect(screen.getByText("Name")).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    renderFormField({
      fieldName: "name",
      label: "Name",
      description: "Enter your full name",
    })

    expect(screen.getByText("Enter your full name")).toBeInTheDocument()
  })

  it("does not render description when not provided", () => {
    renderFormField({ fieldName: "name", label: "Name" })

    expect(screen.queryByText("Enter your full name")).not.toBeInTheDocument()
  })

  it("renders with placeholder", () => {
    renderFormField({
      fieldName: "name",
      label: "Name",
      placeholder: "Jane Doe",
    })

    expect(screen.getByPlaceholderText("Jane Doe")).toBeInTheDocument()
  })

  it("renders correct input type", () => {
    renderFormField({
      fieldName: "email",
      label: "Email",
      type: "email",
    })

    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("type", "email")
  })

  it("connects label to input via htmlFor", () => {
    renderFormField({ fieldName: "name", label: "Name" })

    const label = screen.getByText("Name")
    const input = screen.getByRole("textbox")
    expect(label).toHaveAttribute("for", input.id)
  })
})

describe("FormField accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = renderFormField({
      fieldName: "name",
      label: "Name",
      description: "Your full name",
      placeholder: "Jane Doe",
    })

    await checkA11y(container)
  })
})
