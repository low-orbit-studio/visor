import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "../context-menu"
import { checkA11y } from "../../../../test-utils/a11y"

function openContextMenu() {
  const trigger = screen.getByTestId("trigger")
  fireEvent.contextMenu(trigger)
}

describe("ContextMenu", () => {
  it("renders trigger correctly", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="trigger">Right-click me</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Item 1</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
    expect(screen.getByText("Right-click me")).toBeInTheDocument()
  })

  it("trigger has correct data-slot", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="trigger">Right-click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Item</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
    expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "context-menu-trigger")
  })

  it("renders items when open", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="trigger">Right-click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuLabel>Group Label</ContextMenuLabel>
            <ContextMenuItem>Item 1</ContextMenuItem>
            <ContextMenuItem>Item 2</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    )
    openContextMenu()
    expect(screen.getByText("Group Label")).toBeInTheDocument()
    expect(screen.getByText("Item 1")).toBeInTheDocument()
    expect(screen.getByText("Item 2")).toBeInTheDocument()
    expect(screen.getByText("Delete")).toBeInTheDocument()
  })

  it("ContextMenuItem has data-slot attribute", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="trigger">Right-click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem data-testid="item">My Item</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
    openContextMenu()
    expect(screen.getByTestId("item")).toHaveAttribute("data-slot", "context-menu-item")
  })

  it("ContextMenuShortcut renders correctly", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="trigger">Right-click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>
            Copy
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
    openContextMenu()
    expect(screen.getByText("⌘C")).toBeInTheDocument()
  })

  it("ContextMenuCheckboxItem renders when open", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="trigger">Right-click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuCheckboxItem checked>Check me</ContextMenuCheckboxItem>
        </ContextMenuContent>
      </ContextMenu>
    )
    openContextMenu()
    expect(screen.getByText("Check me")).toBeInTheDocument()
  })

  it("ContextMenuRadioItem renders when open", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="trigger">Right-click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuRadioGroup value="a">
            <ContextMenuRadioItem value="a">Option A</ContextMenuRadioItem>
            <ContextMenuRadioItem value="b">Option B</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
    )
    openContextMenu()
    expect(screen.getByText("Option A")).toBeInTheDocument()
    expect(screen.getByText("Option B")).toBeInTheDocument()
  })

  it("ContextMenuSub renders sub trigger when open", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="trigger">Right-click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSub>
            <ContextMenuSubTrigger>More</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Sub Item</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    )
    openContextMenu()
    expect(screen.getByText("More")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (trigger/closed state)", async () => {
    const { container } = render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="trigger">Right-click me</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Item 1</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (open state)", async () => {
    const { container } = render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="trigger">Right-click me</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuLabel>Actions</ContextMenuLabel>
            <ContextMenuItem>Edit</ContextMenuItem>
            <ContextMenuItem>Duplicate</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    )
    await act(async () => {
      openContextMenu()
    })
    await checkA11y(container)
  })
})
