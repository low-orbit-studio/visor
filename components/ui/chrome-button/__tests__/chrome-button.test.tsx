import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { ChromeButton } from "../chrome-button"

describe("ChromeButton", () => {
  it("renders with default props and label", () => {
    render(<ChromeButton>Search</ChromeButton>)
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument()
  })

  it("applies data-slot='chrome-button' on root", () => {
    render(<ChromeButton>Search</ChromeButton>)
    expect(screen.getByRole("button")).toHaveAttribute(
      "data-slot",
      "chrome-button"
    )
  })

  it("applies data-variant='default' when no variant supplied", () => {
    render(<ChromeButton>Search</ChromeButton>)
    expect(screen.getByRole("button")).toHaveAttribute(
      "data-variant",
      "default"
    )
  })

  it("applies data-variant='primary' for primary variant", () => {
    render(<ChromeButton variant="primary">New event</ChromeButton>)
    expect(screen.getByRole("button")).toHaveAttribute(
      "data-variant",
      "primary"
    )
  })

  it("defaults type='button' to avoid implicit form submission", () => {
    render(<ChromeButton>Search</ChromeButton>)
    expect(screen.getByRole("button")).toHaveAttribute("type", "button")
  })

  it("respects an explicit type prop", () => {
    render(<ChromeButton type="submit">Submit</ChromeButton>)
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit")
  })

  it("renders icon slot with data-slot='chrome-button-icon' when icon supplied", () => {
    render(
      <ChromeButton icon={<svg data-testid="search-icon" />}>Search</ChromeButton>
    )
    const icon = screen.getByTestId("search-icon").parentElement
    expect(icon).toHaveAttribute("data-slot", "chrome-button-icon")
    expect(icon).toHaveAttribute("aria-hidden", "true")
  })

  it("omits icon slot when icon prop is absent", () => {
    const { container } = render(<ChromeButton>Search</ChromeButton>)
    expect(
      container.querySelector('[data-slot="chrome-button-icon"]')
    ).toBeNull()
  })

  it("renders kbd slot with data-slot='chrome-button-kbd' when keys supplied", () => {
    const { container } = render(
      <ChromeButton keys={["⌘", "K"]}>Search</ChromeButton>
    )
    const kbdSlot = container.querySelector('[data-slot="chrome-button-kbd"]')
    expect(kbdSlot).not.toBeNull()
    // Kbd renders one <kbd> per key in the keys array.
    const keys = container.querySelectorAll('kbd[data-slot="kbd"]')
    expect(keys).toHaveLength(2)
  })

  it("omits kbd slot when keys prop is absent", () => {
    const { container } = render(<ChromeButton>New event</ChromeButton>)
    expect(
      container.querySelector('[data-slot="chrome-button-kbd"]')
    ).toBeNull()
  })

  it("omits kbd slot when keys prop is an empty array", () => {
    const { container } = render(
      <ChromeButton keys={[]}>New event</ChromeButton>
    )
    expect(
      container.querySelector('[data-slot="chrome-button-kbd"]')
    ).toBeNull()
  })

  it("fires onClick when clicked", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<ChromeButton onClick={onClick}>Search</ChromeButton>)
    await user.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <ChromeButton onClick={onClick} disabled>
        Search
      </ChromeButton>
    )
    await user.click(screen.getByRole("button"))
    expect(onClick).not.toHaveBeenCalled()
  })

  it("forwards ref to the underlying button element", () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(<ChromeButton ref={ref}>Search</ChromeButton>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it("passes through standard HTML button attributes (aria-label)", () => {
    render(<ChromeButton aria-label="Open command palette">Search</ChromeButton>)
    expect(
      screen.getByRole("button", { name: "Open command palette" })
    ).toBeInTheDocument()
  })

  it("merges custom className with internal classes", () => {
    render(<ChromeButton className="extra-class">Search</ChromeButton>)
    expect(screen.getByRole("button")).toHaveClass("extra-class")
  })
})
