import type * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../card"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Card", () => {
  it("renders with default props", () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText("Card content")).toBeInTheDocument()
  })

  it("renders with custom className", () => {
    render(<Card className="custom-class">Card</Card>)
    const card = screen.getByText("Card")
    expect(card).toHaveClass("custom-class")
  })

  it("applies data-slot attribute", () => {
    render(<Card>Card</Card>)
    const card = screen.getByText("Card")
    expect(card).toHaveAttribute("data-slot", "card")
  })

  it("applies data-size attribute for sm size", () => {
    render(<Card size="sm">Card</Card>)
    const card = screen.getByText("Card")
    expect(card).toHaveAttribute("data-size", "sm")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<Card ref={ref}>Card</Card>)
    expect(ref.current).not.toBeNull()
  })
})

describe("CardHeader", () => {
  it("renders children", () => {
    render(<CardHeader>Header content</CardHeader>)
    expect(screen.getByText("Header content")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<CardHeader>Header</CardHeader>)
    expect(screen.getByText("Header")).toHaveAttribute("data-slot", "card-header")
  })
})

describe("CardTitle", () => {
  it("renders title text", () => {
    render(<CardTitle>My Title</CardTitle>)
    expect(screen.getByText("My Title")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<CardTitle>Title</CardTitle>)
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "card-title")
  })
})

describe("CardDescription", () => {
  it("renders description text", () => {
    render(<CardDescription>My Description</CardDescription>)
    expect(screen.getByText("My Description")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<CardDescription>Desc</CardDescription>)
    expect(screen.getByText("Desc")).toHaveAttribute("data-slot", "card-description")
  })
})

describe("CardContent", () => {
  it("renders children", () => {
    render(<CardContent>Content body</CardContent>)
    expect(screen.getByText("Content body")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<CardContent>Content</CardContent>)
    expect(screen.getByText("Content")).toHaveAttribute("data-slot", "card-content")
  })
})

describe("CardFooter", () => {
  it("renders children", () => {
    render(<CardFooter>Footer content</CardFooter>)
    expect(screen.getByText("Footer content")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<CardFooter>Footer</CardFooter>)
    expect(screen.getByText("Footer")).toHaveAttribute("data-slot", "card-footer")
  })
})

describe("Card compound usage", () => {
  it("renders full card structure", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )
    expect(screen.getByText("Title")).toBeInTheDocument()
    expect(screen.getByText("Description")).toBeInTheDocument()
    expect(screen.getByText("Content")).toBeInTheDocument()
    expect(screen.getByText("Footer")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>A description of the card content.</CardDescription>
        </CardHeader>
        <CardContent>Main content area.</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>
    )
    await checkA11y(container)
  })
})

describe("Card glass and editable (VI-804)", () => {
  it("a plain Card renders no new children or attributes", () => {
    const { container } = render(<Card>Card</Card>)
    const card = container.firstElementChild!
    expect(card.tagName).toBe("DIV")
    expect(card.getAttributeNames().sort()).toEqual(["class", "data-size", "data-slot"])
    expect(card.childNodes).toHaveLength(1)
    expect(card.textContent).toBe("Card")
  })

  it("glass draws two aria-hidden layers before the children", () => {
    render(
      <Card variant="glass">
        <p>Inside</p>
      </Card>
    )
    const card = screen.getByText("Inside").parentElement!
    expect(card).toHaveAttribute("data-variant", "glass")
    const [glass, edge, content] = Array.from(card.children)
    expect(glass).toHaveAttribute("data-slot", "card-glass")
    expect(edge).toHaveAttribute("data-slot", "card-edge")
    expect(glass).toHaveAttribute("aria-hidden", "true")
    expect(edge).toHaveAttribute("aria-hidden", "true")
    expect(content).toHaveTextContent("Inside")
    // The layers are siblings of the content, never its ancestors.
    expect(glass.contains(content)).toBe(false)
  })

  it("editable renders a button with an aria-hidden pen", () => {
    render(<Card editable aria-label="Edit the venue">Venue</Card>)
    const card = screen.getByRole("button", { name: "Edit the venue" })
    expect(card).toHaveAttribute("type", "button")
    expect(card).toHaveAttribute("data-editable")
    const pen = card.querySelector('[data-slot="card-pen"]')!
    expect(pen).toHaveAttribute("aria-hidden", "true")
    expect(pen.querySelector("svg")).not.toBeNull()
    expect(card.lastElementChild).toBe(pen)
  })

  it("Enter and Space fire onClick on an editable card", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Card editable onClick={onClick}>Venue</Card>)
    screen.getByRole("button").focus()
    await user.keyboard("{Enter}")
    await user.keyboard(" ")
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it("respects as, and editable as a div gets no type", () => {
    const { rerender } = render(<Card as="main">Main</Card>)
    expect(screen.getByRole("main")).toHaveAttribute("data-slot", "card")
    rerender(<Card as="section" editable>Section</Card>)
    const section = screen.getByText("Section")
    expect(section.tagName).toBe("SECTION")
    expect(section).not.toHaveAttribute("type")
  })

  it("forwards the ref to the rendered element", () => {
    const ref = { current: null as HTMLElement | null }
    render(<Card ref={ref as React.Ref<HTMLDivElement>} editable>Venue</Card>)
    expect(ref.current?.tagName).toBe("BUTTON")
  })

  it("passes data-flash through", () => {
    render(<Card editable data-flash="">Venue</Card>)
    expect(screen.getByRole("button")).toHaveAttribute("data-flash", "")
  })

  it("glass and editable have no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <div>
        <Card variant="glass">
          <CardContent>Glass content.</CardContent>
        </Card>
        <Card variant="glass" editable aria-label="Edit the doors time">
          <span>Doors at nine</span>
        </Card>
      </div>
    )
    await checkA11y(container)
  })
})
