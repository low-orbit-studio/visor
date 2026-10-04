import { render, screen, fireEvent } from "@testing-library/react"
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

describe("invalid", () => {
  it("sets aria-invalid on every cell and keeps the digits", () => {
    render(<OTPInput length={4} value="1234" invalid />)
    const cells = screen.getAllByRole("textbox")
    cells.forEach((cell, i) => {
      expect(cell).toHaveAttribute("aria-invalid", "true")
      expect(cell).toHaveValue(String(i + 1))
    })
  })

  it("does not set aria-invalid by default", () => {
    render(<OTPInput length={4} />)
    screen.getAllByRole("textbox").forEach((cell) => {
      expect(cell).not.toHaveAttribute("aria-invalid")
    })
  })

  it("announces the error message and describes the cells with it", () => {
    render(<OTPInput length={4} value="1234" invalid errorMessage="Wrong code" />)
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Wrong code")
    expect(alert).toBeVisible()
    expect(alert.className).not.toMatch(/srOnly/)
    screen.getAllByRole("textbox").forEach((cell) => {
      expect(cell).toHaveAttribute("aria-describedby", alert.id)
    })
  })

  it("lets the code be corrected while invalid", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<OTPInput length={4} invalid onChange={handleChange} />)
    await user.click(screen.getAllByRole("textbox")[0])
    await user.keyboard("1234{Backspace}9")
    expect(handleChange).toHaveBeenLastCalledWith("1239")
  })

  it("has no WCAG violations while invalid", async () => {
    const { container } = render(
      <OTPInput length={4} value="1234" invalid errorMessage="Wrong code" trailing={<button type="button">Resend</button>} />
    )
    await checkA11y(container)
  })
})

describe("paste and autofill", () => {
  it("fills every cell on a full paste", async () => {
    const user = userEvent.setup()
    render(<OTPInput length={6} />)
    const cells = screen.getAllByRole("textbox")
    await user.click(cells[0])
    await user.paste("428519")
    cells.forEach((cell, i) => expect(cell).toHaveValue("428519"[i]))
  })

  it("puts autocomplete=one-time-code on the first cell", () => {
    render(<OTPInput length={4} />)
    const cells = screen.getAllByRole("textbox")
    expect(cells[0]).toHaveAttribute("autocomplete", "one-time-code")
    expect(cells[1]).not.toHaveAttribute("autocomplete", "one-time-code")
  })

  it("accepts a whole autofilled code written into the first cell", () => {
    const handleChange = vi.fn()
    render(<OTPInput length={6} onChange={handleChange} />)
    const cells = screen.getAllByRole("textbox")
    fireEvent.change(cells[0], { target: { value: "428519" } })
    expect(handleChange).toHaveBeenLastCalledWith("428519")
    cells.forEach((cell, i) => expect(cell).toHaveValue("428519"[i]))
  })
})

describe("trailing", () => {
  it("renders trailing content beside the cells", () => {
    render(<OTPInput length={4} trailing={<button type="button">Resend</button>} />)
    const slot = screen.getByRole("button", { name: "Resend" })
    expect(slot.closest('[data-slot="otp-input-trailing"]')).toBeInTheDocument()
    expect(screen.getByRole("group")).toContainElement(slot)
  })

  it("renders no trailing wrapper without one", () => {
    const { container } = render(<OTPInput length={4} />)
    expect(container.querySelector('[data-slot="otp-input-trailing"]')).toBeNull()
  })
})

describe("errorMessage visibility", () => {
  it("renders nothing when not invalid or no message", () => {
    const { rerender } = render(<OTPInput length={4} errorMessage="Wrong code" />)
    expect(screen.queryByRole("alert")).toBeNull()
    rerender(<OTPInput length={4} invalid />)
    expect(screen.queryByRole("alert")).toBeNull()
    screen.getAllByRole("textbox").forEach((cell) => {
      expect(cell).not.toHaveAttribute("aria-describedby")
    })
  })
})
