import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { CodeBlock } from "../code-block"
import { checkA11y } from "../../../../test-utils/a11y"

describe("CodeBlock", () => {
  it("renders code content", () => {
    render(<CodeBlock code="const x = 1" />)
    expect(screen.getByText("const x = 1")).toBeInTheDocument()
  })

  it("renders with language badge", () => {
    render(<CodeBlock code="const x = 1" language="typescript" />)
    expect(screen.getByText("typescript")).toBeInTheDocument()
  })

  it("renders with title", () => {
    render(<CodeBlock code="const x = 1" title="example.ts" />)
    expect(screen.getByText("example.ts")).toBeInTheDocument()
  })

  it("renders line numbers when enabled", () => {
    render(
      <CodeBlock code={"line one\nline two\nline three"} showLineNumbers />
    )
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("does not render line numbers by default", () => {
    render(<CodeBlock code="single line" />)
    expect(screen.queryByText("1")).not.toBeInTheDocument()
  })

  it("renders copy button by default", () => {
    render(<CodeBlock code="const x = 1" />)
    expect(screen.getByRole("button", { name: /copy code/i })).toBeInTheDocument()
  })

  it("hides copy button when showCopyButton is false", () => {
    render(<CodeBlock code="const x = 1" showCopyButton={false} />)
    expect(screen.queryByRole("button", { name: /copy/i })).not.toBeInTheDocument()
  })

  it("copies code to clipboard on button click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: { writeText },
    })

    render(<CodeBlock code="const x = 1" />)
    fireEvent.click(screen.getByRole("button", { name: /copy code/i }))

    expect(writeText).toHaveBeenCalledWith("const x = 1")
  })

  it("sets data-slot attribute", () => {
    const { container } = render(<CodeBlock code="x" />)
    expect(container.firstChild).toHaveAttribute("data-slot", "code-block")
  })

  it("sets data-language attribute", () => {
    const { container } = render(<CodeBlock code="x" language="js" />)
    expect(container.firstChild).toHaveAttribute("data-language", "js")
  })

  it("applies custom className", () => {
    const { container } = render(
      <CodeBlock code="x" className="custom-class" />
    )
    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("renders children instead of code when provided", () => {
    render(
      <CodeBlock code="raw code">
        <span>Custom highlighted content</span>
      </CodeBlock>
    )
    expect(screen.getByText("Custom highlighted content")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it("has no WCAG 2.1 AA violations (default)", async () => {
    const { container } = render(
      <CodeBlock code="const x = 1" language="typescript" />
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (with line numbers)", async () => {
    const { container } = render(
      <CodeBlock code={"line 1\nline 2"} showLineNumbers />
    )
    await checkA11y(container)
  })
})
