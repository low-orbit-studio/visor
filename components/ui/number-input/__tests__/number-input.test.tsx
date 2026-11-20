import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { checkA11y } from "../../../../test-utils/a11y"
import { NumberInput } from "../number-input"

describe("NumberInput", () => {
  it("renders with default value", () => {
    render(<NumberInput defaultValue={5} aria-label="Quantity" />)
    expect(screen.getByRole("spinbutton")).toHaveValue("5")
  })

  it("increments value when plus button is clicked", async () => {
    const user = userEvent.setup()
    render(<NumberInput defaultValue={5} aria-label="Quantity" />)

    await user.click(screen.getByLabelText("Increase value"))
    expect(screen.getByRole("spinbutton")).toHaveValue("6")
  })

  it("decrements value when minus button is clicked", async () => {
    const user = userEvent.setup()
    render(<NumberInput defaultValue={5} aria-label="Quantity" />)

    await user.click(screen.getByLabelText("Decrease value"))
    expect(screen.getByRole("spinbutton")).toHaveValue("4")
  })

  it("respects min boundary", async () => {
    const user = userEvent.setup()
    render(<NumberInput defaultValue={0} min={0} aria-label="Quantity" />)

    await user.click(screen.getByLabelText("Decrease value"))
    expect(screen.getByRole("spinbutton")).toHaveValue("0")
  })

  it("respects max boundary", async () => {
    const user = userEvent.setup()
    render(<NumberInput defaultValue={10} max={10} aria-label="Quantity" />)

    await user.click(screen.getByLabelText("Increase value"))
    expect(screen.getByRole("spinbutton")).toHaveValue("10")
  })

  it("calls onChange with new value", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <NumberInput defaultValue={5} onChange={handleChange} aria-label="Quantity" />
    )

    await user.click(screen.getByLabelText("Increase value"))
    expect(handleChange).toHaveBeenCalledWith(6)
  })

  it("clamps value on blur", async () => {
    const user = userEvent.setup()
    render(<NumberInput defaultValue={5} min={0} max={10} aria-label="Quantity" />)
    const input = screen.getByRole("spinbutton")

    await user.clear(input)
    await user.type(input, "99")
    await user.tab()
    expect(input).toHaveValue("10")
  })

  it("respects custom step", async () => {
    const user = userEvent.setup()
    render(<NumberInput defaultValue={0} step={5} aria-label="Quantity" />)

    await user.click(screen.getByLabelText("Increase value"))
    expect(screen.getByRole("spinbutton")).toHaveValue("5")
  })

  it("forwards ref correctly", () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement | null>
    render(<NumberInput ref={ref} aria-label="Quantity" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it("disables buttons and input when disabled", () => {
    render(<NumberInput disabled aria-label="Quantity" />)
    expect(screen.getByRole("spinbutton")).toBeDisabled()
    expect(screen.getByLabelText("Increase value")).toBeDisabled()
    expect(screen.getByLabelText("Decrease value")).toBeDisabled()
  })

  // VI-798: the kit stepper's keyboard and bounds behaviour.
  it("steps by `step` on ArrowUp and ArrowDown and holds at min and max", async () => {
    const user = userEvent.setup()
    render(<NumberInput defaultValue={8} min={0} max={10} step={2} aria-label="Quantity" />)
    const input = screen.getByRole("spinbutton")

    await user.click(input)
    await user.keyboard("{ArrowUp}")
    expect(input).toHaveValue("10")
    await user.keyboard("{ArrowUp}")
    expect(input).toHaveValue("10")
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}")
    expect(input).toHaveValue("0")
  })

  it("still calls the caller's onKeyDown, and lets it cancel the step", async () => {
    const user = userEvent.setup()
    const onKeyDown = vi.fn((e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") e.preventDefault()
    })
    render(<NumberInput defaultValue={5} onKeyDown={onKeyDown} aria-label="Quantity" />)
    const input = screen.getByRole("spinbutton")

    await user.click(input)
    await user.keyboard("{ArrowUp}{ArrowDown}")
    expect(onKeyDown).toHaveBeenCalledTimes(2)
    expect(input).toHaveValue("6")
  })

  it("disables − at min and + at max, and re-enables them off the bound", async () => {
    const user = userEvent.setup()
    render(<NumberInput defaultValue={0} min={0} max={1} aria-label="Quantity" />)
    const minus = screen.getByLabelText("Decrease value")
    const plus = screen.getByLabelText("Increase value")

    expect(minus).toBeDisabled()
    expect(plus).toBeEnabled()
    await user.click(plus)
    expect(screen.getByRole("spinbutton")).toHaveValue("1")
    expect(minus).toBeEnabled()
    expect(plus).toBeDisabled()
  })

  it("lands on min on the first press from empty", async () => {
    const user = userEvent.setup()
    render(<NumberInput min={3} max={9} aria-label="Quantity" />)

    expect(screen.getByLabelText("Decrease value")).toBeEnabled()
    await user.click(screen.getByLabelText("Increase value"))
    expect(screen.getByRole("spinbutton")).toHaveValue("3")
  })

  it("takes typed digits and ignores a stray letter", async () => {
    const user = userEvent.setup()
    render(<NumberInput aria-label="Quantity" />)
    const input = screen.getByRole("spinbutton")

    await user.type(input, "1x2")
    expect(input).toHaveValue("12")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <NumberInput defaultValue={5} min={0} max={10} aria-label="Quantity" />
    )
    await checkA11y(container)
  })
})
