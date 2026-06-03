import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Alert, AlertTitle, AlertDescription, AlertActions } from "../alert"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Alert", () => {
  it("renders with default props", () => {
    render(<Alert>Alert content</Alert>)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<Alert>Alert</Alert>)
    expect(screen.getByRole("alert")).toHaveAttribute("data-slot", "alert")
  })

  it("renders with custom className", () => {
    render(<Alert className="custom-alert">Alert</Alert>)
    expect(screen.getByRole("alert")).toHaveClass("custom-alert")
  })

  it("renders destructive variant", () => {
    render(<Alert variant="destructive">Destructive</Alert>)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("renders success variant", () => {
    render(<Alert variant="success">Success</Alert>)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("renders warning variant", () => {
    render(<Alert variant="warning">Warning</Alert>)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("renders info variant", () => {
    render(<Alert variant="info">Info</Alert>)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<Alert ref={ref}>Alert</Alert>)
    expect(ref.current).not.toBeNull()
  })
})

describe("AlertTitle", () => {
  it("renders title text", () => {
    render(<AlertTitle>Error occurred</AlertTitle>)
    expect(screen.getByText("Error occurred")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<AlertTitle>Title</AlertTitle>)
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "alert-title")
  })
})

describe("AlertDescription", () => {
  it("renders description text", () => {
    render(<AlertDescription>Something went wrong</AlertDescription>)
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<AlertDescription>Desc</AlertDescription>)
    expect(screen.getByText("Desc")).toHaveAttribute("data-slot", "alert-description")
  })
})

describe("AlertActions", () => {
  it("renders action content", () => {
    render(<AlertActions>Retry</AlertActions>)
    expect(screen.getByText("Retry")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<AlertActions>Actions</AlertActions>)
    expect(screen.getByText("Actions")).toHaveAttribute("data-slot", "alert-actions")
  })

  it("renders with custom className", () => {
    render(<AlertActions className="custom-actions">Actions</AlertActions>)
    expect(screen.getByText("Actions")).toHaveClass("custom-actions")
  })

  it("renders multiple right-aligned actions in a single slot", () => {
    render(
      <AlertActions>
        <button>Dismiss</button>
        <button>Retry</button>
      </AlertActions>
    )
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<AlertActions ref={ref}>Actions</AlertActions>)
    expect(ref.current).not.toBeNull()
  })
})

describe("Alert compound usage", () => {
  it("renders full alert structure", () => {
    render(
      <Alert>
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>You can add components.</AlertDescription>
      </Alert>
    )
    expect(screen.getByText("Heads up!")).toBeInTheDocument()
    expect(screen.getByText("You can add components.")).toBeInTheDocument()
  })

  it("renders an alert with a right-aligned actions slot", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Could not load data</AlertTitle>
        <AlertDescription>The request timed out.</AlertDescription>
        <AlertActions>
          <button>Dismiss</button>
          <button>Retry</button>
        </AlertActions>
      </Alert>
    )
    expect(screen.getByText("Could not load data")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (default)", async () => {
    const { container } = render(
      <Alert>
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>You can add components to your app.</AlertDescription>
      </Alert>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (destructive variant)", async () => {
    const { container } = render(
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (with actions)", async () => {
    const { container } = render(
      <Alert variant="destructive">
        <AlertTitle>Could not load data</AlertTitle>
        <AlertDescription>The request timed out.</AlertDescription>
        <AlertActions>
          <button type="button">Dismiss</button>
          <button type="button">Retry</button>
        </AlertActions>
      </Alert>
    )
    await checkA11y(container)
  })
})
