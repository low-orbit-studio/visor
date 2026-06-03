import { render, screen, act, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import React from "react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverFooter,
  PopoverSelectionList,
  PopoverSelectionItem,
  PopoverSelectionLabel,
} from "../popover"
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

// ─── PopoverSelectionList (D2 — mode prop + checkbox default) ───────────────

describe("PopoverSelectionList — mode prop", () => {
  it("renders role=listbox with aria-multiselectable=true in checkbox mode", () => {
    render(
      <PopoverSelectionList mode="checkbox" aria-label="Options">
        <PopoverSelectionItem>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    const list = screen.getByRole("listbox")
    expect(list).toHaveAttribute("aria-multiselectable", "true")
  })

  it("defaults to checkbox mode (aria-multiselectable present without explicit mode)", () => {
    render(
      <PopoverSelectionList aria-label="Options">
        <PopoverSelectionItem>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    const list = screen.getByRole("listbox")
    expect(list).toHaveAttribute("aria-multiselectable", "true")
  })

  it("does NOT render aria-multiselectable in radio mode", () => {
    render(
      <PopoverSelectionList mode="radio" aria-label="Options">
        <PopoverSelectionItem>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    const list = screen.getByRole("listbox")
    expect(list).not.toHaveAttribute("aria-multiselectable")
  })

  it("items have role=option", () => {
    render(
      <PopoverSelectionList aria-label="Options">
        <PopoverSelectionItem>Alpha</PopoverSelectionItem>
        <PopoverSelectionItem>Beta</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    const options = screen.getAllByRole("option")
    expect(options).toHaveLength(2)
  })
})

// ─── PopoverSelectionItem ARIA (D5 — aria-selected + aria-disabled) ─────────

describe("PopoverSelectionItem — ARIA attributes", () => {
  it("renders aria-selected=false by default", () => {
    render(
      <PopoverSelectionList aria-label="Items">
        <PopoverSelectionItem>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    expect(screen.getByRole("option")).toHaveAttribute("aria-selected", "false")
  })

  it("renders aria-selected=true when selected", () => {
    render(
      <PopoverSelectionList aria-label="Items">
        <PopoverSelectionItem selected>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    expect(screen.getByRole("option")).toHaveAttribute("aria-selected", "true")
  })

  it("renders aria-disabled=true when disabled", () => {
    render(
      <PopoverSelectionList aria-label="Items">
        <PopoverSelectionItem disabled>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    expect(screen.getByRole("option")).toHaveAttribute("aria-disabled", "true")
  })

  it("does not render aria-disabled when not disabled", () => {
    render(
      <PopoverSelectionList aria-label="Items">
        <PopoverSelectionItem>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    expect(screen.getByRole("option")).not.toHaveAttribute("aria-disabled")
  })
})

// ─── D2 — onSelect callback ──────────────────────────────────────────────────

describe("PopoverSelectionItem — onSelect (D2)", () => {
  it("calls onSelect(true) when clicking an unselected item", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <PopoverSelectionList mode="checkbox" aria-label="Options">
        <PopoverSelectionItem selected={false} onSelect={onSelect}>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    await user.click(screen.getByRole("option"))
    expect(onSelect).toHaveBeenCalledWith(true)
  })

  it("calls onSelect(false) when clicking a selected item", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <PopoverSelectionList mode="checkbox" aria-label="Options">
        <PopoverSelectionItem selected={true} onSelect={onSelect}>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    await user.click(screen.getByRole("option"))
    expect(onSelect).toHaveBeenCalledWith(false)
  })

  it("checkbox mode — three items — each click fires onSelect(true)", async () => {
    const handlers = [vi.fn(), vi.fn(), vi.fn()]
    const user = userEvent.setup()
    render(
      <PopoverSelectionList mode="checkbox" aria-label="Options">
        <PopoverSelectionItem selected={false} onSelect={handlers[0]}>Alpha</PopoverSelectionItem>
        <PopoverSelectionItem selected={false} onSelect={handlers[1]}>Beta</PopoverSelectionItem>
        <PopoverSelectionItem selected={false} onSelect={handlers[2]}>Gamma</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    const options = screen.getAllByRole("option")
    for (let i = 0; i < options.length; i++) {
      await user.click(options[i])
    }
    handlers.forEach((h) => expect(h).toHaveBeenCalledWith(true))
  })

  it("does NOT call onSelect when item is disabled", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <PopoverSelectionList aria-label="Options">
        <PopoverSelectionItem disabled onSelect={onSelect}>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    await user.click(screen.getByRole("option"))
    expect(onSelect).not.toHaveBeenCalled()
  })
})

// ─── D6 — count slot ─────────────────────────────────────────────────────────

describe("PopoverSelectionItem — count slot (D6)", () => {
  it("renders count when provided", () => {
    render(
      <PopoverSelectionList aria-label="Options">
        <PopoverSelectionItem count={42}>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("renders string count", () => {
    render(
      <PopoverSelectionList aria-label="Options">
        <PopoverSelectionItem count="99+">Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    expect(screen.getByText("99+")).toBeInTheDocument()
  })

  it("does not render count slot when omitted", () => {
    render(
      <PopoverSelectionList aria-label="Options">
        <PopoverSelectionItem>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    // Verify no aria-hidden count span is in the DOM (count=undefined)
    const option = screen.getByRole("option")
    const countEl = option.querySelector("[aria-hidden='true']:not(.selectionIndicator)")
    // The indicator has aria-hidden; count span would also have it.
    // We check there's only one aria-hidden child (the indicator).
    const hiddenChildren = Array.from(option.querySelectorAll("[aria-hidden='true']"))
    // Only the indicator (and potentially leading icon) should have aria-hidden, not a count
    // Just assert the text "undefined" is not rendered.
    expect(option.textContent).not.toContain("undefined")
    // Clean assertion: the count text node won't appear
    expect(countEl).toBeNull()
  })

  it("renders leadingIcon when provided", () => {
    render(
      <PopoverSelectionList aria-label="Options">
        <PopoverSelectionItem leadingIcon={<span data-testid="icon" />}>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    expect(screen.getByTestId("icon")).toBeInTheDocument()
  })
})

// ─── D3 — Keyboard navigation ────────────────────────────────────────────────

describe("PopoverSelectionItem — keyboard navigation (D3)", () => {
  it("ArrowDown moves focus to next item", () => {
    render(
      <PopoverSelectionList aria-label="Nav">
        <PopoverSelectionItem>Alpha</PopoverSelectionItem>
        <PopoverSelectionItem>Beta</PopoverSelectionItem>
        <PopoverSelectionItem>Gamma</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    const options = screen.getAllByRole("option")
    options[0].focus()
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "ArrowDown" })
    expect(options[1]).toHaveFocus()
  })

  it("ArrowUp moves focus to previous item", () => {
    render(
      <PopoverSelectionList aria-label="Nav">
        <PopoverSelectionItem>Alpha</PopoverSelectionItem>
        <PopoverSelectionItem>Beta</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    const options = screen.getAllByRole("option")
    // Focus second item first
    options[1].focus()
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "ArrowUp" })
    expect(options[0]).toHaveFocus()
  })

  it("Home jumps to first item", () => {
    render(
      <PopoverSelectionList aria-label="Nav">
        <PopoverSelectionItem>Alpha</PopoverSelectionItem>
        <PopoverSelectionItem>Beta</PopoverSelectionItem>
        <PopoverSelectionItem>Gamma</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    const options = screen.getAllByRole("option")
    options[2].focus()
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Home" })
    expect(options[0]).toHaveFocus()
  })

  it("End jumps to last item", () => {
    render(
      <PopoverSelectionList aria-label="Nav">
        <PopoverSelectionItem>Alpha</PopoverSelectionItem>
        <PopoverSelectionItem>Beta</PopoverSelectionItem>
        <PopoverSelectionItem>Gamma</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    const options = screen.getAllByRole("option")
    options[0].focus()
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "End" })
    expect(options[2]).toHaveFocus()
  })

  it("Enter activates the focused item", () => {
    const onSelect = vi.fn()
    render(
      <PopoverSelectionList aria-label="Nav">
        <PopoverSelectionItem selected={false} onSelect={onSelect}>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    const option = screen.getByRole("option")
    option.focus()
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Enter" })
    expect(onSelect).toHaveBeenCalledWith(true)
  })

  it("Space activates the focused item", () => {
    const onSelect = vi.fn()
    render(
      <PopoverSelectionList aria-label="Nav">
        <PopoverSelectionItem selected={false} onSelect={onSelect}>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    const option = screen.getByRole("option")
    option.focus()
    fireEvent.keyDown(screen.getByRole("listbox"), { key: " " })
    expect(onSelect).toHaveBeenCalledWith(true)
  })
})

// ─── D8 — Disabled item skipped by keyboard nav ──────────────────────────────

describe("PopoverSelectionItem — disabled items skipped by keyboard nav (D8)", () => {
  it("ArrowDown skips disabled items", () => {
    const onSelect = vi.fn()
    render(
      <PopoverSelectionList aria-label="Nav">
        <PopoverSelectionItem>Alpha</PopoverSelectionItem>
        <PopoverSelectionItem disabled onSelect={onSelect}>Beta (disabled)</PopoverSelectionItem>
        <PopoverSelectionItem>Gamma</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    const options = screen.getAllByRole("option")
    options[0].focus()
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "ArrowDown" })
    // Should skip disabled Beta and go to Gamma
    expect(options[2]).toHaveFocus()
  })

  it("Enter does NOT activate a disabled item", () => {
    const onSelect = vi.fn()
    render(
      <PopoverSelectionList aria-label="Nav">
        <PopoverSelectionItem disabled onSelect={onSelect}>Alpha</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    const option = screen.getByRole("option")
    option.focus()
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Enter" })
    expect(onSelect).not.toHaveBeenCalled()
  })
})

// ─── PopoverSelectionLabel ───────────────────────────────────────────────────

describe("PopoverSelectionLabel", () => {
  it("renders label text", () => {
    render(<PopoverSelectionLabel>My Section</PopoverSelectionLabel>)
    expect(screen.getByText("My Section")).toBeInTheDocument()
  })

  it("applies data-slot", () => {
    render(<PopoverSelectionLabel>Label</PopoverSelectionLabel>)
    expect(screen.getByText("Label")).toHaveAttribute("data-slot", "popover-selection-label")
  })
})

// ─── Accessibility ────────────────────────────────────────────────────────────

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

  it("SelectionList listbox — no WCAG 2.1 AA violations (checkbox mode)", async () => {
    const { container } = render(
      <PopoverSelectionList mode="checkbox" aria-label="Filter options">
        <PopoverSelectionItem selected={false}>Alpha</PopoverSelectionItem>
        <PopoverSelectionItem selected={true}>Beta</PopoverSelectionItem>
        <PopoverSelectionItem disabled>Gamma (disabled)</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    await checkA11y(container)
  })

  it("SelectionList listbox — no WCAG 2.1 AA violations (radio mode)", async () => {
    const { container } = render(
      <PopoverSelectionList mode="radio" aria-label="Filter options">
        <PopoverSelectionItem selected={true}>Alpha</PopoverSelectionItem>
        <PopoverSelectionItem selected={false}>Beta</PopoverSelectionItem>
      </PopoverSelectionList>
    )
    await checkA11y(container)
  })
})
