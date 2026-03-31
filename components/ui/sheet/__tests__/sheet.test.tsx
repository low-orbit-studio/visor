import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "../sheet"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Sheet", () => {
  it("renders trigger correctly", () => {
    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent aria-describedby={undefined}>
          <SheetTitle>Title</SheetTitle>
        </SheetContent>
      </Sheet>
    )
    expect(screen.getByText("Open Sheet")).toBeInTheDocument()
  })

  it("renders trigger with data-slot attribute", () => {
    render(
      <Sheet>
        <SheetTrigger data-testid="trigger">Open</SheetTrigger>
        <SheetContent aria-describedby={undefined}>
          <SheetTitle>Title</SheetTitle>
        </SheetContent>
      </Sheet>
    )
    expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "sheet-trigger")
  })

  it("renders header and footer when open", () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet Description</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>Cancel</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
    expect(screen.getByText("Sheet Title")).toBeInTheDocument()
    expect(screen.getByText("Sheet Description")).toBeInTheDocument()
    expect(screen.getByText("Cancel")).toBeInTheDocument()
  })

  it("SheetTitle has correct data-slot", () => {
    render(
      <Sheet open>
        <SheetContent aria-describedby={undefined}>
          <SheetTitle>My Sheet</SheetTitle>
        </SheetContent>
      </Sheet>
    )
    expect(screen.getByText("My Sheet")).toHaveAttribute("data-slot", "sheet-title")
  })

  it("SheetContent renders with side data attribute", () => {
    render(
      <Sheet open>
        <SheetContent side="left" data-testid="sheet-content" aria-describedby={undefined}>
          <SheetTitle>Title</SheetTitle>
        </SheetContent>
      </Sheet>
    )
    const content = screen.getByTestId("sheet-content")
    expect(content).toHaveAttribute("data-side", "left")
  })

  it("shows close button by default", () => {
    render(
      <Sheet open>
        <SheetContent aria-describedby={undefined}>
          <SheetTitle>Title</SheetTitle>
        </SheetContent>
      </Sheet>
    )
    expect(screen.getByText("Close")).toBeInTheDocument()
  })

  it("hides close button when showCloseButton is false", () => {
    render(
      <Sheet open>
        <SheetContent showCloseButton={false} aria-describedby={undefined}>
          <SheetTitle>Title</SheetTitle>
        </SheetContent>
      </Sheet>
    )
    expect(screen.queryByText("Close")).not.toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (trigger/closed state)", async () => {
    const { container } = render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent aria-describedby={undefined}>
          <SheetTitle>Settings</SheetTitle>
        </SheetContent>
      </Sheet>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (open state)", async () => {
    const { container } = render(
      <Sheet open>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Settings Panel</SheetTitle>
            <SheetDescription>Configure your preferences below.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )
    await checkA11y(container)
  })
})
