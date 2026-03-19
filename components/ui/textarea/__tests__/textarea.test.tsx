import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Textarea } from "../textarea"

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
})
