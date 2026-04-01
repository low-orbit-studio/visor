import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { z } from "zod"
import { Form } from "../form"
import { checkA11y } from "../../../../test-utils/a11y"

const testSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
})

const mockAction = vi.fn(async () => null)

describe("Form", () => {
  it("renders children with form and fields context", () => {
    render(
      <Form schema={testSchema} action={mockAction}>
        {({ fields }) => (
          <>
            <label htmlFor={fields.name.id}>Name</label>
            <input name={fields.name.name} id={fields.name.id} />
            <label htmlFor={fields.email.id}>Email</label>
            <input name={fields.email.name} id={fields.email.id} />
            <button type="submit">Submit</button>
          </>
        )}
      </Form>
    )

    expect(screen.getByText("Name")).toBeInTheDocument()
    expect(screen.getByText("Email")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument()
  })

  it("sets noValidate on the form element", () => {
    render(
      <Form schema={testSchema} action={mockAction}>
        {() => <button type="submit">Submit</button>}
      </Form>
    )

    const form = screen.getByRole("button", { name: "Submit" }).closest("form")
    expect(form).toHaveAttribute("novalidate")
  })

  it("accepts className", () => {
    render(
      <Form schema={testSchema} action={mockAction} className="custom-form">
        {() => <button type="submit">Submit</button>}
      </Form>
    )

    const form = screen.getByRole("button", { name: "Submit" }).closest("form")
    expect(form).toHaveClass("custom-form")
  })

  it("renders with default form class", () => {
    render(
      <Form schema={testSchema} action={mockAction}>
        {() => <button type="submit">Submit</button>}
      </Form>
    )

    const form = screen.getByRole("button", { name: "Submit" }).closest("form")
    expect(form).toHaveClass("form")
  })

  it("displays validation errors on submit with invalid data", async () => {
    const user = userEvent.setup()

    render(
      <Form schema={testSchema} action={mockAction}>
        {({ fields }) => (
          <>
            <label htmlFor={fields.name.id}>Name</label>
            <input name={fields.name.name} id={fields.name.id} />
            <label htmlFor={fields.email.id}>Email</label>
            <input name={fields.email.name} id={fields.email.id} />
            {fields.name.errors?.map((error, i) => (
              <div key={i} role="alert">{error}</div>
            ))}
            {fields.email.errors?.map((error, i) => (
              <div key={i} role="alert">{error}</div>
            ))}
            <button type="submit">Submit</button>
          </>
        )}
      </Form>
    )

    await user.click(screen.getByRole("button", { name: "Submit" }))

    // Conform + Zod returns "Required" for empty required fields
    const alerts = await screen.findAllByRole("alert")
    expect(alerts.length).toBeGreaterThan(0)
  })

  it("accepts shouldValidate prop", () => {
    render(
      <Form schema={testSchema} action={mockAction} shouldValidate="onInput">
        {() => <span>Content</span>}
      </Form>
    )

    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("accepts defaultValue prop", () => {
    render(
      <Form
        schema={testSchema}
        action={mockAction}
        defaultValue={{ name: "Jane" }}
      >
        {({ fields }) => (
          <input
            name={fields.name.name}
            id={fields.name.id}
            defaultValue={fields.name.value}
          />
        )}
      </Form>
    )

    expect(screen.getByDisplayValue("Jane")).toBeInTheDocument()
  })
})

describe("Form accessibility", () => {
  it("has no WCAG 2.1 AA violations (basic form)", async () => {
    const { container } = render(
      <Form schema={testSchema} action={mockAction}>
        {({ fields }) => (
          <>
            <label htmlFor={fields.name.id}>Name</label>
            <input name={fields.name.name} id={fields.name.id} />
            <label htmlFor={fields.email.id}>Email</label>
            <input name={fields.email.name} id={fields.email.id} />
            <button type="submit">Submit</button>
          </>
        )}
      </Form>
    )

    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (form with errors)", async () => {
    const user = userEvent.setup()

    const { container } = render(
      <Form schema={testSchema} action={mockAction}>
        {({ fields }) => (
          <>
            <label htmlFor={fields.name.id}>Name</label>
            <input
              name={fields.name.name}
              id={fields.name.id}
              aria-invalid={!fields.name.valid || undefined}
              aria-describedby={
                fields.name.errors?.length ? `${fields.name.id}-error` : undefined
              }
            />
            {fields.name.errors?.map((error, i) => (
              <div key={i} id={`${fields.name.id}-error`} role="alert">
                {error}
              </div>
            ))}
            <label htmlFor={fields.email.id}>Email</label>
            <input
              name={fields.email.name}
              id={fields.email.id}
              aria-invalid={!fields.email.valid || undefined}
              aria-describedby={
                fields.email.errors?.length ? `${fields.email.id}-error` : undefined
              }
            />
            {fields.email.errors?.map((error, i) => (
              <div key={i} id={`${fields.email.id}-error`} role="alert">
                {error}
              </div>
            ))}
            <button type="submit">Submit</button>
          </>
        )}
      </Form>
    )

    await user.click(screen.getByRole("button", { name: "Submit" }))
    await screen.findAllByRole("alert")

    await checkA11y(container)
  })
})
