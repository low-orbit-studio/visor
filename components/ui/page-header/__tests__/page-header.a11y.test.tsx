import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { PageHeader } from "../page-header"

describe("PageHeader a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (title only)", async () => {
    const { container } = render(<PageHeader title="Customers" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (title + description)", async () => {
    const { container } = render(
      <PageHeader title="Customers" description="Manage your customers." />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (all slots)", async () => {
    const { container } = render(
      <PageHeader
        eyebrow="Blacklight Admin"
        title="Customers"
        description="Manage customer accounts, billing, and access."
        breadcrumb={
          <nav aria-label="Breadcrumb">
            <a href="/">Home</a>
          </nav>
        }
        actions={
          <>
            <button type="button">Export</button>
            <button type="button">New customer</button>
          </>
        }
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (h2 titleAs)", async () => {
    const { container } = render(
      <PageHeader as="section" titleAs="h2" title="Subsection" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
