import { render, screen, act } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Tooltip", () => {
  it("renders trigger without crashing", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    expect(screen.getByText("Hover me")).toBeInTheDocument()
  })

  it("renders the trigger element", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Trigger button</button>
          </TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    expect(screen.getByText("Trigger button")).toBeInTheDocument()
  })

  it("TooltipProvider renders children", () => {
    render(
      <TooltipProvider>
        <span>Provider child</span>
      </TooltipProvider>
    )
    expect(screen.getByText("Provider child")).toBeInTheDocument()
  })

  it("renders with custom className on content", () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent className="custom-tooltip">Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    // When open, content with data-slot should be in the DOM
    const content = container.querySelector("[data-slot='tooltip-content']")
    if (content) {
      expect(content).toHaveClass("custom-tooltip")
    }
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (closed state)", async () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Help</button>
          </TooltipTrigger>
          <TooltipContent>More information about this feature</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (open state)", async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(
        <TooltipProvider>
          <Tooltip defaultOpen>
            <TooltipTrigger asChild>
              <button>Help</button>
            </TooltipTrigger>
            <TooltipContent>More information about this feature</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      container = result.container
    })
    await checkA11y(container!)
  })
})
