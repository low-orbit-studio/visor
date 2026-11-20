import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import React from "react"
import { Popover, PopoverTrigger, PopoverContent } from "../popover"
import styles from "../popover.module.css"
import { checkA11y } from "../../../../test-utils/a11y"

// VI-808: `forceMount` keeps the panel mounted in place; it fades, goes inert while
// closed, leaves focus on the trigger when it opens and hands focus back when it closes.
function AccountMenu(props: { defaultOpen?: boolean; onOpenChange?: (open: boolean) => void }) {
  return (
    <div data-testid="bar">
      <Popover {...props}>
        <PopoverTrigger>Your account</PopoverTrigger>
        <PopoverContent forceMount aria-label="Your account menu">
          <button type="button">Change Email</button>
          <button type="button">Sign Out</button>
        </PopoverContent>
      </Popover>
      <button type="button">Help</button>
    </div>
  )
}

const panel = () => document.querySelector<HTMLElement>("[data-slot='popover-content']")!

describe("Popover forceMount (stay mounted)", () => {
  it("keeps the closed panel in the DOM, inert and closed", () => {
    render(<AccountMenu />)
    expect(panel()).toBeInTheDocument()
    expect(panel()).toHaveAttribute("data-state", "closed")
    expect(panel()).toHaveAttribute("inert")
    expect(panel()).toHaveClass(styles.stayMounted)
  })

  it("renders in place, inside the element it sits in, not in a portal", () => {
    render(<AccountMenu />)
    expect(screen.getByTestId("bar")).toContainElement(panel())
  })

  it("does not move focus when it mounts", () => {
    render(<AccountMenu />)
    expect(document.activeElement).toBe(document.body)
  })

  it("opens without inert and leaves focus on the trigger", async () => {
    const user = userEvent.setup()
    render(<AccountMenu />)
    const trigger = screen.getByRole("button", { name: "Your account" })
    trigger.focus()
    await user.keyboard("{Enter}")
    expect(panel()).toHaveAttribute("data-state", "open")
    expect(panel()).not.toHaveAttribute("inert")
    expect(document.activeElement).toBe(trigger)
  })

  it("Tab from the open trigger reaches the first item", async () => {
    const user = userEvent.setup()
    render(<AccountMenu defaultOpen />)
    screen.getByRole("button", { name: "Your account" }).focus()
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Change Email" }))
  })

  it("Escape with focus inside closes it and returns focus to the trigger", async () => {
    const user = userEvent.setup()
    render(<AccountMenu defaultOpen />)
    screen.getByRole("button", { name: "Change Email" }).focus()
    await user.keyboard("{Escape}")
    expect(panel()).toHaveAttribute("data-state", "closed")
    expect(panel()).toHaveAttribute("inert")
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Your account" }))
  })

  it("an outside click closes it", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<AccountMenu defaultOpen onOpenChange={onOpenChange} />)
    await user.click(document.body)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(panel()).toHaveAttribute("data-state", "closed")
  })

  it("follows a controlled open prop", () => {
    const { rerender } = render(
      <Popover open={false}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent forceMount>Menu</PopoverContent>
      </Popover>
    )
    expect(panel()).toHaveAttribute("inert")
    rerender(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent forceMount>Menu</PopoverContent>
      </Popover>
    )
    expect(panel()).not.toHaveAttribute("inert")
  })

  it("still forwards refs to the trigger and the panel", () => {
    const triggerRef = React.createRef<HTMLButtonElement>()
    const panelRef = React.createRef<HTMLDivElement>()
    render(
      <Popover>
        <PopoverTrigger ref={triggerRef}>Open</PopoverTrigger>
        <PopoverContent forceMount ref={panelRef}>Menu</PopoverContent>
      </Popover>
    )
    expect(triggerRef.current).toBe(screen.getByRole("button", { name: "Open" }))
    expect(panelRef.current).toBe(panel())
  })

  it("has no accessibility violations, open or closed", async () => {
    const { container, rerender } = render(<AccountMenu />)
    await checkA11y(container)
    await act(async () => rerender(<AccountMenu defaultOpen />))
    screen.getByRole("button", { name: "Your account" }).click()
    await checkA11y(container)
  })
})

describe("Popover without forceMount (unchanged)", () => {
  it("still portals, unmounts on close and is never inert", async () => {
    const user = userEvent.setup()
    render(
      <div data-testid="bar">
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Menu</PopoverContent>
        </Popover>
      </div>
    )
    expect(document.querySelector("[data-slot='popover-content']")).toBeNull()
    await user.click(screen.getByRole("button", { name: "Open" }))
    expect(screen.getByTestId("bar")).not.toContainElement(panel())
    expect(panel()).not.toHaveAttribute("inert")
    expect(panel()).not.toHaveClass(styles.stayMounted)
  })
})
