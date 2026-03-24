import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "../menubar"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Menubar", () => {
  it("renders menubar root", () => {
    const { container } = render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    )
    const menubar = container.querySelector('[data-slot="menubar"]')
    expect(menubar).toBeInTheDocument()
  })

  it("renders trigger with data-slot", () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger data-testid="trigger">File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    )
    expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "menubar-trigger")
  })

  it("renders multiple menu triggers", () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Undo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    )
    expect(screen.getByText("File")).toBeInTheDocument()
    expect(screen.getByText("Edit")).toBeInTheDocument()
  })

  it("shows items when trigger is clicked", async () => {
    const user = userEvent.setup()
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New</MenubarItem>
            <MenubarItem>
              Save
              <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    )
    await user.click(screen.getByText("File"))
    expect(screen.getByText("New")).toBeInTheDocument()
    expect(screen.getByText("Save")).toBeInTheDocument()
    expect(screen.getByText("⌘S")).toBeInTheDocument()
    expect(screen.getByText("⌘S")).toHaveAttribute("data-slot", "menubar-shortcut")
  })

  it("shows label and separator when menu is open", async () => {
    const user = userEvent.setup()
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarLabel>Actions</MenubarLabel>
            <MenubarItem>New</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Quit</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    )
    await user.click(screen.getByText("File"))
    expect(screen.getByText("Actions")).toBeInTheDocument()
  })

  it("shows checkbox items when menu is open", async () => {
    const user = userEvent.setup()
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem checked>Show Toolbar</MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    )
    await user.click(screen.getByText("View"))
    expect(screen.getByText("Show Toolbar")).toBeInTheDocument()
  })

  it("shows radio items when menu is open", async () => {
    const user = userEvent.setup()
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarRadioGroup value="a">
              <MenubarRadioItem value="a">Option A</MenubarRadioItem>
              <MenubarRadioItem value="b">Option B</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    )
    await user.click(screen.getByText("View"))
    expect(screen.getByText("Option A")).toBeInTheDocument()
    expect(screen.getByText("Option B")).toBeInTheDocument()
  })

  it("shows sub trigger when menu is open", async () => {
    const user = userEvent.setup()
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarSub>
              <MenubarSubTrigger>Share</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Email</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    )
    await user.click(screen.getByText("File"))
    expect(screen.getByText("Share")).toBeInTheDocument()
  })

  it("supports custom className on root", () => {
    const { container } = render(
      <Menubar className="custom-menubar">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    )
    const menubar = container.querySelector('[data-slot="menubar"]')
    expect(menubar).toHaveClass("custom-menubar")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (closed state)", async () => {
    const { container } = render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Undo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    )
    await checkA11y(container)
  })
})
