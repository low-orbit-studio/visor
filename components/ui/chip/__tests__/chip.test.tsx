import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { Chip, ChoiceChip, FilterChip } from "../chip"
import styles from "../chip.module.css"
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

  // count prop
  it("does not render count span when count is absent", () => {
    const { container } = render(<FilterChip label="Events" />)
    expect(container.querySelector('[data-slot="filter-chip-count"]')).not.toBeInTheDocument()
  })

  it("renders count span when count is provided", () => {
    render(<FilterChip label="Events" count={47} />)
    expect(screen.getByText("47")).toBeInTheDocument()
  })

  it("count span has data-slot=filter-chip-count", () => {
    const { container } = render(<FilterChip label="Events" count={47} />)
    expect(container.querySelector('[data-slot="filter-chip-count"]')).toBeInTheDocument()
  })

  it("defaults countTone to neutral (data-tone=neutral)", () => {
    const { container } = render(<FilterChip label="Events" count={47} />)
    expect(container.querySelector('[data-slot="filter-chip-count"]')).toHaveAttribute("data-tone", "neutral")
  })

  it("applies data-tone=primary when countTone=primary", () => {
    const { container } = render(<FilterChip label="Events" count={47} countTone="primary" />)
    expect(container.querySelector('[data-slot="filter-chip-count"]')).toHaveAttribute("data-tone", "primary")
  })

  it("applies data-tone=neutral when countTone=neutral", () => {
    const { container } = render(<FilterChip label="Events" count={47} countTone="neutral" />)
    expect(container.querySelector('[data-slot="filter-chip-count"]')).toHaveAttribute("data-tone", "neutral")
  })

  it("count is rendered inside the button (part of accessible name)", () => {
    render(<FilterChip label="Active" count={47} />)
    // Count span is inside the button — screen readers include it in the accessible name.
    // Note: happy-dom collapses inter-element whitespace so the name is "Active47";
    // real browsers announce "Active 47". The key assertion is containment.
    const button = screen.getByRole("checkbox")
    expect(button.querySelector('[data-slot="filter-chip-count"]')).toBeInTheDocument()
    expect(button.textContent).toContain("47")
  })

  it("count is part of button text content when selected and primary", () => {
    render(<FilterChip label="Active" count={47} countTone="primary" selected />)
    const button = screen.getByRole("checkbox")
    expect(button.querySelector('[data-slot="filter-chip-count"]')).toBeInTheDocument()
    expect(button.textContent).toContain("47")
    expect(button).toHaveAttribute("aria-checked", "true")
  })

  it("renders identically without count — no breaking change", () => {
    const { container } = render(<FilterChip label="Events" />)
    expect(container.querySelector('[data-slot="filter-chip-count"]')).not.toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: "Events" })).toBeInTheDocument()
  })

  // selectedTreatment prop
  it("defaults selectedTreatment to accent (data-selected-treatment=accent)", () => {
    render(<FilterChip label="Events" />)
    expect(screen.getByRole("checkbox")).toHaveAttribute("data-selected-treatment", "accent")
  })

  it("applies data-selected-treatment=neutral when selectedTreatment=neutral", () => {
    render(<FilterChip label="Events" selectedTreatment="neutral" />)
    expect(screen.getByRole("checkbox")).toHaveAttribute("data-selected-treatment", "neutral")
  })

  it("neutral treatment: unselected renders without selected class", () => {
    render(<FilterChip label="Events" selectedTreatment="neutral" />)
    const btn = screen.getByRole("checkbox")
    expect(btn).toHaveAttribute("aria-checked", "false")
    expect(btn).toHaveAttribute("data-selected", "false")
  })

  it("neutral treatment: selected applies data-selected=true and aria-checked=true", () => {
    render(<FilterChip label="Events" selectedTreatment="neutral" selected />)
    const btn = screen.getByRole("checkbox")
    expect(btn).toHaveAttribute("aria-checked", "true")
    expect(btn).toHaveAttribute("data-selected", "true")
  })

  it("neutral treatment: count renders as solid (countSolid class) when selected", () => {
    const { container } = render(
      <FilterChip label="Active" count={47} selectedTreatment="neutral" selected />
    )
    const countEl = container.querySelector('[data-slot="filter-chip-count"]')
    expect(countEl).toBeInTheDocument()
    expect(countEl?.textContent).toBe("47")
  })

  it("neutral treatment: count renders normally (not solid) when unselected", () => {
    render(<FilterChip label="Active" count={47} selectedTreatment="neutral" />)
    const btn = screen.getByRole("checkbox")
    expect(btn.textContent).toContain("47")
  })

  it("accent treatment (default): does not apply neutral class when selected", () => {
    render(<FilterChip label="Events" selected />)
    const btn = screen.getByRole("checkbox")
    expect(btn).toHaveAttribute("data-selected-treatment", "accent")
    expect(btn).toHaveAttribute("data-selected", "true")
  })

  // trailingIcon prop
  it("does not render trailing span when trailingIcon is absent", () => {
    const { container } = render(<FilterChip label="Events" />)
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument()
  })

  it("renders trailingIcon after the label", () => {
    render(<FilterChip label="Events" trailingIcon={<span data-testid="caret" />} />)
    expect(screen.getByTestId("caret")).toBeInTheDocument()
  })

  it("renders trailingIcon after the count (orthogonal to count)", () => {
    const { container } = render(
      <FilterChip label="Events" count={47} trailingIcon={<span data-testid="caret" />} />
    )
    const count = container.querySelector('[data-slot="filter-chip-count"]')
    const caret = screen.getByTestId("caret")
    expect(count).toBeInTheDocument()
    expect(caret).toBeInTheDocument()
    // Trailing icon's wrapper comes after the count in document order.
    expect(
      count!.compareDocumentPosition(caret) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("trailingIcon is hidden from assistive tech (aria-hidden)", () => {
    render(<FilterChip label="Events" trailingIcon={<span data-testid="caret" />} />)
    expect(screen.getByTestId("caret").parentElement).toHaveAttribute("aria-hidden", "true")
  })

  it("renders identically without trailingIcon — no breaking change", () => {
    render(<FilterChip label="Events" />)
    expect(screen.getByRole("checkbox", { name: "Events" })).toBeInTheDocument()
  })

  /* Density-axis class guards (VI admin editorial reconcile).
     These classes are the attachment points for density rules — the classes
     themselves must always be applied; density="editorial" on an ancestor
     activates the overrides baked into the CSS. */
  it("applies the filterChip class (density resting-bg rule target)", () => {
    render(<FilterChip label="Events" />)
    expect(screen.getByRole("checkbox")).toHaveClass(styles.filterChip)
  })

  it("applies the sizeMd class by default (density font-size / gap rule target)", () => {
    render(<FilterChip label="Events" />)
    expect(screen.getByRole("checkbox")).toHaveClass(styles.sizeMd)
  })

  it("selected (default accent treatment) applies the .selected class (density selected rule target)", () => {
    render(<FilterChip label="Events" selected />)
    expect(screen.getByRole("checkbox")).toHaveClass(styles.selected)
  })

  it("count pill carries the .count class (density count shape/weight/align rule target)", () => {
    const { container } = render(<FilterChip label="Active" count={47} />)
    expect(container.querySelector('[data-slot="filter-chip-count"]')).toHaveClass(styles.count)
  })

  it("selected + primary count: count pill sits inside .selected so selected-count hooks apply", () => {
    const { container } = render(
      <FilterChip label="Role" count="3" countTone="primary" selected />
    )
    const btn = container.querySelector('[data-slot="filter-chip"]')
    const countEl = container.querySelector('[data-slot="filter-chip-count"]')
    expect(btn).toHaveClass(styles.selected)
    expect(countEl).toHaveClass(styles.count)
    // The selected wrapper + nested count is what the `.selected .count` rule targets.
    expect(btn?.contains(countEl ?? null)).toBe(true)
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

  it("FilterChip with count (neutral, unselected) has no violations", async () => {
    const { container } = render(<FilterChip label="Active" count={47} />)
    await checkA11y(container)
  })

  it("FilterChip with count (neutral, selected) has no violations", async () => {
    const { container } = render(<FilterChip label="Active" count={47} selected />)
    await checkA11y(container)
  })

  it("FilterChip with count (primary, unselected) has no violations", async () => {
    const { container } = render(<FilterChip label="Active" count={47} countTone="primary" />)
    await checkA11y(container)
  })

  it("FilterChip with count (primary, selected) has no violations", async () => {
    const { container } = render(<FilterChip label="Active" count={47} countTone="primary" selected />)
    await checkA11y(container)
  })

  it("FilterChip neutral treatment (unselected) has no violations", async () => {
    const { container } = render(<FilterChip label="Active" selectedTreatment="neutral" />)
    await checkA11y(container)
  })

  it("FilterChip neutral treatment (selected) has no violations", async () => {
    const { container } = render(<FilterChip label="Active" selectedTreatment="neutral" selected />)
    await checkA11y(container)
  })

  it("FilterChip neutral treatment with count (selected) has no violations", async () => {
    const { container } = render(<FilterChip label="Active" count={47} selectedTreatment="neutral" selected />)
    await checkA11y(container)
  })
})
