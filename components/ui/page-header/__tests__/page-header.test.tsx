import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { PageHeader } from "../page-header"

describe("PageHeader", () => {
  it("renders with just a title", () => {
    render(<PageHeader title="Customers" />)
    const heading = screen.getByRole("heading", { name: /customers/i })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe("H1")
  })

  it("renders as a <header> element by default", () => {
    const { container } = render(<PageHeader title="Dashboard" />)
    const root = container.querySelector('[data-slot="page-header"]')
    expect(root?.tagName).toBe("HEADER")
  })

  it("renders all slots when provided", () => {
    render(
      <PageHeader
        eyebrow="Blacklight Admin"
        title="Customers"
        description="Manage customer accounts."
        breadcrumb={<nav aria-label="Breadcrumb">crumbs</nav>}
        actions={<button type="button">Export</button>}
      />
    )
    expect(screen.getByText("Blacklight Admin")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /customers/i })).toBeInTheDocument()
    expect(screen.getByText("Manage customer accounts.")).toBeInTheDocument()
    expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument()
  })

  it("omits optional slots when not provided", () => {
    const { container } = render(<PageHeader title="Only" />)
    expect(
      container.querySelector('[data-slot="page-header-eyebrow"]')
    ).toBeNull()
    expect(
      container.querySelector('[data-slot="page-header-description"]')
    ).toBeNull()
    expect(
      container.querySelector('[data-slot="page-header-breadcrumb"]')
    ).toBeNull()
    expect(
      container.querySelector('[data-slot="page-header-actions"]')
    ).toBeNull()
  })

  it("renders with breadcrumb slot", () => {
    const { container } = render(
      <PageHeader
        title="Settings"
        breadcrumb={<nav aria-label="Breadcrumb">Home / Settings</nav>}
      />
    )
    const slot = container.querySelector('[data-slot="page-header-breadcrumb"]')
    expect(slot).not.toBeNull()
    expect(slot).toHaveTextContent("Home / Settings")
  })

  it("renders with actions slot", () => {
    render(
      <PageHeader
        title="Users"
        actions={
          <>
            <button type="button">Export</button>
            <button type="button">Invite</button>
          </>
        }
      />
    )
    expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /invite/i })).toBeInTheDocument()
  })

  it("passes through HTML attributes", () => {
    const { container } = render(
      <PageHeader
        title="Dashboard"
        id="page-head"
        aria-label="Dashboard header"
        className="custom-class"
      />
    )
    const root = container.querySelector('[data-slot="page-header"]')
    expect(root).toHaveAttribute("id", "page-head")
    expect(root).toHaveAttribute("aria-label", "Dashboard header")
    expect(root).toHaveClass("custom-class")
  })

  it("respects titleAs to change heading level", () => {
    render(<PageHeader title="Subsection" titleAs="h2" />)
    const h2 = screen.getByRole("heading", { level: 2, name: /subsection/i })
    expect(h2.tagName).toBe("H2")
  })

  it("respects as prop for root element", () => {
    const { container } = render(<PageHeader as="section" title="Section" />)
    const root = container.querySelector('[data-slot="page-header"]')
    expect(root?.tagName).toBe("SECTION")
  })

  it("forwards ref to the root element", () => {
    const ref = { current: null as HTMLElement | null }
    render(<PageHeader ref={ref} title="Ref" />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("HEADER")
  })

  it("produces semantic structure: heading inside root", () => {
    const { container } = render(
      <PageHeader eyebrow="Admin" title="Customers" description="Copy" />
    )
    const root = container.querySelector('[data-slot="page-header"]')
    const heading = root?.querySelector("h1")
    expect(heading).not.toBeNull()
    expect(heading?.textContent).toBe("Customers")
  })
})
