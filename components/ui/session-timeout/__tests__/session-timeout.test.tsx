import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { SessionTimeout } from "../session-timeout"

describe("SessionTimeout", () => {
  it("does not render overlay content when open is false", () => {
    render(<SessionTimeout open={false} />)
    expect(screen.queryByText("Your session has expired")).not.toBeInTheDocument()
  })

  it("renders overlay content when open is true", () => {
    render(<SessionTimeout open />)
    expect(screen.getByText("Your session has expired")).toBeInTheDocument()
    expect(
      screen.getByText("Sign in again to continue where you left off.")
    ).toBeInTheDocument()
  })

  it("renders the Sign in button when open", () => {
    render(<SessionTimeout open />)
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument()
  })

  it("does not render Return home button when onReturnHome is not provided", () => {
    render(<SessionTimeout open />)
    expect(
      screen.queryByRole("button", { name: "Return home" })
    ).not.toBeInTheDocument()
  })

  it("renders Return home button when onReturnHome is provided", () => {
    render(<SessionTimeout open onReturnHome={() => {}} />)
    expect(
      screen.getByRole("button", { name: "Return home" })
    ).toBeInTheDocument()
  })

  it("calls onSignIn when Sign in button is clicked", async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn()
    render(<SessionTimeout open onSignIn={onSignIn} />)

    await user.click(screen.getByRole("button", { name: "Sign in" }))
    expect(onSignIn).toHaveBeenCalledOnce()
  })

  it("calls onReturnHome when Return home button is clicked", async () => {
    const user = userEvent.setup()
    const onReturnHome = vi.fn()
    render(<SessionTimeout open onReturnHome={onReturnHome} />)

    await user.click(screen.getByRole("button", { name: "Return home" }))
    expect(onReturnHome).toHaveBeenCalledOnce()
  })

  it("shows spinner and disables button during async onSignIn", async () => {
    const user = userEvent.setup()
    let resolveSignIn!: () => void
    const onSignIn = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSignIn = resolve
        })
    )

    render(<SessionTimeout open onSignIn={onSignIn} />)
    const btn = screen.getByRole("button", { name: "Sign in" })

    await user.click(btn)

    // Should be disabled and show "Signing in…" while pending
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Signing in/i })).toBeDisabled()
    })

    // Resolve the promise
    resolveSignIn()

    // Should return to normal after resolution
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign in" })).not.toBeDisabled()
    })
  })

  it("sets data-slot='session-timeout' on the content element", () => {
    render(<SessionTimeout open />)
    // The content element has the data-slot attribute
    const el = document.querySelector("[data-slot='session-timeout']")
    expect(el).not.toBeNull()
  })

  it("sets data-state='expired' when not redirecting", () => {
    render(<SessionTimeout open />)
    const el = document.querySelector("[data-slot='session-timeout']")
    expect(el).toHaveAttribute("data-state", "expired")
  })

  it("accepts custom signInLabel", () => {
    render(<SessionTimeout open signInLabel="Log in" />)
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument()
  })

  it("accepts custom returnHomeLabel", () => {
    render(
      <SessionTimeout
        open
        onReturnHome={() => {}}
        returnHomeLabel="Go home"
      />
    )
    expect(screen.getByRole("button", { name: "Go home" })).toBeInTheDocument()
  })

  it("disables Return home button while redirecting", async () => {
    const user = userEvent.setup()
    let resolveSignIn!: () => void
    const onSignIn = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSignIn = resolve
        })
    )

    render(<SessionTimeout open onSignIn={onSignIn} onReturnHome={() => {}} />)

    await user.click(screen.getByRole("button", { name: "Sign in" }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Return home" })).toBeDisabled()
    })

    resolveSignIn()
  })

  it("has accessible headline and description visible to screen readers", () => {
    render(<SessionTimeout open />)
    const headline = screen.getByText("Your session has expired")
    expect(headline.tagName).toBe("H2")
    expect(headline).toBeInTheDocument()
  })
})
