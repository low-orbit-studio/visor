import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { StatusBadge, type StatusBadgeStatus } from "../status-badge"

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

describe("StatusBadge a11y (vitest-axe)", () => {
  for (const status of STATUSES) {
    it(`has no WCAG 2.1 AA violations (status=${status}, tone=subtle)`, async () => {
      const { container } = render(<StatusBadge status={status} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it(`has no WCAG 2.1 AA violations (status=${status}, tone=filled)`, async () => {
      const { container } = render(
        <StatusBadge status={status} tone="filled" />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it(`has no WCAG 2.1 AA violations (status=${status}, pulse)`, async () => {
      const { container } = render(<StatusBadge status={status} pulse />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  }

  it("has no WCAG 2.1 AA violations when the indicator is hidden", async () => {
    const { container } = render(
      <StatusBadge status="healthy" indicator={false} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations with a custom label", async () => {
    const { container } = render(
      <StatusBadge status="running" label="Build in progress" pulse />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
