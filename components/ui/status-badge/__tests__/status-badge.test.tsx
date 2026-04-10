import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { StatusBadge, statusBadgeLabels, type StatusBadgeStatus } from "../status-badge"

const STATUSES: StatusBadgeStatus[] = [
  "healthy",
  "degraded",
  "down",
  "failed",
  "running",
  "pending",
  "queued",
  "idle",
  "complete",
]

describe("StatusBadge", () => {
  it("renders the default label for every status", () => {
    for (const status of STATUSES) {
      const { container, unmount } = render(<StatusBadge status={status} />)
      expect(container.textContent).toContain(statusBadgeLabels[status])
      unmount()
    }
  })

  it("renders a custom label when provided", () => {
    render(<StatusBadge status="healthy" label="All systems nominal" />)
    expect(screen.getByText("All systems nominal")).toBeInTheDocument()
    expect(screen.queryByText("Healthy")).toBeNull()
  })

  it("renders the indicator dot by default", () => {
    const { container } = render(<StatusBadge status="healthy" />)
    expect(
      container.querySelector('[data-slot="status-badge-indicator"]')
    ).not.toBeNull()
  })

  it("hides the indicator when indicator=false", () => {
    const { container } = render(
      <StatusBadge status="healthy" indicator={false} />
    )
    expect(
      container.querySelector('[data-slot="status-badge-indicator"]')
    ).toBeNull()
  })

  it("applies a pulse class on the indicator when pulse=true", () => {
    const { container } = render(<StatusBadge status="running" pulse />)
    const dot = container.querySelector(
      '[data-slot="status-badge-indicator"]'
    ) as HTMLElement | null
    expect(dot).not.toBeNull()
    // The pulse modifier class name will contain the word "pulse" thanks
    // to CSS Modules hashing that preserves the local name as a prefix.
    expect(dot?.className).toMatch(/pulse/)
  })

  it("does not apply the pulse class when pulse=false", () => {
    const { container } = render(<StatusBadge status="running" />)
    const dot = container.querySelector(
      '[data-slot="status-badge-indicator"]'
    ) as HTMLElement | null
    expect(dot?.className ?? "").not.toMatch(/pulse/)
  })

  it("maps status to the correct subtle Badge variant", () => {
    const cases: Array<[StatusBadgeStatus, string]> = [
      ["healthy", "success"],
      ["complete", "success"],
      ["degraded", "warning"],
      ["pending", "warning"],
      ["down", "destructive"],
      ["failed", "destructive"],
      ["running", "info"],
      ["queued", "secondary"],
      ["idle", "secondary"],
    ]
    for (const [status, expectedVariant] of cases) {
      const { container, unmount } = render(<StatusBadge status={status} />)
      const root = container.querySelector('[data-slot="status-badge"]')
      expect(root).toHaveAttribute("data-variant", expectedVariant)
      expect(root).toHaveAttribute("data-status", status)
      unmount()
    }
  })

  it("uses filled Badge variants when tone=filled", () => {
    const cases: Array<[StatusBadgeStatus, string]> = [
      ["healthy", "filled-success"],
      ["complete", "filled-success"],
      ["degraded", "filled-warning"],
      ["pending", "filled-warning"],
      ["down", "filled-destructive"],
      ["failed", "filled-destructive"],
      ["running", "filled-info"],
      // No filled-secondary exists — neutral statuses fall back to secondary.
      ["queued", "secondary"],
      ["idle", "secondary"],
    ]
    for (const [status, expectedVariant] of cases) {
      const { container, unmount } = render(
        <StatusBadge status={status} tone="filled" />
      )
      const root = container.querySelector('[data-slot="status-badge"]')
      expect(root).toHaveAttribute("data-variant", expectedVariant)
      expect(root).toHaveAttribute("data-tone", "filled")
      unmount()
    }
  })

  it('includes a visually hidden "Status:" prefix for screen readers', () => {
    const { container } = render(<StatusBadge status="healthy" />)
    // The visible label is "Healthy"; the DOM also contains "Status: "
    // inside a visually-hidden span so the full announcement reads
    // "Status: Healthy".
    expect(container.textContent).toContain("Status:")
    expect(container.textContent).toContain("Healthy")
  })

  it("passes through HTML attributes and custom classNames", () => {
    const { container } = render(
      <StatusBadge
        status="healthy"
        id="svc-api"
        aria-label="API status"
        className="custom-class"
        title="hovered"
      />
    )
    const root = container.querySelector('[data-slot="status-badge"]')
    expect(root).toHaveAttribute("id", "svc-api")
    expect(root).toHaveAttribute("aria-label", "API status")
    expect(root).toHaveAttribute("title", "hovered")
    expect(root).toHaveClass("custom-class")
  })

  it("forwards ref to the underlying Badge element", () => {
    const ref = { current: null as HTMLSpanElement | null }
    render(<StatusBadge ref={ref} status="healthy" />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("SPAN")
  })
})
