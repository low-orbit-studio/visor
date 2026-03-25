import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { checkA11y } from "../../../../test-utils/a11y"
import { PasswordInput, getPasswordStrength } from "../password-input"

describe("PasswordInput", () => {
  it("renders as password type by default", () => {
    render(<PasswordInput aria-label="Password" />)
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password")
  })

  it("toggles visibility when button is clicked", async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Password" />)
    const input = screen.getByLabelText("Password")
    const toggle = screen.getByLabelText("Show password")

    expect(input).toHaveAttribute("type", "password")

    await user.click(toggle)
    expect(input).toHaveAttribute("type", "text")
    expect(screen.getByLabelText("Hide password")).toBeInTheDocument()

    await user.click(screen.getByLabelText("Hide password"))
    expect(input).toHaveAttribute("type", "password")
  })

  it("renders strength meter when showStrength is true and has value", async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Password" showStrength />)

    await user.type(screen.getByLabelText("Password"), "abc")
    expect(screen.getByText("weak")).toBeInTheDocument()
  })

  it("does not render strength meter when showStrength is false", async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Password" />)

    await user.type(screen.getByLabelText("Password"), "abc")
    expect(screen.queryByText("weak")).not.toBeInTheDocument()
  })

  it("forwards ref correctly", () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement | null>
    render(<PasswordInput ref={ref} aria-label="Password" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it("applies custom className to wrapper", () => {
    render(<PasswordInput className="custom" aria-label="Password" />)
    const wrapper = screen.getByLabelText("Password").closest("[data-slot='password-input']")
    expect(wrapper).toHaveClass("custom")
  })
})

describe("getPasswordStrength", () => {
  it("returns score 0 for empty string", () => {
    expect(getPasswordStrength("").score).toBe(0)
  })

  it("returns weak for short lowercase-only", () => {
    const result = getPasswordStrength("abc")
    expect(result.score).toBe(1)
    expect(result.label).toBe("weak")
  })

  it("returns fair for mixed case", () => {
    const result = getPasswordStrength("Abc")
    expect(result.score).toBe(2)
    expect(result.label).toBe("fair")
  })

  it("returns good for mixed case + numbers", () => {
    const result = getPasswordStrength("Abc123")
    expect(result.score).toBe(3)
    expect(result.label).toBe("good")
  })

  it("returns strong for all criteria met", () => {
    const result = getPasswordStrength("Abc123!@#long")
    expect(result.score).toBe(4)
    expect(result.label).toBe("strong")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <PasswordInput aria-label="Password" placeholder="Enter password" />
    )
    await checkA11y(container)
  })
})
