import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { checkA11y } from "../../../../test-utils/a11y"
import { OTPInput } from "../otp-input"

describe("OTPInput", () => {
  it("renders correct number of cells", () => {
    render(<OTPInput length={4} />)
    const cells = screen.getAllByRole("textbox")
    expect(cells).toHaveLength(4)
  })

  it("defaults to 6 cells", () => {
    render(<OTPInput />)
    const cells = screen.getAllByRole("textbox")
    expect(cells).toHaveLength(6)
  })

  it("auto-advances to next cell on digit entry", async () => {
    const user = userEvent.setup()
    render(<OTPInput length={4} />)
    const cells = screen.getAllByRole("textbox")

    await user.click(cells[0])
    await user.keyboard("1")
    expect(cells[1]).toHaveFocus()
  })

  it("moves back on backspace", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<OTPInput length={4} onChange={handleChange} />)
    const cells = screen.getAllByRole("textbox")

    await user.click(cells[0])
    await user.keyboard("12")
    // Now on cell 2
    await user.keyboard("{Backspace}")
    // Cell 1 should be cleared and focused
    expect(cells[1]).toHaveFocus()
  })

  it("calls onChange with full value", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<OTPInput length={4} onChange={handleChange} />)
    const cells = screen.getAllByRole("textbox")

    await user.click(cells[0])
    await user.keyboard("1")
    expect(handleChange).toHaveBeenLastCalledWith("1")
  })

  it("supports paste", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<OTPInput length={4} onChange={handleChange} />)
    const cells = screen.getAllByRole("textbox")

    await user.click(cells[0])
    await user.paste("1234")
    expect(handleChange).toHaveBeenLastCalledWith("1234")
  })

  it("ignores non-digit input", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<OTPInput length={4} onChange={handleChange} />)
    const cells = screen.getAllByRole("textbox")

    await user.click(cells[0])
    await user.keyboard("a")
    // onChange should not have been called with 'a'
    expect(handleChange).not.toHaveBeenCalled()
  })

  it("disables all cells when disabled", () => {
    render(<OTPInput length={4} disabled />)
    const cells = screen.getAllByRole("textbox")
    cells.forEach((cell) => {
      expect(cell).toBeDisabled()
    })
  })

  it("renders data-slot attribute", () => {
    render(<OTPInput />)
    expect(screen.getByRole("group")).toHaveAttribute("data-slot", "otp-input")
  })

  it("forwards ref correctly", () => {
    const ref = { current: null } as React.RefObject<HTMLDivElement | null>
    render(<OTPInput ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<OTPInput length={4} />)
    await checkA11y(container)
  })

  it("has proper aria-labels on cells", () => {
    render(<OTPInput length={4} />)
    expect(screen.getByLabelText("Digit 1 of 4")).toBeInTheDocument()
    expect(screen.getByLabelText("Digit 4 of 4")).toBeInTheDocument()
  })

  it("has group role with label", () => {
    render(<OTPInput />)
    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "Verification code"
    )
  })
})
