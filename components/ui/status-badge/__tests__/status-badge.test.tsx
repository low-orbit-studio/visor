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
  "live",
  "warn",
  "scheduled",
  "sold",
  "draft",
  "prospect",
  "pitched",
  "contracted",
  "active",
  "paused",
  "completed",
  "archived",
]

const NEW_ADMIN_EVENT_STATUSES: StatusBadgeStatus[] = [
  "live",
  "warn",
  "scheduled",
  "sold",
  "draft",
]

const CRM_STATUSES: StatusBadgeStatus[] = [
  "prospect",
  "pitched",
  "contracted",
  "active",
  "paused",
  "completed",
  "archived",
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

  it("applies the mono label face when mono=true (VI-620)", () => {
    const { container } = render(<StatusBadge status="live" mono />)
    const label = container.querySelector('[data-slot="status-badge-label"]')
    expect(label).not.toBeNull()
    expect(label).toHaveAttribute("data-mono", "true")
    expect(label?.className).toMatch(/labelMono/)
  })

  it("leaves the label unstyled when mono is omitted (default)", () => {
    const { container } = render(<StatusBadge status="live" />)
    const label = container.querySelector('[data-slot="status-badge-label"]')
    expect(label).not.toHaveAttribute("data-mono")
    expect(label?.className ?? "").not.toMatch(/labelMono/)
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
      ["queued", "neutral"],
      ["idle", "neutral"],
      // Admin-ui event tones
      ["live", "success"],
      ["warn", "warning"],
      ["scheduled", "info"],
      ["sold", "success"],
      ["draft", "neutral"],
      // CRM / pipeline stages
      ["prospect", "info"],
      ["pitched", "warning"],
      ["contracted", "success"],
      ["active", "success"],
      ["paused", "warning"],
      ["completed", "success"],
      ["archived", "neutral"],
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
      // Neutral statuses use the filled-neutral variant (solid gray fill).
      ["queued", "filled-neutral"],
      ["idle", "filled-neutral"],
      // Admin-ui event tones
      ["live", "filled-success"],
      ["warn", "filled-warning"],
      ["scheduled", "filled-info"],
      ["sold", "filled-success"],
      ["draft", "filled-neutral"],
      // CRM / pipeline stages
      ["prospect", "filled-info"],
      ["pitched", "filled-warning"],
      ["contracted", "filled-success"],
      ["active", "filled-success"],
      ["paused", "filled-warning"],
      ["completed", "filled-success"],
      ["archived", "filled-neutral"],
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

  it("renders each admin-ui event tone with the correct data-status attribute", () => {
    for (const status of NEW_ADMIN_EVENT_STATUSES) {
      const { container, unmount } = render(<StatusBadge status={status} />)
      const root = container.querySelector('[data-slot="status-badge"]')
      expect(root).toHaveAttribute("data-status", status)
      expect(container.textContent).toContain(statusBadgeLabels[status])
      unmount()
    }
  })

  it("maps scheduled to the info group, distinct from draft's neutral grey", () => {
    // scheduled is an upcoming/committed state, not a muted draft — it must
    // render blue (info), not grey (neutral). See VI-607.
    const scheduled = render(<StatusBadge status="scheduled" />)
    expect(
      scheduled.container.querySelector('[data-slot="status-badge"]')
    ).toHaveAttribute("data-variant", "info")
    scheduled.unmount()

    const draft = render(<StatusBadge status="draft" />)
    expect(
      draft.container.querySelector('[data-slot="status-badge"]')
    ).toHaveAttribute("data-variant", "neutral")
    draft.unmount()
  })

  it("renders each CRM pipeline status with the correct data-status attribute", () => {
    for (const status of CRM_STATUSES) {
      const { container, unmount } = render(<StatusBadge status={status} />)
      const root = container.querySelector('[data-slot="status-badge"]')
      expect(root).toHaveAttribute("data-status", status)
      expect(container.textContent).toContain(statusBadgeLabels[status])
      unmount()
    }
  })
})
