import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { SaveStatus, type SaveStatusState } from "../save-status"
import { checkA11y } from "../../../../test-utils/a11y"

const LABELS: Array<[SaveStatusState, string]> = [
  ["saved", "Saved"],
  ["saving", "Saving"],
  ["syncing", "Syncing"],
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

  it("syncing takes a labels.syncing override", () => {
    render(<SaveStatus status="syncing" labels={{ syncing: "Syncing from RA" }} />)
    expect(screen.getByRole("status")).toHaveTextContent("Syncing from RA")
  })

  it("syncing is never a retry state", () => {
    render(<SaveStatus status="syncing" onRetry={() => {}} />)
    expect(screen.queryByRole("button")).toBeNull()
  })

  describe("unsavedAs=\"dot\"", () => {
    it("draws a dot and keeps the label as the accessible name in the live region", () => {
      const { container } = render(<SaveStatus status="unsaved" unsavedAs="dot" />)
      const dot = container.querySelector("[data-slot=save-status-dot]")
      expect(dot).toHaveAttribute("aria-hidden", "true")
      const region = screen.getByRole("status")
      expect(region).toHaveTextContent("Unsaved")
      expect(region).toHaveAttribute("aria-live", "polite")
      expect(container.querySelector("[data-slot=save-status]")).toHaveAttribute("data-as", "dot")
    })

    it("the dot's accessible name follows labels.unsaved", () => {
      render(<SaveStatus status="unsaved" unsavedAs="dot" labels={{ unsaved: "Unsaved changes" }} />)
      expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes")
    })

    it("text stays the default: no dot", () => {
      const { container } = render(<SaveStatus status="unsaved" />)
      expect(container.querySelector("[data-slot=save-status-dot]")).toBeNull()
    })

    it("only unsaved becomes a dot", () => {
      const { container } = render(<SaveStatus status="saving" unsavedAs="dot" />)
      expect(container.querySelector("[data-slot=save-status-dot]")).toBeNull()
    })

    it("passes axe", async () => {
      const { container } = render(<SaveStatus status="unsaved" unsavedAs="dot" />)
      await checkA11y(container)
    })
  })

  it("passes axe in every state", async () => {
    for (const [status] of LABELS) {
      const { container, unmount } = render(<SaveStatus status={status} onRetry={() => {}} />)
      await checkA11y(container)
      unmount()
    }
  })
})
