import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import {
  StructuredPrompt,
  StructuredPromptHeader,
  StructuredPromptBody,
  StructuredPromptSlot,
  StructuredPromptHint,
} from "../structured-prompt"

describe("StructuredPrompt", () => {
  it("renders all sub-components together", () => {
    render(
      <StructuredPrompt>
        <StructuredPromptHeader>ONLINESS · THE SPEARHEAD</StructuredPromptHeader>
        <StructuredPromptBody>
          For{" "}
          <StructuredPromptSlot filled>design-led product teams</StructuredPromptSlot>
          , Visor is the only{" "}
          <StructuredPromptSlot filled>component system</StructuredPromptSlot>
          {" "}that{" "}
          <StructuredPromptSlot>derives every surface from one brand record</StructuredPromptSlot>.
        </StructuredPromptBody>
        <StructuredPromptHint>Click any slot to edit</StructuredPromptHint>
      </StructuredPrompt>
    )
    expect(screen.getByText("ONLINESS · THE SPEARHEAD")).toBeInTheDocument()
    expect(screen.getByText("design-led product teams")).toBeInTheDocument()
    expect(screen.getByText("component system")).toBeInTheDocument()
    expect(screen.getByText("derives every surface from one brand record")).toBeInTheDocument()
    expect(screen.getByText("Click any slot to edit")).toBeInTheDocument()
  })

  it("applies data-slot to root", () => {
    const { container } = render(<StructuredPrompt />)
    expect(container.querySelector('[data-slot="structured-prompt"]')).not.toBeNull()
  })

  it("applies data-slot to header", () => {
    const { container } = render(<StructuredPromptHeader>LABEL</StructuredPromptHeader>)
    expect(container.querySelector('[data-slot="structured-prompt-header"]')).not.toBeNull()
  })

  it("applies data-slot to body", () => {
    const { container } = render(<StructuredPromptBody>prose</StructuredPromptBody>)
    expect(container.querySelector('[data-slot="structured-prompt-body"]')).not.toBeNull()
  })

  it("applies data-slot to hint", () => {
    const { container } = render(<StructuredPromptHint>hint text</StructuredPromptHint>)
    expect(container.querySelector('[data-slot="structured-prompt-hint"]')).not.toBeNull()
  })

  it("forwards className to root", () => {
    const { container } = render(<StructuredPrompt className="custom" />)
    const root = container.querySelector('[data-slot="structured-prompt"]')
    expect(root).toHaveClass("custom")
  })

  it("renders icon in header when provided", () => {
    const { container } = render(
      <StructuredPromptHeader icon={<svg data-testid="icon" />}>LABEL</StructuredPromptHeader>
    )
    expect(container.querySelector('[data-slot="structured-prompt-header-icon"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="icon"]')).not.toBeNull()
  })

  it("does not render icon slot when no icon provided", () => {
    const { container } = render(<StructuredPromptHeader>LABEL</StructuredPromptHeader>)
    expect(container.querySelector('[data-slot="structured-prompt-header-icon"]')).toBeNull()
  })
})

describe("StructuredPromptSlot", () => {
  it("renders as a span when onClick is not provided", () => {
    const { container } = render(
      <StructuredPromptSlot filled>design-led product teams</StructuredPromptSlot>
    )
    const slot = container.querySelector('[data-slot="structured-prompt-slot"]')
    expect(slot?.tagName).toBe("SPAN")
  })

  it("renders as a button when onClick is provided", () => {
    const { container } = render(
      <StructuredPromptSlot filled onClick={() => {}}>design-led product teams</StructuredPromptSlot>
    )
    const slot = container.querySelector('[data-slot="structured-prompt-slot"]')
    expect(slot?.tagName).toBe("BUTTON")
  })

  it("calls onClick when button slot is clicked", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <StructuredPromptSlot filled onClick={handleClick}>click me</StructuredPromptSlot>
    )
    await user.click(screen.getByRole("button"))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("sets data-filled=true on filled slot", () => {
    const { container } = render(
      <StructuredPromptSlot filled>filled</StructuredPromptSlot>
    )
    const slot = container.querySelector('[data-slot="structured-prompt-slot"]')
    expect(slot?.getAttribute("data-filled")).toBe("true")
  })

  it("sets data-filled=false on empty slot", () => {
    const { container } = render(
      <StructuredPromptSlot>empty</StructuredPromptSlot>
    )
    const slot = container.querySelector('[data-slot="structured-prompt-slot"]')
    expect(slot?.getAttribute("data-filled")).toBe("false")
  })

  it("filled slot renders with filled class treatment (data attribute check)", () => {
    const { container } = render(
      <StructuredPromptSlot filled>filled value</StructuredPromptSlot>
    )
    const slot = container.querySelector('[data-filled="true"]')
    expect(slot).not.toBeNull()
  })

  it("empty slot renders with empty treatment (data attribute check)", () => {
    const { container } = render(
      <StructuredPromptSlot>placeholder text</StructuredPromptSlot>
    )
    const slot = container.querySelector('[data-filled="false"]')
    expect(slot).not.toBeNull()
  })

  it("button slot has type=button to prevent form submission", () => {
    const { container } = render(
      <StructuredPromptSlot onClick={() => {}}>click</StructuredPromptSlot>
    )
    const btn = container.querySelector("button")
    expect(btn?.getAttribute("type")).toBe("button")
  })
})
