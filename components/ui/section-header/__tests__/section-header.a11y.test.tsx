import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { SectionHeader } from "../section-header"

describe("SectionHeader a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (title only)", async () => {
    const { container } = render(<SectionHeader title="Activity" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (title + meta)", async () => {
    const { container } = render(
      <SectionHeader title="Tonight's events" meta="2 events" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (multiple stacked headers as div)", async () => {
    // When stacking many SectionHeaders on a page, callers should use
    // `as="div"` to avoid duplicate banner landmarks. The `<header>` default
    // is intentional for the canonical single-header-per-section use case.
    const { container } = render(
      <div>
        <SectionHeader as="div" title="Tonight's events" meta="2 events" />
        <SectionHeader as="div" title="Activity" meta="last hour" />
        <SectionHeader as="div" title="This week" />
        <SectionHeader as="div" title="Top promoters · 30d" />
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
