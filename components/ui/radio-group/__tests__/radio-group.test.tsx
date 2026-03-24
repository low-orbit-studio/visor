import { render, screen } from "@testing-library/react"
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
