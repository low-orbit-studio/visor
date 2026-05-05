import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { StatHero } from "../stat-hero"

const VALUES = [820000, 910000, 870000, 980000, 1050000, 1120000, 1240000]

describe("StatHero a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (default)", async () => {
    const { container } = render(
      <StatHero
        label="Monthly Recurring Revenue"
        value="$1,240,000"
        values={VALUES}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (delta up)", async () => {
    const { container } = render(
      <StatHero
        label="Monthly Recurring Revenue"
        value="$1,240,000"
        values={VALUES}
        delta={{ value: "+18.2%", direction: "up" }}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (delta down)", async () => {
    const { container } = render(
      <StatHero
        label="Churn Rate"
        value="3.2%"
        values={[5.1, 4.8, 4.5, 4.2, 3.8, 3.5, 3.2]}
        delta={{ value: "-0.4%", direction: "down" }}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (delta flat)", async () => {
    const { container } = render(
      <StatHero
        label="Active Users"
        value="12,400"
        values={[12200, 12350, 12300, 12400, 12380, 12390, 12400]}
        delta={{ value: "0%", direction: "flat" }}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (with caption)", async () => {
    const { container } = render(
      <StatHero
        label="Monthly Recurring Revenue"
        value="$1,240,000"
        values={VALUES}
        delta={{ value: "+18.2%", direction: "up" }}
        caption="vs same period last year"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (minimal — label + value + values only)", async () => {
    const { container } = render(
      <StatHero label="Revenue" value="$1M" values={[100, 200, 150, 300]} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (values.length < 2 — no SVG rendered)", async () => {
    const { container } = render(
      <StatHero label="Revenue" value="$1M" values={[100]} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
