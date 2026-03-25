import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { checkA11y } from "../../../../test-utils/a11y"
import { PhoneInput, formatPhone } from "../phone-input"

describe("PhoneInput", () => {
  it("renders with placeholder", () => {
    render(<PhoneInput aria-label="Phone" placeholder="(555) 123-4567" />)
    expect(screen.getByPlaceholderText("(555) 123-4567")).toBeInTheDocument()
  })

  it("formats input as user types", async () => {
    const user = userEvent.setup()
    render(<PhoneInput aria-label="Phone" />)
    const input = screen.getByLabelText("Phone")

    await user.type(input, "5551234567")
    expect(input).toHaveValue("(555) 123-4567")
  })

  it("calls onChange with raw digits", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<PhoneInput aria-label="Phone" onChange={handleChange} />)

    await user.type(screen.getByLabelText("Phone"), "555")
    expect(handleChange).toHaveBeenLastCalledWith("555")
  })

  it("limits to 10 digits", async () => {
    const user = userEvent.setup()
    render(<PhoneInput aria-label="Phone" />)
    const input = screen.getByLabelText("Phone")

    await user.type(input, "55512345678999")
    expect(input).toHaveValue("(555) 123-4567")
  })

  it("forwards ref correctly", () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement | null>
    render(<PhoneInput ref={ref} aria-label="Phone" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it("renders data-slot attribute", () => {
    render(<PhoneInput aria-label="Phone" />)
    const wrapper = screen.getByLabelText("Phone").closest("[data-slot='phone-input']")
    expect(wrapper).toBeInTheDocument()
  })
})

describe("formatPhone", () => {
  it("formats empty string", () => {
    expect(formatPhone("")).toBe("")
  })

  it("formats partial area code", () => {
    expect(formatPhone("55")).toBe("(55")
  })

  it("formats full area code", () => {
    expect(formatPhone("555")).toBe("(555")
  })

  it("formats area code + prefix", () => {
    expect(formatPhone("555123")).toBe("(555) 123")
  })

  it("formats full number", () => {
    expect(formatPhone("5551234567")).toBe("(555) 123-4567")
  })

  it("strips non-digit characters", () => {
    expect(formatPhone("(555) 123-4567")).toBe("(555) 123-4567")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <PhoneInput aria-label="Phone number" placeholder="(555) 123-4567" />
    )
    await checkA11y(container)
  })
})
