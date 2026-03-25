import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../dialog/dialog"
import { Field, FieldLabel, FieldError } from "../field/field"
import { Input } from "../input/input"
import { Button } from "../button/button"
import { checkA11y } from "../../../test-utils/a11y"

function DialogForm({
  onSubmit,
  errors,
}: {
  onSubmit?: (data: FormData) => void
  errors?: Array<{ message?: string }>
}) {
  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
          <DialogDescription>Fill in your details below.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit?.(new FormData(e.currentTarget))
          }}
        >
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" name="name" placeholder="Enter your name" />
            {errors && <FieldError errors={errors} />}
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" name="email" type="email" placeholder="Enter your email" />
          </Field>
          <Button type="submit">Submit</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

describe("Composition: Dialog + Form", () => {
  it("renders form fields inside an open dialog", () => {
    render(<DialogForm />)
    expect(screen.getByText("Create Account")).toBeInTheDocument()
    expect(screen.getByText("Fill in your details below.")).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument()
  })

  it("form inputs are interactive within dialog", async () => {
    const user = userEvent.setup()
    render(<DialogForm />)
    const nameInput = screen.getByLabelText("Name")
    await user.type(nameInput, "Alice")
    expect(nameInput).toHaveValue("Alice")
  })

  it("form submission fires within dialog context", async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    render(<DialogForm onSubmit={handleSubmit} />)
    await user.type(screen.getByLabelText("Name"), "Alice")
    await user.type(screen.getByLabelText("Email"), "alice@example.com")
    await user.click(screen.getByRole("button", { name: "Submit" }))
    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })

  it("displays FieldError validation messages in dialog", () => {
    render(<DialogForm errors={[{ message: "Name is required" }]} />)
    expect(screen.getByText("Name is required")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("close button coexists with form submit button", () => {
    render(<DialogForm />)
    const buttons = screen.getAllByRole("button")
    const submitButton = buttons.find((b) => b.textContent === "Submit")
    const closeButton = buttons.find((b) => b.textContent?.includes("Close"))
    expect(submitButton).toBeInTheDocument()
    expect(closeButton).toBeInTheDocument()
  })
})

describe("Composition: Dialog + Form accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<DialogForm />)
    await checkA11y(container)
  })
})
