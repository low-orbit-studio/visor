import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { checkA11y } from "../../../test-utils/a11y"
import { HeroSection } from "../hero-section"

describe("HeroSection", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    render(<HeroSection heading="Welcome to Visor" />)
    expect(screen.getByRole("region")).toBeInTheDocument()
  })

  it("renders the heading", () => {
    render(<HeroSection heading="Build Beautiful Interfaces" />)
    expect(screen.getByText("Build Beautiful Interfaces")).toBeInTheDocument()
  })

  it("renders the subheading when provided", () => {
    render(
      <HeroSection
        heading="Build Beautiful Interfaces"
        subheading="A design system for the modern web."
      />
    )
    expect(screen.getByText("A design system for the modern web.")).toBeInTheDocument()
  })

  it("does not render subheading when omitted", () => {
    render(<HeroSection heading="Build Beautiful Interfaces" />)
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument()
  })

  // ─── Button ─────────────────────────────────────────────────────────

  it("renders button with href as anchor", () => {
    render(
      <HeroSection
        heading="Welcome"
        buttonText="Get Started"
        buttonHref="/start"
      />
    )
    const link = screen.getByRole("link", { name: "Get Started" })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/start")
  })

  it("renders button element when no buttonHref", () => {
    render(
      <HeroSection
        heading="Welcome"
        buttonText="Get Started"
      />
    )
    expect(screen.getByRole("button", { name: "Get Started" })).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("calls onButtonClick when button is clicked", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <HeroSection
        heading="Welcome"
        buttonText="Click Me"
        onButtonClick={handleClick}
      />
    )
    await user.click(screen.getByRole("button", { name: "Click Me" }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("does not render button when buttonText is omitted", () => {
    render(<HeroSection heading="Welcome" />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  // ─── Background video ────────────────────────────────────────────────

  it("renders video element when backgroundVideo is provided", () => {
    render(
      <HeroSection
        heading="Welcome"
        backgroundVideo="/hero.mp4"
      />
    )
    const video = document.querySelector("video")
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute("autoplay")
    // muted is a boolean property in jsdom, not reflected as an HTML attribute
    expect((video as HTMLVideoElement).muted).toBe(true)
    expect(video).toHaveAttribute("loop")
    expect(video?.querySelector("source")).toHaveAttribute("src", "/hero.mp4")
  })

  it("does not render video element when backgroundVideo is omitted", () => {
    render(<HeroSection heading="Welcome" />)
    expect(document.querySelector("video")).not.toBeInTheDocument()
  })

  // ─── Overlay ─────────────────────────────────────────────────────────

  it("renders overlay div when overlay=true and media is present", () => {
    const { container } = render(
      <HeroSection
        heading="Welcome"
        backgroundVideo="/hero.mp4"
        overlay={true}
      />
    )
    expect(container.querySelector(".overlay")).toBeInTheDocument()
  })

  it("does not render overlay when overlay=false", () => {
    const { container } = render(
      <HeroSection
        heading="Welcome"
        backgroundVideo="/hero.mp4"
        overlay={false}
      />
    )
    expect(container.querySelector(".overlay")).not.toBeInTheDocument()
  })

  it("does not render overlay when no media is present even if overlay=true", () => {
    const { container } = render(
      <HeroSection
        heading="Welcome"
        overlay={true}
      />
    )
    expect(container.querySelector(".overlay")).not.toBeInTheDocument()
  })

  // ─── Media class ─────────────────────────────────────────────────────

  it("applies withMedia class when backgroundVideo is provided", () => {
    const { container } = render(
      <HeroSection
        heading="Welcome"
        backgroundVideo="/hero.mp4"
      />
    )
    expect(container.firstChild).toHaveClass("withMedia")
  })

  it("applies withMedia class when backgroundImage is provided", () => {
    const { container } = render(
      <HeroSection
        heading="Welcome"
        backgroundImage="/hero.jpg"
      />
    )
    expect(container.firstChild).toHaveClass("withMedia")
  })

  it("does not apply withMedia class when no media is provided", () => {
    const { container } = render(<HeroSection heading="Welcome" />)
    expect(container.firstChild).not.toHaveClass("withMedia")
  })

  // ─── Background image ─────────────────────────────────────────────────

  it("applies backgroundImage as inline style when provided (no video)", () => {
    const { container } = render(
      <HeroSection
        heading="Welcome"
        backgroundImage="/hero.jpg"
      />
    )
    expect(container.firstChild).toHaveStyle({
      backgroundImage: "url(/hero.jpg)",
    })
  })

  it("does not apply backgroundImage style when video is also provided", () => {
    const { container } = render(
      <HeroSection
        heading="Welcome"
        backgroundImage="/hero.jpg"
        backgroundVideo="/hero.mp4"
      />
    )
    const style = (container.firstChild as HTMLElement).style.backgroundImage
    expect(style).toBe("")
  })

  // ─── Children ────────────────────────────────────────────────────────

  it("renders children below heading area", () => {
    render(
      <HeroSection heading="Welcome">
        <span data-testid="custom-child">Custom Badge</span>
      </HeroSection>
    )
    expect(screen.getByTestId("custom-child")).toBeInTheDocument()
  })

  // ─── className passthrough ───────────────────────────────────────────

  it("applies custom className to the root element", () => {
    const { container } = render(
      <HeroSection heading="Welcome" className="custom-class" />
    )
    expect(container.firstChild).toHaveClass("custom-class")
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks (no media)", async () => {
    const { container } = render(
      <HeroSection
        heading="Build Beautiful Interfaces"
        subheading="A design system for the modern web."
        buttonText="Get Started Free"
        buttonHref="/start"
      />
    )
    await checkA11y(container)
  })

  it("passes accessibility checks with image background", async () => {
    const { container } = render(
      <HeroSection
        heading="Build Beautiful Interfaces"
        subheading="A design system for the modern web."
        buttonText="Get Started Free"
        backgroundImage="/hero.jpg"
      />
    )
    await checkA11y(container)
  })
})
