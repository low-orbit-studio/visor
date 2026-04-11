import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { StatCard } from "../stat-card"

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Total Revenue" value="$48,120" />)
    expect(screen.getByText("Total Revenue")).toBeInTheDocument()
    expect(screen.getByText("$48,120")).toBeInTheDocument()
  })

  it("renders as an <article> element by default", () => {
    const { container } = render(<StatCard label="Users" value="1,204" />)
    const root = container.querySelector('[data-slot="stat-card"]')
    expect(root?.tagName).toBe("ARTICLE")
  })

  it("renders an upward delta with accessible text", () => {
    const { container } = render(
      <StatCard
        label="Revenue"
        value="$10k"
        delta={{ value: "+12.4%", direction: "up", label: "vs last month" }}
      />
    )
    const delta = container.querySelector('[data-slot="stat-card-delta"]')
    expect(delta).not.toBeNull()
    expect(delta).toHaveAttribute("data-direction", "up")
    expect(delta?.textContent).toContain("+12.4%")
    expect(delta?.textContent).toContain("vs last month")
    // Accessible direction word present in the DOM (visually hidden).
    expect(delta?.textContent).toContain("up")
  })

  it("renders a downward delta with accessible text", () => {
    const { container } = render(
      <StatCard
        label="Churn"
        value="3.2%"
        delta={{ value: "-0.4%", direction: "down" }}
      />
    )
    const delta = container.querySelector('[data-slot="stat-card-delta"]')
    expect(delta).toHaveAttribute("data-direction", "down")
    expect(delta?.textContent).toContain("-0.4%")
    expect(delta?.textContent).toContain("down")
  })

  it("renders a flat delta with accessible text", () => {
    const { container } = render(
      <StatCard
        label="Signups"
        value="412"
        delta={{ value: "0%", direction: "flat" }}
      />
    )
    const delta = container.querySelector('[data-slot="stat-card-delta"]')
    expect(delta).toHaveAttribute("data-direction", "flat")
    expect(delta?.textContent).toContain("flat")
  })

  it("renders the trend slot", () => {
    const { container } = render(
      <StatCard
        label="Sessions"
        value="2,340"
        trend={<svg data-testid="sparkline" />}
      />
    )
    expect(
      container.querySelector('[data-slot="stat-card-trend"]')
    ).not.toBeNull()
    expect(screen.getByTestId("sparkline")).toBeInTheDocument()
  })

  it("renders the footer slot", () => {
    const { container } = render(
      <StatCard
        label="Active"
        value="892"
        footer={<a href="/users">View users</a>}
      />
    )
    const footer = container.querySelector('[data-slot="stat-card-footer"]')
    expect(footer).not.toBeNull()
    expect(screen.getByRole("link", { name: /view users/i })).toBeInTheDocument()
  })

  it("omits optional slots when not provided", () => {
    const { container } = render(<StatCard label="Only" value="1" />)
    expect(
      container.querySelector('[data-slot="stat-card-delta"]')
    ).toBeNull()
    expect(
      container.querySelector('[data-slot="stat-card-trend"]')
    ).toBeNull()
    expect(
      container.querySelector('[data-slot="stat-card-footer"]')
    ).toBeNull()
  })

  it("applies the sm size", () => {
    const { container } = render(
      <StatCard label="Compact" value="42" size="sm" />
    )
    const root = container.querySelector('[data-slot="stat-card"]')
    expect(root).toHaveAttribute("data-size", "sm")
  })

  it("defaults to the md size", () => {
    const { container } = render(<StatCard label="Default" value="100" />)
    const root = container.querySelector('[data-slot="stat-card"]')
    expect(root).toHaveAttribute("data-size", "md")
  })

  it("applies the highlight variant", () => {
    const { container } = render(
      <StatCard label="Featured" value="100" variant="highlight" />
    )
    const root = container.querySelector('[data-slot="stat-card"]')
    expect(root).toHaveAttribute("data-variant", "highlight")
  })

  it("passes through HTML attributes", () => {
    const { container } = render(
      <StatCard
        label="X"
        value="1"
        id="kpi-revenue"
        aria-label="Revenue metric"
        className="custom-class"
      />
    )
    const root = container.querySelector('[data-slot="stat-card"]')
    expect(root).toHaveAttribute("id", "kpi-revenue")
    expect(root).toHaveAttribute("aria-label", "Revenue metric")
    expect(root).toHaveClass("custom-class")
  })

  it("respects the as prop for root element", () => {
    const { container } = render(
      <StatCard as="section" label="Section" value="1" />
    )
    const root = container.querySelector('[data-slot="stat-card"]')
    expect(root?.tagName).toBe("SECTION")
  })

  it("forwards ref to the root element", () => {
    const ref = { current: null as HTMLElement | null }
    render(<StatCard ref={ref} label="Ref" value="9" />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("ARTICLE")
  })
})
