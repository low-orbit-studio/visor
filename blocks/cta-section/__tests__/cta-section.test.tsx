import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { checkA11y } from "../../../test-utils/a11y"
import { CtaSection } from "../cta-section"

describe("CtaSection", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    render(<CtaSection heading="Get Started" buttonText="Sign Up" />)
    expect(screen.getByRole("region")).toBeInTheDocument()
  })

  it("renders the heading", () => {
    render(<CtaSection heading="Get Started Today" buttonText="Sign Up" />)
    expect(screen.getByText("Get Started Today")).toBeInTheDocument()
  })

  it("renders the description when provided", () => {
    render(
      <CtaSection
        heading="Get Started"
        description="Join thousands of happy users."
        buttonText="Sign Up"
      />
    )
    expect(screen.getByText("Join thousands of happy users.")).toBeInTheDocument()
  })

  it("does not render description when omitted", () => {
    render(<CtaSection heading="Get Started" buttonText="Sign Up" />)
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument()
  })

  it("renders the button with correct text", () => {
    render(<CtaSection heading="Get Started" buttonText="Sign Up Now" />)
    expect(screen.getByRole("button", { name: "Sign Up Now" })).toBeInTheDocument()
  })

  // ─── Button as link ─────────────────────────────────────────────────

  it("renders button as anchor when buttonHref is provided", () => {
    render(
      <CtaSection
        heading="Get Started"
        buttonText="Sign Up"
        buttonHref="/signup"
      />
    )
    const link = screen.getByRole("link", { name: "Sign Up" })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/signup")
  })

  it("renders button element (not anchor) when no buttonHref", () => {
    render(<CtaSection heading="Get Started" buttonText="Sign Up" />)
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  // ─── Click callback ──────────────────────────────────────────────────

  it("calls onButtonClick when button is clicked", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <CtaSection
        heading="Get Started"
        buttonText="Sign Up"
        onButtonClick={handleClick}
      />
    )
    await user.click(screen.getByRole("button", { name: "Sign Up" }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  // ─── className passthrough ───────────────────────────────────────────

  it("applies custom className to the root element", () => {
    const { container } = render(
      <CtaSection
        heading="Get Started"
        buttonText="Sign Up"
        className="custom-class"
      />
    )
    expect(container.firstChild).toHaveClass("custom-class")
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks", async () => {
    const { container } = render(
      <CtaSection
        heading="Ready to get started?"
        description="Join thousands of happy users today."
        buttonText="Sign Up Free"
      />
    )
    await checkA11y(container)
  })

  it("passes accessibility checks with link button", async () => {
    const { container } = render(
      <CtaSection
        heading="Ready to get started?"
        description="Join thousands of happy users today."
        buttonText="Sign Up Free"
        buttonHref="/signup"
      />
    )
    await checkA11y(container)
  })
})
