import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { Input } from "../input"
import { NumberInput } from "../../number-input/number-input"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Input prefix and suffix (VI-662)", () => {
  it("renders the suffix and the input as one well", () => {
    const { container } = render(<Input suffix=".epk.pro" aria-label="Address" />)
    const wrapper = container.querySelector('[data-slot="input-wrapper"]')!
    const input = screen.getByRole("textbox", { name: "Address" })
    expect(wrapper).toContainElement(input)
    expect(wrapper).toContainElement(container.querySelector('[data-slot="input-suffix"]') as HTMLElement)
    expect(container.querySelector('[data-slot="input-suffix"]')).toHaveTextContent(".epk.pro")
  })

  it("renders a prefix before the input", () => {
    const { container } = render(<Input prefix="€" inputMode="decimal" aria-label="Amount" />)
    const prefix = container.querySelector('[data-slot="input-prefix"]')!
    const input = screen.getByRole("textbox")
    expect(prefix.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(input).toHaveAttribute("inputmode", "decimal")
  })

  it("keeps the affix out of the value and the selection", async () => {
    const user = userEvent.setup()
    render(<Input prefix="€" suffix="EUR" aria-label="Amount" defaultValue="12" />)
    const input = screen.getByRole("textbox") as HTMLInputElement
    expect(input.value).toBe("12")
    await user.type(input, "3")
    expect(input.value).toBe("123")
    // the affix is not form data
    expect(new FormData(input.form ?? document.createElement("form")).toString()).not.toContain("EUR")
  })

  it("describes the input by its affixes, keeping the caller's own description", () => {
    const { container } = render(
      <>
        <Input prefix="€" suffix="EUR" aria-label="Amount" aria-describedby="hint" />
        <span id="hint">Hint</span>
      </>
    )
    const input = screen.getByRole("textbox")
    const ids = input.getAttribute("aria-describedby")!.split(" ")
    expect(ids[0]).toBe("hint")
    expect(ids).toHaveLength(3)
    const text = ids.slice(1).map((id) => container.ownerDocument.getElementById(id)!.textContent)
    expect(text).toEqual(["€", "EUR"])
    expect(input).toHaveAccessibleDescription("Hint € EUR")
  })

  it("focuses the input when the affix is pressed or clicked", async () => {
    const user = userEvent.setup()
    const { container } = render(<Input prefix="€" suffix=".eu" aria-label="Amount" />)
    const input = screen.getByRole("textbox")
    expect(input).not.toHaveFocus()
    await user.click(container.querySelector('[data-slot="input-prefix"]') as HTMLElement)
    expect(input).toHaveFocus()
    input.blur()
    await user.click(container.querySelector('[data-slot="input-suffix"]') as HTMLElement)
    expect(input).toHaveFocus()
  })

  it("does not forward the native prefix attribute and handles it as a node", () => {
    render(<Input prefix="€" aria-label="Amount" />)
    expect(screen.getByRole("textbox")).not.toHaveAttribute("prefix")
  })

  it("is exactly a plain input when there is no affix", () => {
    const { container } = render(<Input aria-label="Plain" />)
    expect(container.querySelector('[data-slot="input-wrapper"]')).toBeNull()
  })

  it("forwards the ref to the input and keeps passwordManagers attributes", () => {
    const ref = { current: null as HTMLInputElement | null }
    render(<Input ref={ref} suffix="x" aria-label="A" />)
    expect(ref.current).toBe(screen.getByRole("textbox"))
    expect(ref.current).toHaveAttribute("data-1p-ignore", "true")
  })

  it("puts className on the wrapper that draws the well", () => {
    const { container } = render(<Input suffix="x" className="mine" aria-label="A" />)
    expect(container.querySelector('[data-slot="input-wrapper"]')).toHaveClass("mine")
    expect(screen.getByRole("textbox")).not.toHaveClass("mine")
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <Input suffix=".epk.pro" aria-label="Address" />
        <Input prefix="€" inputMode="decimal" aria-label="Amount" />
        <Input prefix="$" suffix="/ hr" size="sm" aria-label="Rate" aria-invalid="true" />
        <Input suffix="x" size="lg" aria-label="Disabled" disabled />
      </>
    )
    await checkA11y(container)
  })
})

describe("NumberInput prefix and suffix (VI-662)", () => {
  it("renders prefix and suffix inside the same wrapper as the steppers", () => {
    const { container } = render(<NumberInput prefix="$" suffix="h" defaultValue={2} aria-label="Fee" />)
    const wrapper = container.querySelector('[data-slot="number-input"]')!
    expect(wrapper.querySelector('[data-slot="number-input-prefix"]')).toHaveTextContent("$")
    expect(wrapper.querySelector('[data-slot="number-input-suffix"]')).toHaveTextContent("h")
    expect(screen.getByRole("spinbutton")).toHaveValue("2")
    expect(screen.getByRole("spinbutton")).not.toHaveAttribute("prefix")
  })

  it("describes the spinbutton by its affixes and focuses it on affix click", async () => {
    const user = userEvent.setup()
    const { container } = render(<NumberInput suffix="min" defaultValue={30} aria-label="Duration" />)
    const input = screen.getByRole("spinbutton")
    expect(input).toHaveAccessibleDescription("min")
    await user.click(container.querySelector('[data-slot="number-input-suffix"]') as HTMLElement)
    expect(input).toHaveFocus()
  })

  it("still steps from the buttons with an affix", async () => {
    const user = userEvent.setup()
    render(<NumberInput prefix="$" defaultValue={5} aria-label="Fee" />)
    await user.click(screen.getByLabelText("Increase value"))
    expect(screen.getByRole("spinbutton")).toHaveValue("6")
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <NumberInput prefix="$" defaultValue={150} aria-label="Fee" />
        <NumberInput suffix="h" defaultValue={2} aria-label="Hours" />
      </>
    )
    await checkA11y(container)
  })
})
