import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { StatCard } from "../stat-card"

describe("StatCard a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (default)", async () => {
    const { container } = render(
      <StatCard label="Total Revenue" value="$48,120" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (size sm)", async () => {
    const { container } = render(
      <StatCard label="Active" value="892" size="sm" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (highlight)", async () => {
    const { container } = render(
      <StatCard label="Featured" value="1,204" variant="highlight" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (delta up)", async () => {
    const { container } = render(
      <StatCard
        label="Revenue"
        value="$10k"
        delta={{ value: "+12.4%", direction: "up", label: "vs last month" }}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (delta down)", async () => {
    const { container } = render(
      <StatCard
        label="Churn"
        value="3.2%"
        delta={{ value: "-0.4%", direction: "down", label: "vs last month" }}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (delta flat)", async () => {
    const { container } = render(
      <StatCard
        label="Signups"
        value="412"
        delta={{ value: "0%", direction: "flat" }}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (with trend)", async () => {
    const { container } = render(
      <StatCard
        label="Sessions"
        value="2,340"
        trend={
          <svg width="40" height="16" aria-hidden="true">
            <polyline
              fill="none"
              stroke="currentColor"
              points="0,12 10,8 20,10 30,4 40,6"
            />
          </svg>
        }
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (with footer link)", async () => {
    const { container } = render(
      <StatCard
        label="Active users"
        value="892"
        footer={<a href="/users">View all users</a>}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (valueAs hero)", async () => {
    const { container } = render(
      <StatCard label="RSVPs Tonight" value="1,248" valueAs="hero" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (valueAs compact)", async () => {
    const { container } = render(
      <StatCard label="Signups" value="412" valueAs="compact" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
