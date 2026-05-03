import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { Chip, ChoiceChip, FilterChip } from "../chip"
import { checkA11y } from "../../../../test-utils/a11y"

/* ─── Chip (base) ─────────────────────────────────────────────────────── */

describe("Chip", () => {
  it("renders with label prop", () => {
    render(<Chip label="React" />)
    expect(screen.getByText("React")).toBeInTheDocument()
  })

  it("renders with children when label is omitted", () => {
    render(<Chip>TypeScript</Chip>)
    expect(screen.getByText("TypeScript")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<Chip label="Tag" />)
    expect(container.querySelector('[data-slot="chip"]')).toBeInTheDocument()
  })

  it("applies data-variant for default variant", () => {
    const { container } = render(<Chip label="Tag" />)
    expect(container.querySelector('[data-variant="default"]')).toBeInTheDocument()
  })

  it("applies data-variant for outlined variant", () => {
    const { container } = render(<Chip label="Tag" variant="outlined" />)
    expect(container.querySelector('[data-variant="outlined"]')).toBeInTheDocument()
  })

  it("applies data-size for md size", () => {
    const { container } = render(<Chip label="Tag" />)
    expect(container.querySelector('[data-size="md"]')).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(<Chip label="Tag" className="custom" />)
    expect(container.querySelector('[data-slot="chip"]')).toHaveClass("custom")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<Chip label="Tag" ref={ref} />)
    expect(ref.current).not.toBeNull()
  })

  it("renders delete button when onDeleted is provided", () => {
    const onDeleted = vi.fn()
    render(<Chip label="Tag" onDeleted={onDeleted} />)
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument()
  })

  it("calls onDeleted when delete button is clicked", async () => {
    const user = userEvent.setup()
    const onDeleted = vi.fn()
    render(<Chip label="Tag" onDeleted={onDeleted} />)
    await user.click(screen.getByRole("button", { name: "Remove" }))
    expect(onDeleted).toHaveBeenCalledTimes(1)
  })

  it("renders custom deleteLabel as aria-label", () => {
    const onDeleted = vi.fn()
    render(<Chip label="Tag" onDeleted={onDeleted} deleteLabel="Clear tag" />)
    expect(screen.getByRole("button", { name: "Clear tag" })).toBeInTheDocument()
  })

  it("does not render delete button when onDeleted is absent", () => {
    render(<Chip label="Tag" />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("renders avatar slot", () => {
    render(<Chip label="Tag" avatar={<span data-testid="avatar" />} />)
    expect(screen.getByTestId("avatar")).toBeInTheDocument()
  })

  it("renders leadingIcon slot", () => {
    render(<Chip label="Tag" leadingIcon={<span data-testid="icon" />} />)
    expect(screen.getByTestId("icon")).toBeInTheDocument()
  })
})

/* ─── ChoiceChip ─────────────────────────────────────────────────────── */

describe("ChoiceChip", () => {
  it("renders as a button with role=radio", () => {
    render(<ChoiceChip label="Compact" />)
    expect(screen.getByRole("radio", { name: "Compact" })).toBeInTheDocument()
  })

  it("has aria-checked=false when not selected", () => {
    render(<ChoiceChip label="Option" />)
    expect(screen.getByRole("radio")).toHaveAttribute("aria-checked", "false")
  })

  it("has aria-checked=true when selected", () => {
    render(<ChoiceChip label="Option" selected />)
    expect(screen.getByRole("radio")).toHaveAttribute("aria-checked", "true")
  })

  it("applies data-slot=choice-chip", () => {
    render(<ChoiceChip label="Option" />)
    expect(screen.getByRole("radio")).toHaveAttribute("data-slot", "choice-chip")
  })

  it("applies data-selected=true when selected", () => {
    render(<ChoiceChip label="Option" selected />)
    expect(screen.getByRole("radio")).toHaveAttribute("data-selected", "true")
  })

  it("applies data-selected=false when not selected", () => {
    render(<ChoiceChip label="Option" />)
    expect(screen.getByRole("radio")).toHaveAttribute("data-selected", "false")
  })

  it("calls onPressed when clicked", async () => {
    const user = userEvent.setup()
    const onPressed = vi.fn()
    render(<ChoiceChip label="Option" onPressed={onPressed} />)
    await user.click(screen.getByRole("radio"))
    expect(onPressed).toHaveBeenCalledTimes(1)
  })

  it("is disabled when disabled prop is set", () => {
    render(<ChoiceChip label="Option" disabled />)
    expect(screen.getByRole("radio")).toBeDisabled()
  })

  it("renders with children when label is omitted", () => {
    render(<ChoiceChip>Comfortable</ChoiceChip>)
    expect(screen.getByRole("radio", { name: "Comfortable" })).toBeInTheDocument()
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<ChoiceChip label="Option" ref={ref} />)
    expect(ref.current).not.toBeNull()
  })

  it("renders leadingIcon slot", () => {
    render(<ChoiceChip label="Option" leadingIcon={<span data-testid="icon" />} />)
    expect(screen.getByTestId("icon")).toBeInTheDocument()
  })
})

/* ─── FilterChip ─────────────────────────────────────────────────────── */

describe("FilterChip", () => {
  it("renders as a button with role=checkbox", () => {
    render(<FilterChip label="Events" />)
    expect(screen.getByRole("checkbox", { name: "Events" })).toBeInTheDocument()
  })

  it("has aria-checked=false when not selected", () => {
    render(<FilterChip label="Events" />)
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false")
  })

  it("has aria-checked=true when selected", () => {
    render(<FilterChip label="Events" selected />)
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true")
  })

  it("applies data-slot=filter-chip", () => {
    render(<FilterChip label="Events" />)
    expect(screen.getByRole("checkbox")).toHaveAttribute("data-slot", "filter-chip")
  })

  it("calls onPressed when clicked", async () => {
    const user = userEvent.setup()
    const onPressed = vi.fn()
    render(<FilterChip label="Events" onPressed={onPressed} />)
    await user.click(screen.getByRole("checkbox"))
    expect(onPressed).toHaveBeenCalledTimes(1)
  })

  it("is disabled when disabled prop is set", () => {
    render(<FilterChip label="Events" disabled />)
    expect(screen.getByRole("checkbox")).toBeDisabled()
  })

  it("renders with children when label is omitted", () => {
    render(<FilterChip>Releases</FilterChip>)
    expect(screen.getByRole("checkbox", { name: "Releases" })).toBeInTheDocument()
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<FilterChip label="Events" ref={ref} />)
    expect(ref.current).not.toBeNull()
  })

  it("renders leadingIcon slot", () => {
    render(<FilterChip label="Events" leadingIcon={<span data-testid="icon" />} />)
    expect(screen.getByTestId("icon")).toBeInTheDocument()
  })
})

/* ─── Accessibility ──────────────────────────────────────────────────── */

describe("accessibility", () => {
  it("Chip (default) has no violations", async () => {
    const { container } = render(<Chip label="React" />)
    await checkA11y(container)
  })

  it("Chip with delete button has no violations", async () => {
    const { container } = render(<Chip label="React" onDeleted={() => {}} />)
    await checkA11y(container)
  })

  it("ChoiceChip (unselected) has no violations", async () => {
    const { container } = render(
      <div role="radiogroup" aria-label="Density">
        <ChoiceChip label="Compact" />
      </div>
    )
    await checkA11y(container)
  })

  it("ChoiceChip (selected) has no violations", async () => {
    const { container } = render(
      <div role="radiogroup" aria-label="Density">
        <ChoiceChip label="Compact" selected />
      </div>
    )
    await checkA11y(container)
  })

  it("FilterChip (unselected) has no violations", async () => {
    const { container } = render(<FilterChip label="Events" />)
    await checkA11y(container)
  })

  it("FilterChip (selected) has no violations", async () => {
    const { container } = render(<FilterChip label="Events" selected />)
    await checkA11y(container)
  })
})
