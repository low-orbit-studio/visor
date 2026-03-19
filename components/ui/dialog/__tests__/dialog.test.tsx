import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../dialog"

describe("Dialog", () => {
  it("renders trigger correctly", () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText("Open Dialog")).toBeInTheDocument()
  })

  it("renders with data-slot attribute on root", () => {
    render(
      <Dialog>
        <DialogTrigger data-testid="trigger">Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    const trigger = screen.getByTestId("trigger")
    expect(trigger).toHaveAttribute("data-slot", "dialog-trigger")
  })

  it("DialogHeader renders children", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>My Title</DialogTitle>
            <DialogDescription>My Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText("My Title")).toBeInTheDocument()
    expect(screen.getByText("My Description")).toBeInTheDocument()
  })

  it("DialogTitle has data-slot attribute", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Test Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    const title = screen.getByText("Test Title")
    expect(title).toHaveAttribute("data-slot", "dialog-title")
  })

  it("DialogDescription has data-slot attribute", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Test Description</DialogDescription>
        </DialogContent>
      </Dialog>
    )
    const desc = screen.getByText("Test Description")
    expect(desc).toHaveAttribute("data-slot", "dialog-description")
  })

  it("DialogContent shows close button", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText("Close")).toBeInTheDocument()
  })

  it("DialogClose renders correctly", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
        <DialogClose data-testid="close-btn">Close</DialogClose>
      </Dialog>
    )
    expect(screen.getByTestId("close-btn")).toHaveAttribute("data-slot", "dialog-close")
  })
})
