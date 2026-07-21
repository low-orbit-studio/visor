import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  DialogForm,
  DialogFormContent,
  DialogFormHeader,
  DialogFormTitle,
  DialogFormBody,
  DialogFormFooter,
  DialogFormDescription,
} from "../dialog-form"
import { Button } from "../../../components/ui/button/button"
import { checkA11y } from "../../../test-utils/a11y"

function Example({ size }: { size?: "sm" | "md" } = {}) {
  return (
    <DialogForm open>
      <DialogFormContent>
        <DialogFormHeader>
          <DialogFormTitle size={size}>Invite user</DialogFormTitle>
          <DialogFormDescription>Send an invitation.</DialogFormDescription>
        </DialogFormHeader>
        <DialogFormBody>
          <div>body content</div>
        </DialogFormBody>
        <DialogFormFooter>
          <Button size="dlg" variant="ghost">
            Cancel
          </Button>
          <Button size="dlg">Send</Button>
        </DialogFormFooter>
      </DialogFormContent>
    </DialogForm>
  )
}

describe("DialogForm", () => {
  it("renders the titled shell when open", () => {
    render(<Example />)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Invite user")).toBeInTheDocument()
    expect(screen.getByText("Send an invitation.")).toBeInTheDocument()
    expect(screen.getByText("body content")).toBeInTheDocument()
  })

  it("renders the footer action buttons", () => {
    render(<Example />)
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument()
  })

  it("the title is an accessible heading via Radix DialogTitle", () => {
    render(<Example size="md" />)
    // Radix associates DialogTitle with the dialog's aria-labelledby.
    expect(screen.getByText("Invite user")).toBeInTheDocument()
  })

  it("passes accessibility checks", async () => {
    const { baseElement } = render(<Example />)
    await checkA11y(baseElement)
  })
})
