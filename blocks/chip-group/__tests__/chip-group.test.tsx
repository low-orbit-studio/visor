import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { ChipGroup, ChipGroupItem } from "../chip-group"
import { ChoiceChip, FilterChip } from "../../../components/ui/chip/chip"
import { checkA11y } from "../../../test-utils/a11y"

/* ─── ChipGroup (single) ─────────────────────────────────────────────── */

describe("ChipGroup (type=single)", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <ChipGroup type="single" aria-label="Density">
        <ChipGroupItem value="compact">
          <ChoiceChip label="Compact" />
        </ChipGroupItem>
        <ChipGroupItem value="comfortable">
          <ChoiceChip label="Comfortable" />
        </ChipGroupItem>
      </ChipGroup>
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders with role=group and aria-label", () => {
    render(
      <ChipGroup type="single" aria-label="Display density">
        <ChipGroupItem value="compact">
          <ChoiceChip label="Compact" />
        </ChipGroupItem>
      </ChipGroup>
    )
    expect(screen.getByRole("group", { name: "Display density" })).toBeInTheDocument()
  })

  it("applies data-type=single", () => {
    render(
      <ChipGroup type="single" aria-label="Density">
        <ChipGroupItem value="compact">
          <ChoiceChip label="Compact" />
        </ChipGroupItem>
      </ChipGroup>
    )
    expect(screen.getByRole("group")).toHaveAttribute("data-type", "single")
  })

  it("defaultValue: selected chip has aria-checked=true", () => {
    render(
      <ChipGroup type="single" aria-label="Density" defaultValue={["compact"]}>
        <ChipGroupItem value="compact">
          <ChoiceChip label="Compact" />
        </ChipGroupItem>
        <ChipGroupItem value="comfortable">
          <ChoiceChip label="Comfortable" />
        </ChipGroupItem>
      </ChipGroup>
    )
    expect(screen.getByRole("radio", { name: "Compact" })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("radio", { name: "Comfortable" })).toHaveAttribute("aria-checked", "false")
  })

  it("clicking a chip selects it and deselects others (single mode)", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <ChipGroup type="single" aria-label="Density" onValueChange={onValueChange}>
        <ChipGroupItem value="compact">
          <ChoiceChip label="Compact" />
        </ChipGroupItem>
        <ChipGroupItem value="comfortable">
          <ChoiceChip label="Comfortable" />
        </ChipGroupItem>
      </ChipGroup>
    )
    await user.click(screen.getByRole("radio", { name: "Compact" }))
    expect(onValueChange).toHaveBeenCalledWith(["compact"])
  })

  it("controlled: reflects controlled value", () => {
    render(
      <ChipGroup type="single" aria-label="Density" value={["comfortable"]}>
        <ChipGroupItem value="compact">
          <ChoiceChip label="Compact" />
        </ChipGroupItem>
        <ChipGroupItem value="comfortable">
          <ChoiceChip label="Comfortable" />
        </ChipGroupItem>
      </ChipGroup>
    )
    expect(screen.getByRole("radio", { name: "Comfortable" })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("radio", { name: "Compact" })).toHaveAttribute("aria-checked", "false")
  })
})

/* ─── ChipGroup (multiple) ───────────────────────────────────────────── */

describe("ChipGroup (type=multiple)", () => {
  it("renders as group with multiple FilterChips", () => {
    render(
      <ChipGroup type="multiple" aria-label="Filters">
        <ChipGroupItem value="events">
          <FilterChip label="Events" />
        </ChipGroupItem>
        <ChipGroupItem value="releases">
          <FilterChip label="Releases" />
        </ChipGroupItem>
      </ChipGroup>
    )
    expect(screen.getByRole("group", { name: "Filters" })).toBeInTheDocument()
    expect(screen.getAllByRole("checkbox")).toHaveLength(2)
  })

  it("defaultValue: selected chips have aria-checked=true", () => {
    render(
      <ChipGroup type="multiple" aria-label="Filters" defaultValue={["events"]}>
        <ChipGroupItem value="events">
          <FilterChip label="Events" />
        </ChipGroupItem>
        <ChipGroupItem value="releases">
          <FilterChip label="Releases" />
        </ChipGroupItem>
      </ChipGroup>
    )
    expect(screen.getByRole("checkbox", { name: "Events" })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("checkbox", { name: "Releases" })).toHaveAttribute("aria-checked", "false")
  })

  it("clicking adds to selection (multiple mode)", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <ChipGroup type="multiple" aria-label="Filters" defaultValue={["events"]} onValueChange={onValueChange}>
        <ChipGroupItem value="events">
          <FilterChip label="Events" />
        </ChipGroupItem>
        <ChipGroupItem value="releases">
          <FilterChip label="Releases" />
        </ChipGroupItem>
      </ChipGroup>
    )
    await user.click(screen.getByRole("checkbox", { name: "Releases" }))
    expect(onValueChange).toHaveBeenCalledWith(["events", "releases"])
  })

  it("clicking an active chip removes it from selection", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <ChipGroup type="multiple" aria-label="Filters" defaultValue={["events", "releases"]} onValueChange={onValueChange}>
        <ChipGroupItem value="events">
          <FilterChip label="Events" />
        </ChipGroupItem>
        <ChipGroupItem value="releases">
          <FilterChip label="Releases" />
        </ChipGroupItem>
      </ChipGroup>
    )
    await user.click(screen.getByRole("checkbox", { name: "Events" }))
    expect(onValueChange).toHaveBeenCalledWith(["releases"])
  })
})

/* ─── ChipGroupItem disabled ─────────────────────────────────────────── */

describe("ChipGroupItem disabled", () => {
  it("renders the chip as disabled", () => {
    render(
      <ChipGroup type="single" aria-label="Density">
        <ChipGroupItem value="compact" disabled>
          <ChoiceChip label="Compact" />
        </ChipGroupItem>
      </ChipGroup>
    )
    expect(screen.getByRole("radio", { name: "Compact" })).toBeDisabled()
  })
})

/* ─── Accessibility ──────────────────────────────────────────────────── */

describe("accessibility", () => {
  it("single-select group has no violations", async () => {
    const { container } = render(
      <ChipGroup type="single" aria-label="Display density" defaultValue={["compact"]}>
        <ChipGroupItem value="compact">
          <ChoiceChip label="Compact" />
        </ChipGroupItem>
        <ChipGroupItem value="comfortable">
          <ChoiceChip label="Comfortable" />
        </ChipGroupItem>
        <ChipGroupItem value="spacious">
          <ChoiceChip label="Spacious" />
        </ChipGroupItem>
      </ChipGroup>
    )
    await checkA11y(container)
  })

  it("multi-select group has no violations", async () => {
    const { container } = render(
      <ChipGroup type="multiple" aria-label="Category filters" defaultValue={["events"]}>
        <ChipGroupItem value="events">
          <FilterChip label="Events" />
        </ChipGroupItem>
        <ChipGroupItem value="releases">
          <FilterChip label="Releases" />
        </ChipGroupItem>
        <ChipGroupItem value="updates">
          <FilterChip label="Updates" />
        </ChipGroupItem>
      </ChipGroup>
    )
    await checkA11y(container)
  })
})
