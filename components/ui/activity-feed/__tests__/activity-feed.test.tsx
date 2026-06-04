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

describe("ActivityFeed compact-3col variant", () => {
  it("applies compact-3col variant class and data-variant attribute", () => {
    const { container } = render(
      <ActivityFeed variant="compact-3col">
        <ActivityFeedItem title="A" timestamp="now" />
      </ActivityFeed>
    )
    const root = container.querySelector('[data-slot="activity-feed"]')
    expect(root?.className).toMatch(/variantCompact3col/)
    expect(root).toHaveAttribute("data-variant", "compact-3col")
  })

  it("propagates compact-3col variant to items via context", () => {
    const { container } = render(
      <ActivityFeed variant="compact-3col">
        <ActivityFeedItem title="A" timestamp="now" />
      </ActivityFeed>
    )
    const item = container.querySelector('[data-slot="activity-feed-item"]')
    expect(item).toHaveAttribute("data-variant", "compact-3col")
    expect(item?.className).toMatch(/variantCompact3col/)
  })

  it("renders timestamp in col-1 slot (timestampCol class) in compact-3col", () => {
    const { container } = render(
      <ActivityFeed variant="compact-3col">
        <ActivityFeedItem title="Did a thing" timestamp="2m ago" />
      </ActivityFeed>
    )
    const timestampEl = container.querySelector(
      '[data-slot="activity-feed-timestamp"]'
    )
    expect(timestampEl).not.toBeNull()
    expect(timestampEl?.className).toMatch(/timestampCol/)
    expect(timestampEl?.textContent).toBe("2m ago")
  })

  it("renders leading in col-2 slot (leadingCol class) in compact-3col", () => {
    const { container } = render(
      <ActivityFeed variant="compact-3col">
        <ActivityFeedItem
          leading={<svg data-testid="dot" />}
          title="Did a thing"
          timestamp="2m ago"
        />
      </ActivityFeed>
    )
    const leadingEl = container.querySelector(
      '[data-slot="activity-feed-leading"]'
    )
    expect(leadingEl).not.toBeNull()
    expect(leadingEl?.className).toMatch(/leadingCol/)
    expect(screen.getByTestId("dot")).toBeInTheDocument()
  })

  it("renders header in col-3 slot (headerCol class) in compact-3col", () => {
    const { container } = render(
      <ActivityFeed variant="compact-3col">
        <ActivityFeedItem title="Did a thing" actor="Justin" timestamp="2m ago" />
      </ActivityFeed>
    )
    const headerEl = container.querySelector(
      '[data-slot="activity-feed-header"]'
    )
    expect(headerEl).not.toBeNull()
    expect(headerEl?.className).toMatch(/headerCol/)
  })

  it("does not render the body wrapper in compact-3col", () => {
    const { container } = render(
      <ActivityFeed variant="compact-3col">
        <ActivityFeedItem title="Did a thing" timestamp="2m ago" />
      </ActivityFeed>
    )
    expect(
      container.querySelector('[data-slot="activity-feed-body"]')
    ).toBeNull()
  })

  it("renders title and actor in compact-3col header", () => {
    render(
      <ActivityFeed variant="compact-3col">
        <ActivityFeedItem title="Record deleted" actor="System" timestamp="5m ago" />
      </ActivityFeed>
    )
    expect(screen.getByText("Record deleted")).toBeInTheDocument()
    expect(screen.getByText("System")).toBeInTheDocument()
  })

  it("renders trailing slot in compact-3col", () => {
    render(
      <ActivityFeed variant="compact-3col">
        <ActivityFeedItem
          title="Published"
          timestamp="now"
          trailing={<span data-testid="badge-3col">Live</span>}
        />
      </ActivityFeed>
    )
    expect(screen.getByTestId("badge-3col")).toBeInTheDocument()
  })

  it("does not regress default variant when compact-3col is also used", () => {
    const { container } = render(
      <>
        <ActivityFeed variant="default" aria-label="default feed">
          <ActivityFeedItem title="Default item" timestamp="1m ago" />
        </ActivityFeed>
        <ActivityFeed variant="compact-3col" aria-label="3col feed">
          <ActivityFeedItem title="3col item" timestamp="2m ago" />
        </ActivityFeed>
      </>
    )
    const defaultFeed = container.querySelector(
      '[aria-label="default feed"]'
    )
    const col3Feed = container.querySelector('[aria-label="3col feed"]')
    expect(defaultFeed).toHaveAttribute("data-variant", "default")
    expect(col3Feed).toHaveAttribute("data-variant", "compact-3col")
    // default feed should still have body wrapper
    expect(
      defaultFeed?.querySelector('[data-slot="activity-feed-body"]')
    ).not.toBeNull()
    // 3col feed should NOT have body wrapper
    expect(
      col3Feed?.querySelector('[data-slot="activity-feed-body"]')
    ).toBeNull()
  })
})
