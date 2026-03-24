import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Banner, BannerTitle, BannerDescription, BannerAction } from "../banner"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Banner", () => {
  it("renders with default props", () => {
    render(<Banner>Banner content</Banner>)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<Banner>Banner</Banner>)
    expect(screen.getByRole("status")).toHaveAttribute("data-slot", "banner")
  })

  it("renders with custom className", () => {
    render(<Banner className="custom-banner">Banner</Banner>)
    expect(screen.getByRole("status")).toHaveClass("custom-banner")
  })

  it("renders info intent (default)", () => {
    render(<Banner>Info banner</Banner>)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("renders warning intent", () => {
    render(<Banner intent="warning">Warning banner</Banner>)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("renders error intent", () => {
    render(<Banner intent="error">Error banner</Banner>)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("renders success intent", () => {
    render(<Banner intent="success">Success banner</Banner>)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("applies sticky position class", () => {
    render(<Banner position="sticky">Sticky banner</Banner>)
    const banner = screen.getByRole("status")
    expect(banner.className).toMatch(/positionSticky/)
  })

  it("uses role='status' for info intent", () => {
    render(<Banner intent="info">Info</Banner>)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("uses role='status' for success intent", () => {
    render(<Banner intent="success">Success</Banner>)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("uses role='alert' for warning intent", () => {
    render(<Banner intent="warning">Warning</Banner>)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("uses role='alert' for error intent", () => {
    render(<Banner intent="error">Error</Banner>)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<Banner ref={ref}>Banner</Banner>)
    expect(ref.current).not.toBeNull()
  })
})

describe("BannerTitle", () => {
  it("renders title text", () => {
    render(<BannerTitle>Important notice</BannerTitle>)
    expect(screen.getByText("Important notice")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<BannerTitle>Title</BannerTitle>)
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "banner-title")
  })
})

describe("BannerDescription", () => {
  it("renders description text", () => {
    render(<BannerDescription>This is a description</BannerDescription>)
    expect(screen.getByText("This is a description")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<BannerDescription>Desc</BannerDescription>)
    expect(screen.getByText("Desc")).toHaveAttribute("data-slot", "banner-description")
  })
})

describe("BannerAction", () => {
  it("renders action content", () => {
    render(<BannerAction><button>Dismiss</button></BannerAction>)
    expect(screen.getByText("Dismiss")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<BannerAction data-testid="action">Action</BannerAction>)
    expect(screen.getByTestId("action")).toHaveAttribute("data-slot", "banner-action")
  })
})

describe("Banner compound usage", () => {
  it("renders full banner structure", () => {
    render(
      <Banner intent="warning">
        <BannerTitle>Maintenance scheduled</BannerTitle>
        <BannerDescription>System will be down for 2 hours.</BannerDescription>
        <BannerAction><button>Dismiss</button></BannerAction>
      </Banner>
    )
    expect(screen.getByText("Maintenance scheduled")).toBeInTheDocument()
    expect(screen.getByText("System will be down for 2 hours.")).toBeInTheDocument()
    expect(screen.getByText("Dismiss")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (info intent)", async () => {
    const { container } = render(
      <Banner intent="info">
        <BannerTitle>Information</BannerTitle>
        <BannerDescription>This is an informational banner.</BannerDescription>
      </Banner>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (warning intent)", async () => {
    const { container } = render(
      <Banner intent="warning">
        <BannerTitle>Warning</BannerTitle>
        <BannerDescription>Please take caution.</BannerDescription>
      </Banner>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (error intent)", async () => {
    const { container } = render(
      <Banner intent="error">
        <BannerTitle>Error</BannerTitle>
        <BannerDescription>Something went wrong.</BannerDescription>
      </Banner>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (success intent)", async () => {
    const { container } = render(
      <Banner intent="success">
        <BannerTitle>Success</BannerTitle>
        <BannerDescription>Operation completed successfully.</BannerDescription>
      </Banner>
    )
    await checkA11y(container)
  })
})
