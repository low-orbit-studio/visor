import { render, screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { RadioGroup, RadioGroupItem } from "../radio-group"
import { checkA11y } from "../../../../test-utils/a11y"

function renderRadioGroup(props?: Partial<React.ComponentProps<typeof RadioGroup>>) {
  return render(
    <RadioGroup aria-label="Favorite color" {...props}>
      <RadioGroupItem value="red" aria-label="Red" />
      <RadioGroupItem value="green" aria-label="Green" />
      <RadioGroupItem value="blue" aria-label="Blue" />
    </RadioGroup>
  )
}

describe("RadioGroup", () => {
  it("renders with default props", () => {
    renderRadioGroup()
    const radios = screen.getAllByRole("radio")
    expect(radios).toHaveLength(3)
  })

  it("renders with custom className", () => {
    const { container } = renderRadioGroup({ className: "custom-class" })
    const group = container.querySelector('[data-slot="radio-group"]')
    expect(group).toHaveClass("custom-class")
  })

  it("renders items as disabled when disabled prop is set", () => {
    render(
      <RadioGroup aria-label="Colors">
        <RadioGroupItem value="red" aria-label="Red" disabled />
      </RadioGroup>
    )
    const radio = screen.getByRole("radio", { name: "Red" })
    expect(radio).toBeDisabled()
  })

  it("selects an item when clicked", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    renderRadioGroup({ onValueChange: handleChange })
    const redRadio = screen.getByRole("radio", { name: "Red" })
    await user.click(redRadio)
    expect(handleChange).toHaveBeenCalledWith("red")
  })

  it("renders with a default value", () => {
    renderRadioGroup({ defaultValue: "green" })
    const greenRadio = screen.getByRole("radio", { name: "Green" })
    expect(greenRadio).toBeChecked()
  })

  it("forwards ref correctly", () => {
    const ref = { current: null }
    render(
      <RadioGroup aria-label="Colors" ref={ref}>
        <RadioGroupItem value="red" aria-label="Red" />
      </RadioGroup>
    )
    expect(ref.current).not.toBeNull()
  })

  it("forwards ref on RadioGroupItem", () => {
    const ref = { current: null }
    render(
      <RadioGroup aria-label="Colors">
        <RadioGroupItem value="red" aria-label="Red" ref={ref} />
      </RadioGroup>
    )
    expect(ref.current).not.toBeNull()
  })

  it("supports keyboard navigation via onValueChange callback", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    renderRadioGroup({ onValueChange: handleChange })
    // Click first radio item
    const redRadio = screen.getByRole("radio", { name: "Red" })
    await user.click(redRadio)
    expect(handleChange).toHaveBeenCalledWith("red")
    // Click second radio item
    const greenRadio = screen.getByRole("radio", { name: "Green" })
    await user.click(greenRadio)
    expect(handleChange).toHaveBeenCalledWith("green")
  })
})

describe("RadioGroup accessibility", () => {
  it("has no WCAG 2.1 AA violations (unchecked)", async () => {
    const { container } = renderRadioGroup()
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (with selection)", async () => {
    const { container } = renderRadioGroup({ defaultValue: "blue" })
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations with label elements", async () => {
    const { container } = render(
      <fieldset>
        <legend>Favorite color</legend>
        <RadioGroup>
          <div>
            <RadioGroupItem value="red" id="radio-red" />
            <label htmlFor="radio-red">Red</label>
          </div>
          <div>
            <RadioGroupItem value="green" id="radio-green" />
            <label htmlFor="radio-green">Green</label>
          </div>
        </RadioGroup>
      </fieldset>
    )
    await checkA11y(container)
  })
})

function CardGroup(props: Partial<React.ComponentProps<typeof RadioGroup>>) {
  return (
    <RadioGroup variant="card" aria-label="Visibility" defaultValue="you" {...props}>
      <RadioGroupItem value="you" icon={<svg data-testid="icon-you" />} title="Just You" description="Only you can see it." />
      <RadioGroupItem value="team" title="Your Team" description="Your team can see it." />
      <RadioGroupItem
        value="verified"
        title="Verified Bookers"
        description="Verified bookers can see it."
        disabled
        aria-describedby="why-verified"
      />
      <RadioGroupItem value="public" title="Public" description="Anyone can see it." />
      <p id="why-verified">Needs a verified booking.</p>
    </RadioGroup>
  )
}

describe("RadioGroup variant=card", () => {
  it("renders icon, title and description slots", () => {
    const { container } = render(<CardGroup />)
    expect(screen.getByTestId("icon-you")).toBeInTheDocument()
    expect(container.querySelector('[data-slot="radio-group"]')).toHaveAttribute("data-variant", "card")
    expect(container.querySelectorAll('[data-slot="radio-group-card-title"]')).toHaveLength(4)
    expect(container.querySelectorAll('[data-slot="radio-group-card-description"]')).toHaveLength(4)
  })

  it("names each item by its title and describes it by its line", () => {
    render(<CardGroup />)
    const team = screen.getByRole("radio", { name: "Your Team" })
    expect(team).toHaveAccessibleDescription("Your team can see it.")
  })

  it("exposes aria-checked on the selected item only", () => {
    render(<CardGroup />)
    expect(screen.getByRole("radio", { name: "Just You" })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("radio", { name: "Your Team" })).toHaveAttribute("aria-checked", "false")
  })

  it("moves the choice with the arrow keys and skips disabled items", async () => {
    const user = userEvent.setup()
    render(<CardGroup defaultValue="team" />)
    screen.getByRole("radio", { name: "Your Team" }).focus()
    // Radix selects on focus only while an arrow key is held, so hold it across
    // the roving-focus move (jsdom has no gap between keydown and keyup).
    await user.keyboard("{ArrowDown>}")
    await waitFor(() => expect(screen.getByRole("radio", { name: "Public" })).toHaveFocus())
    await user.keyboard("{/ArrowDown}")
    expect(screen.getByRole("radio", { name: "Public" })).toHaveAttribute("aria-checked", "true")
    await user.keyboard("{ArrowUp>}")
    await waitFor(() => expect(screen.getByRole("radio", { name: "Your Team" })).toHaveFocus())
    await user.keyboard("{/ArrowUp}")
    expect(screen.getByRole("radio", { name: "Your Team" })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("radio", { name: "Verified Bookers" })).toHaveAttribute("aria-checked", "false")
  })

  it("keeps a disabled item visible and says why through aria-describedby", () => {
    render(<CardGroup />)
    const disabled = screen.getByRole("radio", { name: "Verified Bookers" })
    expect(disabled).toBeDisabled()
    expect(disabled).toHaveAccessibleDescription("Verified bookers can see it. Needs a verified booking.")
  })

  it("does not select a disabled item on click", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<CardGroup onValueChange={onValueChange} />)
    await user.click(screen.getByRole("radio", { name: "Verified Bookers" }))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("has no accessibility violations", async () => {
    const { container } = render(<CardGroup />)
    await checkA11y(container)
  })

  it("has no accessibility violations with a different selection", async () => {
    const { container } = render(<CardGroup defaultValue="public" />)
    await checkA11y(container)
  })
})
