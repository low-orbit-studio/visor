import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { BrowserFrame } from "../browser-frame"

describe("BrowserFrame", () => {
  it("renders children inside the frame", () => {
    render(
      <BrowserFrame url="test.example.com">
        <div data-testid="content">Content</div>
      </BrowserFrame>
    )
    expect(screen.getByTestId("content")).toBeInTheDocument()
  })

  it("renders the display URL in the pill", () => {
    render(
      <BrowserFrame url="sharlese.epk.pro">
        <div />
      </BrowserFrame>
    )
    expect(screen.getByText("sharlese.epk.pro")).toBeInTheDocument()
  })

  it("renders traffic-light dots as aria-hidden", () => {
    const { container } = render(
      <BrowserFrame url="test.example.com">
        <div />
      </BrowserFrame>
    )
    const dots = container.querySelector("[aria-hidden='true']")
    expect(dots).toBeInTheDocument()
  })

  it("renders no link when href is absent", () => {
    render(
      <BrowserFrame url="test.example.com">
        <div />
      </BrowserFrame>
    )
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("renders a link when href is provided", () => {
    render(
      <BrowserFrame url="test.example.com" href="https://test.example.com">
        <div />
      </BrowserFrame>
    )
    const link = screen.getByRole("link")
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "https://test.example.com")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("link has accessible label including the url", () => {
    render(
      <BrowserFrame url="test.example.com" href="https://test.example.com">
        <div />
      </BrowserFrame>
    )
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("aria-label", "Open test.example.com (opens in new tab)")
  })

  it("applies additional className to outer wrapper", () => {
    const { container } = render(
      <BrowserFrame url="test.example.com" className="lit">
        <div />
      </BrowserFrame>
    )
    expect(container.firstElementChild).toHaveClass("lit")
  })
})
