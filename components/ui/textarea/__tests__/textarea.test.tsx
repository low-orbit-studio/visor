import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Textarea } from "../textarea"
import { PasswordManagersProvider } from "../../../../lib/password-managers-context"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Textarea", () => {
  it("renders with default props", () => {
    render(<Textarea placeholder="Enter text" />)
    const textarea = screen.getByPlaceholderText("Enter text")
    expect(textarea).toBeInTheDocument()
  })

  it("renders as a textarea element", () => {
    render(<Textarea aria-label="Description" />)
    const textarea = screen.getByRole("textbox")
    expect(textarea.tagName.toLowerCase()).toBe("textarea")
  })

  it("renders with custom className", () => {
    render(<Textarea className="custom-class" aria-label="Description" />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveClass("custom-class")
  })

  it("renders as disabled when disabled prop is set", () => {
    render(<Textarea disabled aria-label="Description" />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toBeDisabled()
  })

  it("passes through HTML textarea attributes", () => {
    render(<Textarea required rows={5} aria-label="Description" />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toBeRequired()
    expect(textarea).toHaveAttribute("rows", "5")
  })

  it("forwards ref correctly", () => {
    const ref = { current: null }
    render(<Textarea ref={ref} aria-label="Description" />)
    expect(ref.current).not.toBeNull()
  })

  describe("passwordManagers", () => {
    it("emits ignore data-* attrs by default", () => {
      render(<Textarea aria-label="Message" />)
      const textarea = screen.getByRole("textbox")
      expect(textarea).toHaveAttribute("data-1p-ignore", "true")
      expect(textarea).toHaveAttribute("data-bwignore", "true")
      expect(textarea).toHaveAttribute("data-lpignore", "true")
      expect(textarea).toHaveAttribute("data-form-type", "other")
    })

    it("emits ignore data-* attrs when set explicitly to 'ignore'", () => {
      render(<Textarea aria-label="Message" passwordManagers="ignore" />)
      const textarea = screen.getByRole("textbox")
      expect(textarea).toHaveAttribute("data-1p-ignore", "true")
      expect(textarea).toHaveAttribute("data-bwignore", "true")
      expect(textarea).toHaveAttribute("data-lpignore", "true")
      expect(textarea).toHaveAttribute("data-form-type", "other")
    })

    it("emits no ignore data-* attrs when set to 'allow'", () => {
      render(<Textarea aria-label="Message" passwordManagers="allow" />)
      const textarea = screen.getByRole("textbox")
      expect(textarea).not.toHaveAttribute("data-1p-ignore")
      expect(textarea).not.toHaveAttribute("data-bwignore")
      expect(textarea).not.toHaveAttribute("data-lpignore")
      expect(textarea).not.toHaveAttribute("data-form-type")
    })

    it("inherits 'allow' from PasswordManagersProvider context", () => {
      render(
        <PasswordManagersProvider value="allow">
          <Textarea aria-label="Notes" />
        </PasswordManagersProvider>
      )
      const textarea = screen.getByRole("textbox")
      expect(textarea).not.toHaveAttribute("data-1p-ignore")
      expect(textarea).not.toHaveAttribute("data-bwignore")
      expect(textarea).not.toHaveAttribute("data-lpignore")
      expect(textarea).not.toHaveAttribute("data-form-type")
    })

    it("field-level prop overrides context (ignore beats allow)", () => {
      render(
        <PasswordManagersProvider value="allow">
          <Textarea aria-label="Honey" passwordManagers="ignore" />
        </PasswordManagersProvider>
      )
      const textarea = screen.getByRole("textbox")
      expect(textarea).toHaveAttribute("data-1p-ignore", "true")
      expect(textarea).toHaveAttribute("data-bwignore", "true")
      expect(textarea).toHaveAttribute("data-lpignore", "true")
      expect(textarea).toHaveAttribute("data-form-type", "other")
    })

    it("field-level prop overrides context (allow beats ignore)", () => {
      render(
        <PasswordManagersProvider value="ignore">
          <Textarea aria-label="Notes" passwordManagers="allow" />
        </PasswordManagersProvider>
      )
      const textarea = screen.getByRole("textbox")
      expect(textarea).not.toHaveAttribute("data-1p-ignore")
      expect(textarea).not.toHaveAttribute("data-bwignore")
      expect(textarea).not.toHaveAttribute("data-lpignore")
      expect(textarea).not.toHaveAttribute("data-form-type")
    })
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (with aria-label)", async () => {
    const { container } = render(<Textarea aria-label="Message" />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (with associated label)", async () => {
    const { container } = render(
      <div>
        <label htmlFor="message">Your message</label>
        <Textarea id="message" />
      </div>
    )
    await checkA11y(container)
  })
})
