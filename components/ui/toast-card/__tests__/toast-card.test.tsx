import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ToastCard, ToastCardStack, toastCardVariants } from "../toast-card"

describe("ToastCard", () => {
  it("renders title text", () => {
    render(<ToastCard title="Changes saved" />)
    expect(screen.getByText("Changes saved")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<ToastCard title="Test" />)
    expect(document.querySelector("[data-slot='toast-card']")).toBeInTheDocument()
  })

  it("defaults to info variant", () => {
    render(<ToastCard title="Test" />)
    const card = document.querySelector("[data-slot='toast-card']")
    expect(card).toHaveAttribute("data-variant", "info")
  })

  it("applies success variant", () => {
    render(<ToastCard variant="success" title="Test" />)
    const card = document.querySelector("[data-slot='toast-card']")
    expect(card).toHaveAttribute("data-variant", "success")
  })

  it("applies error variant", () => {
    render(<ToastCard variant="error" title="Test" />)
    const card = document.querySelector("[data-slot='toast-card']")
    expect(card).toHaveAttribute("data-variant", "error")
  })

  it("applies warning variant", () => {
    render(<ToastCard variant="warning" title="Test" />)
    const card = document.querySelector("[data-slot='toast-card']")
    expect(card).toHaveAttribute("data-variant", "warning")
  })

  it("renders body text when provided", () => {
    render(<ToastCard title="Test" body="Supporting detail" />)
    expect(screen.getByText("Supporting detail")).toBeInTheDocument()
  })

  it("does not render body element when body is omitted", () => {
    render(<ToastCard title="Test" />)
    expect(document.querySelector("[data-slot='toast-card-body']")).toBeNull()
  })

  it("renders action button when action and onAction provided", () => {
    const handler = vi.fn()
    render(<ToastCard title="Test" action="Retry" onAction={handler} />)
    const btn = screen.getByText("Retry")
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(handler).toHaveBeenCalledOnce()
  })

  it("renders action as static text when onAction is omitted", () => {
    render(<ToastCard title="Test" action="View details" />)
    const btn = document.querySelector("[data-slot='toast-card-action']") as HTMLButtonElement
    expect(btn).toBeInTheDocument()
    // button rendered but with no functional onClick
    expect(btn.tagName).toBe("BUTTON")
  })

  it("does not render action element when action is omitted", () => {
    render(<ToastCard title="Test" />)
    expect(document.querySelector("[data-slot='toast-card-action']")).toBeNull()
  })

  it("renders dismiss button when onDismiss provided", () => {
    const handler = vi.fn()
    render(<ToastCard title="Test" onDismiss={handler} />)
    const btn = screen.getByLabelText("Dismiss notification")
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(handler).toHaveBeenCalledOnce()
  })

  it("does not render dismiss button when onDismiss is omitted", () => {
    render(<ToastCard title="Test" />)
    expect(screen.queryByLabelText("Dismiss notification")).toBeNull()
  })

  it("overrides default glyph via icon prop", () => {
    const CustomIcon = () => <svg data-testid="custom-icon" />
    render(<ToastCard title="Test" icon={<CustomIcon />} />)
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument()
  })

  it("renders default glyph when icon prop is omitted", () => {
    render(<ToastCard variant="success" title="Test" />)
    // Icon slot is rendered
    expect(document.querySelector("[data-slot='toast-card-icon']")).toBeInTheDocument()
  })

  it("has role=status and aria-live=polite", () => {
    render(<ToastCard title="Test" />)
    const card = document.querySelector("[data-slot='toast-card']")
    expect(card).toHaveAttribute("role", "status")
    expect(card).toHaveAttribute("aria-live", "polite")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<ToastCard ref={ref} title="Test" />)
    expect(ref.current).not.toBeNull()
  })

  it("passes additional className", () => {
    render(<ToastCard title="Test" className="my-card" />)
    const card = document.querySelector("[data-slot='toast-card']")
    expect(card).toHaveClass("my-card")
  })
})

describe("ToastCardStack", () => {
  it("renders children", () => {
    render(
      <ToastCardStack>
        <ToastCard title="First" />
        <ToastCard variant="error" title="Second" />
      </ToastCardStack>
    )
    expect(screen.getByText("First")).toBeInTheDocument()
    expect(screen.getByText("Second")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<ToastCardStack />)
    expect(document.querySelector("[data-slot='toast-card-stack']")).toBeInTheDocument()
  })

  it("applies top CSS variable when top prop provided", () => {
    render(<ToastCardStack top="2rem" />)
    const stack = document.querySelector("[data-slot='toast-card-stack']") as HTMLElement
    expect(stack.style.getPropertyValue("--toast-card-stack-top")).toBe("2rem")
  })

  it("applies gap CSS variable when gap prop provided", () => {
    render(<ToastCardStack gap="1rem" />)
    const stack = document.querySelector("[data-slot='toast-card-stack']") as HTMLElement
    expect(stack.style.getPropertyValue("--toast-card-stack-gap")).toBe("1rem")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<ToastCardStack ref={ref} />)
    expect(ref.current).not.toBeNull()
  })
})

describe("toastCardVariants", () => {
  it("exports the cva function", () => {
    expect(typeof toastCardVariants).toBe("function")
  })

  it("accepts all four variants without error", () => {
    expect(() => toastCardVariants({ variant: "success" })).not.toThrow()
    expect(() => toastCardVariants({ variant: "error" })).not.toThrow()
    expect(() => toastCardVariants({ variant: "info" })).not.toThrow()
    expect(() => toastCardVariants({ variant: "warning" })).not.toThrow()
  })
})
