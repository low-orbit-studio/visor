import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { SaveStatus, type SaveStatusState } from "../save-status"
import { checkA11y } from "../../../../test-utils/a11y"

const LABELS: Array<[SaveStatusState, string]> = [
  ["saved", "Saved"],
  ["saving", "Saving"],
  ["unsaved", "Unsaved"],
  ["refused", "Couldn't save"],
]

describe("SaveStatus (VI-657)", () => {
  for (const [status, label] of LABELS) {
    it(`${status} reads "${label}" in a polite live region`, () => {
      render(<SaveStatus status={status} />)
      const region = screen.getByRole("status")
      expect(region).toHaveTextContent(label)
      expect(region).toHaveAttribute("aria-live", "polite")
      expect(region.closest("[data-slot=save-status]")).toHaveAttribute("data-state", status)
    })
  }

  it("is status text, not a button", () => {
    render(<SaveStatus status="saved" onRetry={() => {}} />)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("after a failed save, a retry mark calls onRetry", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<SaveStatus status="refused" onRetry={onRetry} />)
    await user.click(screen.getByRole("button", { name: "Retry saving" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("the retry mark sits outside the live region, so it is not announced with the status", () => {
    render(<SaveStatus status="refused" onRetry={() => {}} />)
    expect(screen.getByRole("status")).not.toContainElement(screen.getByRole("button"))
  })

  it("refused without onRetry shows no retry mark", () => {
    render(<SaveStatus status="refused" />)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("labels and retryLabel can be overridden", () => {
    render(<SaveStatus status="refused" onRetry={() => {}} labels={{ refused: "Nicht gespeichert" }} retryLabel="Erneut speichern" />)
    expect(screen.getByRole("status")).toHaveTextContent("Nicht gespeichert")
    expect(screen.getByRole("button", { name: "Erneut speichern" })).toBeInTheDocument()
  })

  it("passes axe in every state", async () => {
    for (const [status] of LABELS) {
      const { container, unmount } = render(<SaveStatus status={status} onRetry={() => {}} />)
      await checkA11y(container)
      unmount()
    }
  })
})
