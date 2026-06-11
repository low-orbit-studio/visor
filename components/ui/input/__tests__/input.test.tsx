import { readFileSync } from "fs"
import { resolve } from "path"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Input } from "../input"
import { PasswordManagersProvider } from "../../../../lib/password-managers-context"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Input", () => {
  it("renders with default props", () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText("Enter text")
    expect(input).toBeInTheDocument()
  })

  it("renders with custom className", () => {
    render(<Input className="custom-class" />)
    const input = screen.getByRole("textbox")
    expect(input).toHaveClass("custom-class")
  })

  it("renders as disabled when disabled prop is set", () => {
    render(<Input disabled />)
    const input = screen.getByRole("textbox")
    expect(input).toBeDisabled()
  })

  it("renders with specified type", () => {
    render(<Input type="email" />)
    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("type", "email")
  })

  it("passes through HTML input attributes", () => {
    render(<Input required aria-label="Name" />)
    const input = screen.getByRole("textbox")
    expect(input).toBeRequired()
    expect(input).toHaveAttribute("aria-label", "Name")
  })

  it("forwards ref correctly", () => {
    const ref = { current: null }
    render(<Input ref={ref} />)
    expect(ref.current).not.toBeNull()
  })

  describe("passwordManagers", () => {
    it("emits ignore data-* attrs by default", () => {
      render(<Input aria-label="Email" />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("data-1p-ignore", "true")
      expect(input).toHaveAttribute("data-bwignore", "true")
      expect(input).toHaveAttribute("data-lpignore", "true")
      expect(input).toHaveAttribute("data-form-type", "other")
    })

    it("emits ignore data-* attrs when set explicitly to 'ignore'", () => {
      render(<Input aria-label="Email" passwordManagers="ignore" />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("data-1p-ignore", "true")
      expect(input).toHaveAttribute("data-bwignore", "true")
      expect(input).toHaveAttribute("data-lpignore", "true")
      expect(input).toHaveAttribute("data-form-type", "other")
    })

    it("emits no ignore data-* attrs when set to 'allow'", () => {
      render(<Input aria-label="Password" passwordManagers="allow" />)
      const input = screen.getByRole("textbox")
      expect(input).not.toHaveAttribute("data-1p-ignore")
      expect(input).not.toHaveAttribute("data-bwignore")
      expect(input).not.toHaveAttribute("data-lpignore")
      expect(input).not.toHaveAttribute("data-form-type")
    })

    it("inherits 'allow' from PasswordManagersProvider context", () => {
      render(
        <PasswordManagersProvider value="allow">
          <Input aria-label="Email" />
        </PasswordManagersProvider>
      )
      const input = screen.getByRole("textbox")
      expect(input).not.toHaveAttribute("data-1p-ignore")
      expect(input).not.toHaveAttribute("data-bwignore")
      expect(input).not.toHaveAttribute("data-lpignore")
      expect(input).not.toHaveAttribute("data-form-type")
    })

    it("inherits 'ignore' from PasswordManagersProvider context", () => {
      render(
        <PasswordManagersProvider value="ignore">
          <Input aria-label="Email" />
        </PasswordManagersProvider>
      )
      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("data-1p-ignore", "true")
      expect(input).toHaveAttribute("data-bwignore", "true")
      expect(input).toHaveAttribute("data-lpignore", "true")
      expect(input).toHaveAttribute("data-form-type", "other")
    })

    it("field-level prop overrides context (ignore beats allow)", () => {
      render(
        <PasswordManagersProvider value="allow">
          <Input aria-label="Honey" passwordManagers="ignore" />
        </PasswordManagersProvider>
      )
      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("data-1p-ignore", "true")
      expect(input).toHaveAttribute("data-bwignore", "true")
      expect(input).toHaveAttribute("data-lpignore", "true")
      expect(input).toHaveAttribute("data-form-type", "other")
    })

    it("field-level prop overrides context (allow beats ignore)", () => {
      render(
        <PasswordManagersProvider value="ignore">
          <Input aria-label="Email" passwordManagers="allow" />
        </PasswordManagersProvider>
      )
      const input = screen.getByRole("textbox")
      expect(input).not.toHaveAttribute("data-1p-ignore")
      expect(input).not.toHaveAttribute("data-bwignore")
      expect(input).not.toHaveAttribute("data-lpignore")
      expect(input).not.toHaveAttribute("data-form-type")
    })
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (with aria-label)", async () => {
    const { container } = render(<Input aria-label="Search" type="search" />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (with associated label)", async () => {
    const { container } = render(
      <div>
        <label htmlFor="name-input">Full name</label>
        <Input id="name-input" type="text" />
      </div>
    )
    await checkA11y(container)
  })
})

describe("aria-invalid styling", () => {
  it("sets aria-invalid=true when passed", () => {
    render(<Input aria-label="Email" aria-invalid="true" />)
    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("aria-invalid", "true")
  })

  it("does not set aria-invalid when not passed", () => {
    render(<Input aria-label="Email" />)
    const input = screen.getByRole("textbox")
    expect(input).not.toHaveAttribute("aria-invalid")
  })

  it("renders disabled + aria-invalid together without error", () => {
    render(<Input aria-label="Email" aria-invalid="true" disabled />)
    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toBeDisabled()
  })

  it("has no WCAG 2.1 AA violations when aria-invalid=true (with associated label)", async () => {
    const { container } = render(
      <div>
        <label htmlFor="invalid-input">Email</label>
        <Input id="invalid-input" type="email" aria-invalid="true" aria-describedby="invalid-input-error" />
        <span id="invalid-input-error" role="alert">Please enter a valid email address</span>
      </div>
    )
    await checkA11y(container)
  })

  it("renders aria-invalid=false without aria-invalid attribute behavior", () => {
    render(<Input aria-label="Email" aria-invalid={false} />)
    const input = screen.getByRole("textbox")
    // aria-invalid=false is valid HTML — just confirms no crash and attribute value
    expect(input).toHaveAttribute("aria-invalid", "false")
  })
})

describe("editorial token hooks (CSS-only, additive, zero-regression)", () => {
  const css = readFileSync(
    resolve(__dirname, "..", "input.module.css"),
    "utf-8"
  )

  it("base background-color wraps --field-control-bg, defaulting to the current --input-bg chain", () => {
    expect(css).toContain(
      "background-color: var(--field-control-bg, var(--input-bg, var(--surface-interactive-default, #f9fafb)));"
    )
  })

  it("aria-invalid color-mix base wraps --field-control-bg, defaulting to --input-bg", () => {
    expect(css).toContain(
      "color-mix(in srgb, var(--border-error, #ef4444) 6%, var(--field-control-bg, var(--input-bg, #f9fafb)))"
    )
  })

  it("::placeholder color wraps --input-placeholder-color, defaulting to --text-secondary", () => {
    expect(css).toContain(
      "color: var(--input-placeholder-color, var(--text-secondary, #9ca3af));"
    )
  })
})
