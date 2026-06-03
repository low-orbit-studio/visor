import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
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

describe("LoginForm — OAuth", () => {
  const google = { id: "google", label: "Continue with Google" }
  const github = { id: "github", label: "Continue with GitHub" }

  // ─── Back-compat ─────────────────────────────────────────────────────

  it("renders no OAuth buttons or divider when oauthProviders is omitted", () => {
    render(<LoginForm />)
    expect(screen.queryByText("or continue with")).not.toBeInTheDocument()
    // Only the credentials submit button is present.
    expect(screen.getAllByRole("button")).toHaveLength(1)
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument()
  })

  // ─── Provider buttons ────────────────────────────────────────────────

  it("renders one button per provider with the correct accessible name", () => {
    render(<LoginForm oauthProviders={[google, github]} />)
    expect(
      screen.getByRole("button", { name: "Continue with Google" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Continue with GitHub" })
    ).toBeInTheDocument()
  })

  it("calls onOAuthSignIn with the provider id when a button is clicked", async () => {
    const user = userEvent.setup()
    const onOAuthSignIn = vi.fn()
    render(
      <LoginForm oauthProviders={[google]} onOAuthSignIn={onOAuthSignIn} />
    )
    await user.click(
      screen.getByRole("button", { name: "Continue with Google" })
    )
    expect(onOAuthSignIn).toHaveBeenCalledWith("google")
  })

  // ─── Loading state ───────────────────────────────────────────────────

  it("toggles disabled and aria-busy while an async handler is pending", async () => {
    const user = userEvent.setup()
    let resolveSignIn: () => void = () => {}
    const pending = new Promise<void>((resolve) => {
      resolveSignIn = resolve
    })
    const onOAuthSignIn = vi.fn(() => pending)
    render(
      <LoginForm oauthProviders={[google]} onOAuthSignIn={onOAuthSignIn} />
    )
    const button = screen.getByRole("button", { name: "Continue with Google" })

    await user.click(button)
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("aria-busy", "true")

    resolveSignIn()
    await waitFor(() => expect(button).not.toBeDisabled())
    expect(button).toHaveAttribute("aria-busy", "false")
  })

  it("clears the loading state when the async handler rejects", async () => {
    const user = userEvent.setup()
    const onOAuthSignIn = vi.fn(() => Promise.reject(new Error("oauth failed")))
    render(
      <LoginForm oauthProviders={[google]} onOAuthSignIn={onOAuthSignIn} />
    )
    const button = screen.getByRole("button", { name: "Continue with Google" })

    await user.click(button)
    // The rejection is swallowed (consumer surfaces errors via `error`), and the
    // button returns to its idle state rather than staying disabled.
    await waitFor(() => expect(button).not.toBeDisabled())
    expect(button).toHaveAttribute("aria-busy", "false")
  })

  // ─── Divider ─────────────────────────────────────────────────────────

  it("shows the default divider label alongside OAuth + credentials", () => {
    render(<LoginForm oauthProviders={[google]} />)
    expect(screen.getByText("or continue with")).toBeInTheDocument()
  })

  it("shows a custom divider label", () => {
    render(
      <LoginForm oauthProviders={[google]} dividerLabel="or use your email" />
    )
    expect(screen.getByText("or use your email")).toBeInTheDocument()
  })

  // ─── Error ───────────────────────────────────────────────────────────

  it("renders the error message in a role=alert", () => {
    render(<LoginForm error="Invalid credentials" />)
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials")
  })

  it("renders no alert when error is absent", () => {
    render(<LoginForm />)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  // ─── hideCredentials ─────────────────────────────────────────────────

  it("hides email/password and the divider when hideCredentials is set", () => {
    render(<LoginForm oauthProviders={[google]} hideCredentials />)
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument()
    expect(screen.queryByText("or continue with")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Continue with Google" })
    ).toBeInTheDocument()
  })

  // ─── A11y ────────────────────────────────────────────────────────────

  it("passes accessibility checks with OAuth, divider, and error rendered", async () => {
    const { container } = render(
      <LoginForm oauthProviders={[google, github]} error="Invalid credentials" />
    )
    await checkA11y(container)
  })
})
