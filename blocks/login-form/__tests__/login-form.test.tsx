import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { LoginForm } from "../login-form"
import { checkA11y } from "../../../test-utils/a11y"

describe("LoginForm", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    const { container } = render(<LoginForm />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders the Sign in heading", () => {
    render(<LoginForm />)
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument()
  })

  it("renders the description text", () => {
    render(<LoginForm />)
    expect(screen.getByText("Enter your credentials to continue.")).toBeInTheDocument()
  })

  it("renders an email input", () => {
    render(<LoginForm />)
    const emailInput = screen.getByLabelText("Email")
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toHaveAttribute("type", "email")
  })

  it("renders a password input", () => {
    render(<LoginForm />)
    const passwordInput = screen.getByLabelText("Password")
    expect(passwordInput).toBeInTheDocument()
    expect(passwordInput).toHaveAttribute("type", "password")
  })

  it("renders the submit button", () => {
    render(<LoginForm />)
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument()
  })

  it("email placeholder is visible", () => {
    render(<LoginForm />)
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument()
  })

  // ─── Form interaction ────────────────────────────────────────────────

  it("accepts input in the email field", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    const emailInput = screen.getByLabelText("Email")
    await user.type(emailInput, "test@example.com")
    expect(emailInput).toHaveValue("test@example.com")
  })

  it("accepts input in the password field", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    const passwordInput = screen.getByLabelText("Password")
    await user.type(passwordInput, "supersecret")
    expect(passwordInput).toHaveValue("supersecret")
  })

  it("does not navigate away on submit (e.preventDefault)", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    // Just verify the form submits without throwing
    const emailInput = screen.getByLabelText("Email")
    await user.type(emailInput, "test@example.com")
    await user.click(screen.getByRole("button", { name: "Sign in" }))
    // Form is still visible after submit
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument()
  })

  // ─── className passthrough ──────────────────────────────────────────

  it("applies custom className to the root card element", () => {
    const { container } = render(<LoginForm className="custom-login" />)
    // The root card element should have the custom class
    expect(container.firstChild).toHaveClass("custom-login")
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks", async () => {
    const { container } = render(<LoginForm />)
    await checkA11y(container)
  })
})
