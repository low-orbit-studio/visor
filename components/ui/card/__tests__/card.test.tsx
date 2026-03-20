import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
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
