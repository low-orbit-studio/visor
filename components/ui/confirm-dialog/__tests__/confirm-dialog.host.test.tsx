import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { ConfirmDialog } from "../confirm-dialog"

/**
 * Host-app embedding (VI-727): `container`, `iconTreatment="none"` and
 * `showCloseButton`. Defaults must render exactly as before.
 */

// Radix ids come from React useId and differ between runs/shards.
function normalizeIds(html: string): string {
  return html.replace(/(id|aria-labelledby|aria-describedby|for)="[^"]*"/g, '$1=""')
}

describe("ConfirmDialog — host-app embedding", () => {
  it("portals into `container`, not a direct child of document.body", () => {
    const host = document.createElement("div")
    host.className = "theme-root"
    document.body.appendChild(host)
    try {
      render(<ConfirmDialog open title="Change password?" container={host} />)
      const dialog = screen.getByRole("dialog")
      expect(host.contains(dialog)).toBe(true)
      // Not portalled straight to body: the nearest body child is the host.
      let branch: HTMLElement = dialog
      while (branch.parentElement !== document.body) branch = branch.parentElement!
      expect(branch).toBe(host)
    } finally {
      host.remove()
    }
  })

  it('iconTreatment="none" renders no icon element', () => {
    render(<ConfirmDialog open title="Change password?" iconTreatment="none" />)
    const dialog = screen.getByRole("dialog")
    expect(dialog.querySelector('[data-slot="confirm-dialog-icon"]')).toBeNull()
    expect(dialog.querySelector('[data-slot="confirm-dialog-icon-plate"]')).toBeNull()
    expect(dialog.querySelector("svg")).not.toBeNull() // only the X close icon
    expect(dialog.querySelectorAll("svg")).toHaveLength(1)
  })

  it("showCloseButton={false} renders no close button, and Escape still closes", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <ConfirmDialog
        defaultOpen
        title="Change password?"
        showCloseButton={false}
        onOpenChange={onOpenChange}
      />
    )
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull()
    // Focus stays trapped on the dialog's own actions.
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true)
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it.each([
    ["Cancel", async (user: ReturnType<typeof userEvent.setup>) =>
      user.click(screen.getByRole("button", { name: "Cancel" }))],
    ["Escape", async (user: ReturnType<typeof userEvent.setup>) =>
      user.keyboard("{Escape}")],
  ])("onCloseAutoFocus returns focus to the consumer's target on %s", async (_, close) => {
    const user = userEvent.setup()
    function Host() {
      const inputRef = React.useRef<HTMLInputElement>(null)
      return (
        <>
          <input aria-label="Password" ref={inputRef} />
          <ConfirmDialog
            defaultOpen
            title="Change password?"
            onCloseAutoFocus={(e) => {
              e.preventDefault()
              inputRef.current?.focus()
            }}
          />
        </>
      )
    }
    render(<Host />)
    await close(user)
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Password" }))
  })

  it("shows the close button by default", () => {
    render(<ConfirmDialog open title="Delete?" />)
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument()
  })

  it.each(["info", "warning", "destructive"] as const)(
    "default props render the same DOM as before (%s)",
    (severity) => {
      const { baseElement } = render(
        <ConfirmDialog open title="Delete?" description="Gone for good." severity={severity} />
      )
      expect(normalizeIds(baseElement.innerHTML)).toMatchSnapshot()
    }
  )
})
