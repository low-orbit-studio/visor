import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { ConfirmDialog } from "../confirm-dialog"

describe("ConfirmDialog", () => {
  it("opens via trigger", async () => {
    const user = userEvent.setup()
    render(
      <ConfirmDialog
        title="Delete project?"
        description="This cannot be undone."
        trigger={<button type="button">Open</button>}
      />
    )

    expect(screen.queryByRole("dialog")).toBeNull()
    await user.click(screen.getByRole("button", { name: /open/i }))
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("renders title and description", () => {
    render(
      <ConfirmDialog
        open
        title="Delete project?"
        description="This cannot be undone."
      />
    )
    expect(screen.getByText("Delete project?")).toBeInTheDocument()
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument()
  })

  it("renders children instead of description when both provided", () => {
    render(
      <ConfirmDialog
        open
        title="Confirm"
        description="Short description"
      >
        <p>Richer body content</p>
      </ConfirmDialog>
    )
    expect(screen.getByText("Richer body content")).toBeInTheDocument()
    expect(screen.queryByText("Short description")).toBeNull()
  })

  it("swaps severity icon + confirm button variant per severity", () => {
    const { rerender, container } = render(
      <ConfirmDialog open title="Confirm" severity="info" />
    )
    let root = container.ownerDocument.querySelector(
      '[data-slot="confirm-dialog"]'
    )
    expect(root).toHaveAttribute("data-severity", "info")
    let confirm = container.ownerDocument.querySelector(
      '[data-slot="confirm-dialog-confirm"]'
    )
    expect(confirm?.className).toMatch(/variantDefault/)

    rerender(<ConfirmDialog open title="Confirm" severity="warning" />)
    root = container.ownerDocument.querySelector(
      '[data-slot="confirm-dialog"]'
    )
    expect(root).toHaveAttribute("data-severity", "warning")
    confirm = container.ownerDocument.querySelector(
      '[data-slot="confirm-dialog-confirm"]'
    )
    expect(confirm?.className).toMatch(/variantDefault/)

    rerender(<ConfirmDialog open title="Confirm" severity="danger" />)
    root = container.ownerDocument.querySelector(
      '[data-slot="confirm-dialog"]'
    )
    expect(root).toHaveAttribute("data-severity", "danger")
    confirm = container.ownerDocument.querySelector(
      '[data-slot="confirm-dialog-confirm"]'
    )
    expect(confirm?.className).toMatch(/variantDestructive/)
  })

  it("default confirm label is 'Delete' for danger and 'Confirm' otherwise", () => {
    const { rerender } = render(
      <ConfirmDialog open title="Confirm" severity="warning" />
    )
    expect(
      screen.getByRole("button", { name: /^confirm$/i })
    ).toBeInTheDocument()

    rerender(<ConfirmDialog open title="Confirm" severity="danger" />)
    expect(
      screen.getByRole("button", { name: /^delete$/i })
    ).toBeInTheDocument()
  })

  it("calls onConfirm when confirm clicked", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open
        title="Confirm"
        onConfirm={onConfirm}
        confirmLabel="Go"
      />
    )
    await user.click(screen.getByRole("button", { name: /go/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("calls onCancel and closes when cancel clicked", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <ConfirmDialog
        defaultOpen
        title="Confirm"
        onCancel={onCancel}
        onOpenChange={onOpenChange}
      />
    )
    await user.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  describe("confirmText gate", () => {
    it("disables confirm button initially and enables on exact match", async () => {
      const user = userEvent.setup()
      render(
        <ConfirmDialog
          open
          title="Delete project?"
          severity="danger"
          confirmText="acme"
        />
      )
      const confirmBtn = screen.getByRole("button", { name: /delete/i })
      expect(confirmBtn).toBeDisabled()

      const input = screen.getByLabelText(/type acme to confirm/i)
      await user.type(input, "acme")
      expect(confirmBtn).not.toBeDisabled()
    })

    it("is case-sensitive", async () => {
      const user = userEvent.setup()
      render(
        <ConfirmDialog
          open
          title="Delete project?"
          severity="danger"
          confirmText="Acme"
        />
      )
      const confirmBtn = screen.getByRole("button", { name: /delete/i })
      const input = screen.getByLabelText(/type acme to confirm/i)

      await user.type(input, "acme")
      expect(confirmBtn).toBeDisabled()

      await user.clear(input)
      await user.type(input, "Acme")
      expect(confirmBtn).not.toBeDisabled()
    })
  })

  it("shows pending state during async onConfirm and keeps dialog open until resolved", async () => {
    const user = userEvent.setup()
    let resolveFn: (() => void) = () => {}
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFn = resolve
        })
    )
    const onOpenChange = vi.fn()

    render(
      <ConfirmDialog
        defaultOpen
        title="Confirm"
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />
    )

    const confirmBtn = screen.getByRole("button", { name: /^confirm$/i })
    const cancelBtn = screen.getByRole("button", { name: /^cancel$/i })
    await user.click(confirmBtn)

    // While pending, both buttons are disabled, dialog stays open
    expect(confirmBtn).toBeDisabled()
    expect(cancelBtn).toBeDisabled()
    expect(confirmBtn).toHaveAttribute("aria-busy", "true")
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    resolveFn()
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it("external busy prop disables both buttons and overrides internal state", () => {
    render(
      <ConfirmDialog
        open
        title="Confirm"
        busy
        onConfirm={() => {}}
      />
    )
    expect(screen.getByRole("button", { name: /^confirm$/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeDisabled()
  })

  it("clears confirm-text input on close", async () => {
    const user = userEvent.setup()
    const Wrapper = () => {
      const [open, setOpen] = React.useState(true)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Reopen
          </button>
          <ConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title="Delete?"
            severity="danger"
            confirmText="acme"
          />
        </>
      )
    }
    render(<Wrapper />)

    const input = screen.getByLabelText(/type acme to confirm/i) as HTMLInputElement
    await user.type(input, "acme")
    expect(input.value).toBe("acme")

    await user.click(screen.getByRole("button", { name: /cancel/i }))
    // Reopen
    await user.click(screen.getByRole("button", { name: /reopen/i }))
    const reopenedInput = screen.getByLabelText(
      /type acme to confirm/i
    ) as HTMLInputElement
    expect(reopenedInput.value).toBe("")
  })
})

