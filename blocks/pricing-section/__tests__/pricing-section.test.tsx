import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { checkA11y } from "../../../test-utils/a11y"
import { PricingSection } from "../pricing-section"
import type { PricingTier } from "../pricing-section"

const mockTiers: PricingTier[] = [
  {
    name: "Basic",
    price: "$9",
    period: "/mo",
    description: "Great for individuals.",
    features: ["Up to 3 projects", "Basic analytics", "Email support"],
    buttonText: "Get Started",
    buttonHref: "/signup/basic",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For growing teams.",
    features: ["Unlimited projects", "Advanced analytics", "Priority support", "Custom domains"],
    buttonText: "Start Free Trial",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations.",
    features: ["Everything in Pro", "Dedicated support", "SLA guarantee", "Custom contracts"],
    buttonText: "Contact Sales",
    buttonHref: "/contact",
  },
]

describe("PricingSection", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    const { container } = render(<PricingSection tiers={mockTiers} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders section heading when provided", () => {
    render(<PricingSection tiers={mockTiers} heading="Simple Pricing" />)
    expect(screen.getByText("Simple Pricing")).toBeInTheDocument()
  })

  it("renders section description when provided", () => {
    render(
      <PricingSection
        tiers={mockTiers}
        heading="Simple Pricing"
        description="No hidden fees. Cancel anytime."
      />
    )
    expect(screen.getByText("No hidden fees. Cancel anytime.")).toBeInTheDocument()
  })

  it("does not render header section when heading and description are omitted", () => {
    const { container } = render(<PricingSection tiers={mockTiers} />)
    const header = container.querySelector(".header")
    expect(header).not.toBeInTheDocument()
  })

  // ─── Tier rendering ──────────────────────────────────────────────────

  it("renders all tier names", () => {
    render(<PricingSection tiers={mockTiers} />)
    expect(screen.getByText("Basic")).toBeInTheDocument()
    expect(screen.getByText("Pro")).toBeInTheDocument()
    expect(screen.getByText("Enterprise")).toBeInTheDocument()
  })

  it("renders tier prices", () => {
    render(<PricingSection tiers={mockTiers} />)
    expect(screen.getByText("$9")).toBeInTheDocument()
    expect(screen.getByText("$29")).toBeInTheDocument()
    expect(screen.getByText("Custom")).toBeInTheDocument()
  })

  it("renders tier period when provided", () => {
    render(<PricingSection tiers={mockTiers} />)
    const periods = screen.getAllByText("/mo")
    expect(periods).toHaveLength(2)
  })

  it("renders tier description when provided", () => {
    render(<PricingSection tiers={mockTiers} />)
    expect(screen.getByText("Great for individuals.")).toBeInTheDocument()
    expect(screen.getByText("For growing teams.")).toBeInTheDocument()
    expect(screen.getByText("For large organizations.")).toBeInTheDocument()
  })

  // ─── Feature list ────────────────────────────────────────────────────

  it("renders feature items for each tier", () => {
    render(<PricingSection tiers={mockTiers} />)
    expect(screen.getByText("Up to 3 projects")).toBeInTheDocument()
    expect(screen.getByText("Unlimited projects")).toBeInTheDocument()
    expect(screen.getByText("Everything in Pro")).toBeInTheDocument()
  })

  it("renders check icons for each feature item", () => {
    const { container } = render(<PricingSection tiers={mockTiers} />)
    // All features across all tiers: 3 + 4 + 4 = 11
    const featureItems = container.querySelectorAll("[class*='featureItem']")
    expect(featureItems.length).toBe(11)
  })

  // ─── Highlighted tier ────────────────────────────────────────────────

  it("applies highlighted class to the highlighted tier", () => {
    const { container } = render(<PricingSection tiers={mockTiers} />)
    const cards = container.querySelectorAll("[data-slot='card']")
    const highlighted = Array.from(cards).find((card) =>
      card.className.includes("tierHighlighted")
    )
    expect(highlighted).toBeInTheDocument()
  })

  it("does not apply highlighted class to non-highlighted tiers", () => {
    const { container } = render(<PricingSection tiers={mockTiers} />)
    const cards = container.querySelectorAll("[data-slot='card']")
    const nonHighlighted = Array.from(cards).filter(
      (card) => !card.className.includes("tierHighlighted")
    )
    expect(nonHighlighted).toHaveLength(2)
  })

  // ─── Badge ───────────────────────────────────────────────────────────

  it("renders badge on highlighted tier", () => {
    render(<PricingSection tiers={mockTiers} />)
    expect(screen.getByText("Most Popular")).toBeInTheDocument()
  })

  it("does not render badge when not provided", () => {
    const tiersNoBadge = mockTiers.map((t) => ({ ...t, badge: undefined }))
    render(<PricingSection tiers={tiersNoBadge} />)
    expect(screen.queryByText("Most Popular")).not.toBeInTheDocument()
  })

  // ─── Button as link ──────────────────────────────────────────────────

  it("renders button as anchor when buttonHref is provided", () => {
    render(<PricingSection tiers={mockTiers} />)
    const basicLink = screen.getByRole("link", { name: "Get Started" })
    expect(basicLink).toHaveAttribute("href", "/signup/basic")
  })

  it("renders button element when no buttonHref", () => {
    render(<PricingSection tiers={mockTiers} />)
    expect(screen.getByRole("button", { name: "Start Free Trial" })).toBeInTheDocument()
  })

  // ─── Click callback ──────────────────────────────────────────────────

  it("calls onButtonClick when button is clicked", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    const tiersWithCallback: PricingTier[] = [
      {
        name: "Pro",
        price: "$29",
        period: "/mo",
        features: ["Unlimited projects"],
        buttonText: "Buy Now",
        onButtonClick: handleClick,
        highlighted: true,
      },
    ]
    render(<PricingSection tiers={tiersWithCallback} />)
    await user.click(screen.getByRole("button", { name: "Buy Now" }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  // ─── Highlighted button variant ──────────────────────────────────────

  it("uses default variant for highlighted tier button", () => {
    const { container } = render(<PricingSection tiers={mockTiers} />)
    // The highlighted tier's button should not have outline variant class
    const button = screen.getByRole("button", { name: "Start Free Trial" })
    expect(button).not.toHaveAttribute("data-variant", "outline")
  })

  // ─── className passthrough ───────────────────────────────────────────

  it("applies custom className to the root element", () => {
    const { container } = render(
      <PricingSection tiers={mockTiers} className="custom-class" />
    )
    expect(container.firstChild).toHaveClass("custom-class")
  })

  // ─── Edge cases ──────────────────────────────────────────────────────

  it("renders empty tiers array without crashing", () => {
    const { container } = render(<PricingSection tiers={[]} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders a single tier without crashing", () => {
    render(<PricingSection tiers={[mockTiers[0]]} />)
    expect(screen.getByText("Basic")).toBeInTheDocument()
  })

  // ─── A11y ────────────────────────────────────────────────────────────

  it("passes accessibility checks", async () => {
    const { container } = render(
      <PricingSection
        heading="Simple Pricing"
        description="No hidden fees. Cancel anytime."
        tiers={mockTiers}
      />
    )
    await checkA11y(container)
  })

  it("passes accessibility checks with link buttons", async () => {
    const tiersWithLinks: PricingTier[] = mockTiers.map((t) => ({
      ...t,
      buttonHref: `/signup/${t.name.toLowerCase()}`,
    }))
    const { container } = render(
      <PricingSection
        heading="Choose Your Plan"
        tiers={tiersWithLinks}
      />
    )
    await checkA11y(container)
  })
})
