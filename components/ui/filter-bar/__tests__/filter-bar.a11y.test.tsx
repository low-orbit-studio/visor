import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { FilterBar } from "../filter-bar"

describe("FilterBar a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (empty)", async () => {
    const { container } = render(<FilterBar aria-label="Filters" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (with search)", async () => {
    const { container } = render(
      <FilterBar
        aria-label="Filters"
        searchValue=""
        onSearchChange={() => {}}
        searchPlaceholder="Search users"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (with active chips)", async () => {
    const { container } = render(
      <FilterBar
        aria-label="Filters"
        activeFilters={[
          { id: "role", label: "Role: Admin", onRemove: () => {} },
          { id: "status", label: "Status: Active", onRemove: () => {} },
        ]}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (with clear-all)", async () => {
    const { container } = render(
      <FilterBar
        aria-label="Filters"
        searchValue="ada"
        onSearchChange={() => {}}
        onClearAll={() => {}}
        activeFilters={[
          { id: "role", label: "Role: Admin", onRemove: () => {} },
        ]}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (with results count)", async () => {
    const { container } = render(
      <FilterBar
        aria-label="Filters"
        searchValue=""
        onSearchChange={() => {}}
        resultsCount="42 results"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
