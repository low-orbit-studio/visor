import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { ActivityFeed, ActivityFeedItem } from "../activity-feed"

describe("ActivityFeed a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (default variant, basic items)", async () => {
    const { container } = render(
      <ActivityFeed aria-label="Recent activity">
        <ActivityFeedItem title="Profile published" timestamp="2m ago" />
        <ActivityFeedItem title="Profile edited" timestamp="5m ago" />
      </ActivityFeed>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (compact variant)", async () => {
    const { container } = render(
      <ActivityFeed variant="compact" aria-label="Recent activity">
        <ActivityFeedItem title="One" timestamp="1m ago" />
        <ActivityFeedItem title="Two" timestamp="2m ago" />
      </ActivityFeed>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (timeline variant)", async () => {
    const { container } = render(
      <ActivityFeed variant="timeline" aria-label="Audit trail">
        <ActivityFeedItem title="Created" timestamp="10m ago" />
        <ActivityFeedItem title="Updated" timestamp="5m ago" />
        <ActivityFeedItem title="Published" timestamp="now" />
      </ActivityFeed>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (all slots populated)", async () => {
    const { container } = render(
      <ActivityFeed aria-label="Recent activity">
        <ActivityFeedItem
          leading={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect width="24" height="24" />
            </svg>
          }
          title="Profile published"
          description="All checks passed and the profile is now live."
          actor="Justin"
          timestamp={<time dateTime="2026-04-10T12:00:00Z">2m ago</time>}
          trailing={<span>Live</span>}
        />
      </ActivityFeed>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (empty feed, no items)", async () => {
    const { container } = render(<ActivityFeed aria-label="Empty feed" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
