import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { FilterBar } from "../filter-bar"

describe("FilterBar", () => {
  it("renders a search input when onSearchChange is provided", () => {
    render(
      <FilterBar
        searchValue=""
        onSearchChange={() => {}}
        searchPlaceholder="Search users"
      />
    )
    expect(screen.getByPlaceholderText(/search users/i)).toBeInTheDocument()
  })

  it("omits the search input when onSearchChange is not provided", () => {
    const { container } = render(<FilterBar />)
    expect(
      container.querySelector('[data-slot="filter-bar-search"]')
    ).toBeNull()
    expect(container.querySelector('input[type="search"]')).toBeNull()
  })

  it("forwards search input changes to onSearchChange", () => {
    const onSearchChange = vi.fn()
    render(<FilterBar searchValue="" onSearchChange={onSearchChange} />)
    const input = screen.getByRole("searchbox")
    fireEvent.change(input, { target: { value: "ada" } })
    expect(onSearchChange).toHaveBeenCalledWith("ada")
  })

  it("renders children filter controls", () => {
    render(
      <FilterBar>
        <button type="button">Role filter</button>
        <button type="button">Status filter</button>
      </FilterBar>
    )
    expect(
      screen.getByRole("button", { name: /role filter/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /status filter/i })
    ).toBeInTheDocument()
  })

  it("renders active filter chips", () => {
    render(
      <FilterBar
        activeFilters={[
          { id: "role", label: "Role: Admin", onRemove: () => {} },
          { id: "status", label: "Status: Active", onRemove: () => {} },
        ]}
      />
    )
    expect(screen.getByText(/role: admin/i)).toBeInTheDocument()
    expect(screen.getByText(/status: active/i)).toBeInTheDocument()
  })

  it("does not render the chips row when activeFilters is empty", () => {
    const { container } = render(<FilterBar activeFilters={[]} />)
    expect(
      container.querySelector('[data-slot="filter-bar-chips"]')
    ).toBeNull()
  })

  it("fires onRemove when a chip remove button is clicked", () => {
    const onRemove = vi.fn()
    render(
      <FilterBar
        activeFilters={[
          { id: "role", label: "Role: Admin", onRemove },
        ]}
      />
    )
    fireEvent.click(
      screen.getByRole("button", { name: /remove filter: role: admin/i })
    )
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it("renders the clear-all button only when onClearAll is provided and filters are active", () => {
    const onClearAll = vi.fn()
    const { container, rerender } = render(
      <FilterBar onClearAll={onClearAll} activeFilters={[]} />
    )
    // No chips and empty search => no clear button
    expect(
      container.querySelector('[data-slot="filter-bar-clear"]')
    ).toBeNull()

    rerender(
      <FilterBar
        onClearAll={onClearAll}
        activeFilters={[{ id: "a", label: "A", onRemove: () => {} }]}
      />
    )
    expect(
      container.querySelector('[data-slot="filter-bar-clear"]')
    ).not.toBeNull()
  })

  it("renders clear-all when search has a value (even without chips)", () => {
    const { container } = render(
      <FilterBar
        searchValue="ada"
        onSearchChange={() => {}}
        onClearAll={() => {}}
      />
    )
    expect(
      container.querySelector('[data-slot="filter-bar-clear"]')
    ).not.toBeNull()
  })

  it("does not render clear-all when onClearAll is omitted", () => {
    const { container } = render(
      <FilterBar
        activeFilters={[{ id: "a", label: "A", onRemove: () => {} }]}
      />
    )
    expect(
      container.querySelector('[data-slot="filter-bar-clear"]')
    ).toBeNull()
  })

  it("fires onClearAll when the clear-all button is clicked", () => {
    const onClearAll = vi.fn()
    render(
      <FilterBar
        onClearAll={onClearAll}
        activeFilters={[{ id: "a", label: "A", onRemove: () => {} }]}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /clear all/i }))
    expect(onClearAll).toHaveBeenCalledTimes(1)
  })

  it("uses a custom clearLabel when provided", () => {
    render(
      <FilterBar
        clearLabel="Reset filters"
        onClearAll={() => {}}
        activeFilters={[{ id: "a", label: "A", onRemove: () => {} }]}
      />
    )
    expect(
      screen.getByRole("button", { name: /reset filters/i })
    ).toBeInTheDocument()
  })

  it("renders resultsCount with aria-live polite", () => {
    const { container } = render(<FilterBar resultsCount="42 results" />)
    const node = container.querySelector('[data-slot="filter-bar-results"]')
    expect(node).not.toBeNull()
    expect(node).toHaveTextContent("42 results")
    expect(node).toHaveAttribute("aria-live", "polite")
  })

  it("applies dense class when dense prop is true", () => {
    const { container } = render(<FilterBar dense />)
    const root = container.querySelector('[data-slot="filter-bar"]')
    expect(root?.className).toMatch(/dense/)
    expect(root).toHaveAttribute("data-dense", "true")
  })

  it('has role="search" on the root', () => {
    render(<FilterBar />)
    expect(screen.getByRole("search")).toBeInTheDocument()
  })

  it("passes through HTML attributes and className", () => {
    const { container } = render(
      <FilterBar
        id="filter-bar-root"
        aria-label="User filters"
        className="custom-class"
      />
    )
    const root = container.querySelector('[data-slot="filter-bar"]')
    expect(root).toHaveAttribute("id", "filter-bar-root")
    expect(root).toHaveAttribute("aria-label", "User filters")
    expect(root).toHaveClass("custom-class")
  })

  it("forwards ref to the root element", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<FilterBar ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.getAttribute("data-slot")).toBe("filter-bar")
  })
})
