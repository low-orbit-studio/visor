import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ActivityFeed, ActivityFeedItem } from "../activity-feed"

describe("ActivityFeed", () => {
  it("renders an ordered list root", () => {
    const { container } = render(
      <ActivityFeed>
        <ActivityFeedItem title="Did a thing" timestamp="2m ago" />
      </ActivityFeed>
    )
    const root = container.querySelector('[data-slot="activity-feed"]')
    expect(root).not.toBeNull()
    expect(root?.tagName).toBe("OL")
  })

  it("renders items with title and timestamp", () => {
    render(
      <ActivityFeed>
        <ActivityFeedItem title="Profile published" timestamp="2m ago" />
      </ActivityFeed>
    )
    expect(screen.getByText(/profile published/i)).toBeInTheDocument()
    expect(screen.getByText(/2m ago/i)).toBeInTheDocument()
  })

  it("renders items as <li> elements", () => {
    const { container } = render(
      <ActivityFeed>
        <ActivityFeedItem title="One" timestamp="1m ago" />
        <ActivityFeedItem title="Two" timestamp="2m ago" />
      </ActivityFeed>
    )
    const items = container.querySelectorAll('[data-slot="activity-feed-item"]')
    expect(items).toHaveLength(2)
    items.forEach((el) => expect(el.tagName).toBe("LI"))
  })

  it("renders the leading slot", () => {
    const { container } = render(
      <ActivityFeed>
        <ActivityFeedItem
          leading={<svg data-testid="leading-icon" />}
          title="Did it"
          timestamp="now"
        />
      </ActivityFeed>
    )
    expect(screen.getByTestId("leading-icon")).toBeInTheDocument()
    expect(
      container.querySelector('[data-slot="activity-feed-leading"]')
    ).not.toBeNull()
  })

  it("renders the description when provided", () => {
    render(
      <ActivityFeed>
        <ActivityFeedItem
          title="Profile edited"
          description="Updated bio and avatar"
          timestamp="5m ago"
        />
      </ActivityFeed>
    )
    expect(screen.getByText(/updated bio and avatar/i)).toBeInTheDocument()
  })

  it("does not render description slot when omitted", () => {
    const { container } = render(
      <ActivityFeed>
        <ActivityFeedItem title="No desc" timestamp="now" />
      </ActivityFeed>
    )
    expect(
      container.querySelector('[data-slot="activity-feed-description"]')
    ).toBeNull()
  })

  it("renders the actor slot", () => {
    render(
      <ActivityFeed>
        <ActivityFeedItem
          title="Deleted record"
          actor="Justin"
          timestamp="1m ago"
        />
      </ActivityFeed>
    )
    expect(screen.getByText("Justin")).toBeInTheDocument()
  })

  it("renders the trailing slot", () => {
    render(
      <ActivityFeed>
        <ActivityFeedItem
          title="Published"
          timestamp="now"
          trailing={<span data-testid="badge">Live</span>}
        />
      </ActivityFeed>
    )
    expect(screen.getByTestId("badge")).toBeInTheDocument()
  })

  it("applies compact variant class", () => {
    const { container } = render(
      <ActivityFeed variant="compact">
        <ActivityFeedItem title="A" timestamp="now" />
      </ActivityFeed>
    )
    const root = container.querySelector('[data-slot="activity-feed"]')
    expect(root?.className).toMatch(/variantCompact/)
    expect(root).toHaveAttribute("data-variant", "compact")
  })

  it("applies timeline variant class", () => {
    const { container } = render(
      <ActivityFeed variant="timeline">
        <ActivityFeedItem title="A" timestamp="now" />
      </ActivityFeed>
    )
    const root = container.querySelector('[data-slot="activity-feed"]')
    expect(root?.className).toMatch(/variantTimeline/)
    expect(root).toHaveAttribute("data-variant", "timeline")
  })

  it("propagates variant to items via context", () => {
    const { container } = render(
      <ActivityFeed variant="compact">
        <ActivityFeedItem title="A" timestamp="now" />
      </ActivityFeed>
    )
    const item = container.querySelector('[data-slot="activity-feed-item"]')
    expect(item).toHaveAttribute("data-variant", "compact")
    expect(item?.className).toMatch(/variantCompact/)
  })

  it("defaults to 'default' variant when no feed context is present", () => {
    const { container } = render(
      <ActivityFeedItem title="Solo" timestamp="now" />
    )
    const item = container.querySelector('[data-slot="activity-feed-item"]')
    expect(item).toHaveAttribute("data-variant", "default")
  })

  it("passes through HTML attributes and className to the root", () => {
    const { container } = render(
      <ActivityFeed
        id="feed-1"
        aria-label="Recent activity"
        className="custom"
      >
        <ActivityFeedItem title="A" timestamp="now" />
      </ActivityFeed>
    )
    const root = container.querySelector('[data-slot="activity-feed"]')
    expect(root).toHaveAttribute("id", "feed-1")
    expect(root).toHaveAttribute("aria-label", "Recent activity")
    expect(root).toHaveClass("custom")
  })

  it("passes through HTML attributes to items", () => {
    const { container } = render(
      <ActivityFeed>
        <ActivityFeedItem
          id="item-1"
          data-testid="item"
          title="A"
          timestamp="now"
        />
      </ActivityFeed>
    )
    const item = container.querySelector('[data-slot="activity-feed-item"]')
    expect(item).toHaveAttribute("id", "item-1")
    expect(item).toHaveAttribute("data-testid", "item")
  })

  it("forwards ref on the root", () => {
    const ref = { current: null as HTMLOListElement | null }
    render(
      <ActivityFeed ref={ref}>
        <ActivityFeedItem title="A" timestamp="now" />
      </ActivityFeed>
    )
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("OL")
  })

  it("forwards ref on items", () => {
    const ref = { current: null as HTMLLIElement | null }
    render(
      <ActivityFeed>
        <ActivityFeedItem ref={ref} title="A" timestamp="now" />
      </ActivityFeed>
    )
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("LI")
  })

  it("exposes ActivityFeed.Item as a dot-notation alias", () => {
    expect(ActivityFeed.Item).toBe(ActivityFeedItem)
    render(
      <ActivityFeed>
        <ActivityFeed.Item title="Dot notation" timestamp="now" />
      </ActivityFeed>
    )
    expect(screen.getByText(/dot notation/i)).toBeInTheDocument()
  })

  it("renders an empty feed without items", () => {
    const { container } = render(<ActivityFeed aria-label="Empty feed" />)
    const root = container.querySelector('[data-slot="activity-feed"]')
    expect(root).not.toBeNull()
    expect(
      root?.querySelectorAll('[data-slot="activity-feed-item"]')
    ).toHaveLength(0)
  })
})
