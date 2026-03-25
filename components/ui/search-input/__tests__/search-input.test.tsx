import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { checkA11y } from "../../../../test-utils/a11y"
import { SearchInput } from "../search-input"

describe("SearchInput", () => {
  it("renders with placeholder", () => {
    render(<SearchInput placeholder="Search..." />)
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument()
  })

  it("renders search icon", () => {
    render(<SearchInput aria-label="Search" />)
    const wrapper = screen.getByRole("searchbox").closest("[data-slot='search-input']")
    expect(wrapper).toBeInTheDocument()
  })

  it("shows clear button when value is non-empty", async () => {
    const user = userEvent.setup()
    render(<SearchInput aria-label="Search" />)
    const input = screen.getByRole("searchbox")

    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument()

    await user.type(input, "hello")
    expect(screen.getByLabelText("Clear search")).toBeInTheDocument()
  })

  it("calls onClear when clear button is clicked", async () => {
    const user = userEvent.setup()
    const handleClear = vi.fn()
    render(
      <SearchInput aria-label="Search" onClear={handleClear} />
    )

    await user.type(screen.getByRole("searchbox"), "test")
    await user.click(screen.getByLabelText("Clear search"))

    expect(handleClear).toHaveBeenCalledOnce()
  })

  it("clears internal value in uncontrolled mode", async () => {
    const user = userEvent.setup()
    render(<SearchInput aria-label="Search" onClear={() => {}} />)
    const input = screen.getByRole("searchbox")

    await user.type(input, "hello")
    expect(input).toHaveValue("hello")

    await user.click(screen.getByLabelText("Clear search"))
    expect(input).toHaveValue("")
  })

  it("forwards ref correctly", () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement | null>
    render(<SearchInput ref={ref} aria-label="Search" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it("applies custom className to wrapper", () => {
    render(<SearchInput className="custom" aria-label="Search" />)
    const wrapper = screen.getByRole("searchbox").closest("[data-slot='search-input']")
    expect(wrapper).toHaveClass("custom")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <SearchInput aria-label="Search" placeholder="Search..." />
    )
    await checkA11y(container)
  })
})
