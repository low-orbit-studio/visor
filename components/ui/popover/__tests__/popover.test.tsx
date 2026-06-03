import { render, screen, act } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverFooter } from "../popover"
import { Button } from "../../button/button"
import styles from "../popover.module.css"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Popover", () => {
  it("renders trigger without crashing", () => {
    render(
      <Popover>
        <PopoverTrigger>Click me</PopoverTrigger>
        <PopoverContent>Popover text</PopoverContent>
      </Popover>
    )
    expect(screen.getByText("Click me")).toBeInTheDocument()
  })

  it("applies data-slot to trigger", () => {
    render(
      <Popover>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    )
    expect(screen.getByText("Trigger")).toHaveAttribute("data-slot", "popover-trigger")
  })

  it("renders content with data-slot when open", () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>
    )
    const content = screen.getByText("Popover content")
    expect(content.closest("[data-slot='popover-content']")).toBeInTheDocument()
  })

  it("renders with custom className on content", () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent className="custom-popover">Popover text</PopoverContent>
      </Popover>
    )
    const content = screen.getByText("Popover text").closest("[data-slot='popover-content']")
    expect(content).toHaveClass("custom-popover")
  })

  it("renders PopoverAnchor", () => {
    render(
      <Popover>
        <PopoverAnchor>
          <span>Anchor element</span>
        </PopoverAnchor>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    )
    expect(screen.getByText("Anchor element")).toBeInTheDocument()
  })

  it("PopoverAnchor applies data-slot", () => {
    render(
      <Popover>
        <PopoverAnchor data-testid="anchor">
          <span>Anchor</span>
        </PopoverAnchor>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    )
    expect(screen.getByTestId("anchor")).toHaveAttribute("data-slot", "popover-anchor")
  })
})

describe("PopoverFooter", () => {
  it("renders with data-slot='popover-footer'", () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>
          <PopoverFooter data-testid="footer">
            <Button>Apply</Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    )
    expect(screen.getByTestId("footer")).toHaveAttribute("data-slot", "popover-footer")
  })

  it("merges className with the module footer class", () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>
          <PopoverFooter data-testid="footer" className="custom-footer">
            <Button>Apply</Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    )
    const footer = screen.getByTestId("footer")
    expect(footer).toHaveClass(styles.footer)
    expect(footer).toHaveClass("custom-footer")
  })

  it("forwards arbitrary div props", () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>
          <PopoverFooter data-testid="footer" aria-label="actions" role="group">
            <Button>Apply</Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    )
    const footer = screen.getByTestId("footer")
    expect(footer).toHaveAttribute("aria-label", "actions")
    expect(footer).toHaveAttribute("role", "group")
  })

  it("renders body and footer children in DOM order with footer last", () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>
          <div>body content</div>
          <PopoverFooter>
            <Button variant="ghost">Cancel</Button>
            <Button>Apply</Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    )
    const content = screen.getByText("body content").closest("[data-slot='popover-content']")
    const footer = content!.querySelector("[data-slot='popover-footer']")
    expect(content).toBeInTheDocument()
    expect(footer).toBeInTheDocument()
    // Footer is the last child of the content panel — body precedes it in DOM order.
    expect(content!.lastElementChild).toBe(footer)
  })

  it("keeps the primary action last in tab order (DOM-order convention)", () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>
          <PopoverFooter>
            <Button variant="ghost">Cancel</Button>
            <Button>Apply</Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    )
    const footer = screen
      .getByText("Apply")
      .closest("[data-slot='popover-footer']") as HTMLElement
    const buttons = Array.from(footer.querySelectorAll("button"))
    // Secondary (Cancel) precedes primary (Apply); primary is last focusable.
    expect(buttons.map((b) => b.textContent)).toEqual(["Cancel", "Apply"])
    expect(buttons[buttons.length - 1].textContent).toBe("Apply")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (closed state)", async () => {
    const { container } = render(
      <Popover>
        <PopoverTrigger asChild>
          <button>Open popover</button>
        </PopoverTrigger>
        <PopoverContent>Popover information</PopoverContent>
      </Popover>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (open state)", async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(
        <Popover open={true}>
          <PopoverTrigger asChild>
            <button>Open popover</button>
          </PopoverTrigger>
          <PopoverContent>Popover information</PopoverContent>
        </Popover>
      )
      container = result.container
    })
    await checkA11y(container!)
  })
})
