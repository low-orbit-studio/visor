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

  describe("titleSize", () => {
    it("does not set data-title-size when prop is omitted (byte-for-byte default)", () => {
      const { container } = render(<PageHeader title="Dashboard" />)
      const title = container.querySelector(
        '[data-slot="page-header-title"]'
      ) as HTMLElement
      expect(title).not.toBeNull()
      expect(title.hasAttribute("data-title-size")).toBe(false)
      // No inline style should be present for the custom property either.
      expect(title.style.getPropertyValue("--page-header-title-size")).toBe("")
    })

    it("sets data-title-size='marquee' when titleSize='marquee'", () => {
      const { container } = render(
        <PageHeader title="Tonight" titleSize="marquee" />
      )
      const title = container.querySelector(
        '[data-slot="page-header-title"]'
      ) as HTMLElement
      expect(title).toHaveAttribute("data-title-size", "marquee")
      // No raw-string override leaks into inline style for token cases.
      expect(title.style.getPropertyValue("--page-header-title-size")).toBe("")
    })

    it("sets data-title-size='default' when titleSize='default'", () => {
      const { container } = render(
        <PageHeader title="Customers" titleSize="default" />
      )
      const title = container.querySelector(
        '[data-slot="page-header-title"]'
      ) as HTMLElement
      expect(title).toHaveAttribute("data-title-size", "default")
    })

    it("forwards a raw string as inline --page-header-title-size", () => {
      const { container } = render(
        <PageHeader title="Events" titleSize="3rem" />
      )
      const title = container.querySelector(
        '[data-slot="page-header-title"]'
      ) as HTMLElement
      expect(title.style.getPropertyValue("--page-header-title-size")).toBe(
        "3rem"
      )
      // Raw-string mode also flips the title into the marquee rule so the
      // custom property actually applies.
      expect(title).toHaveAttribute("data-title-size", "marquee")
    })
  })

  describe("titleFamily", () => {
    it("does not set data-title-family when prop is omitted", () => {
      const { container } = render(<PageHeader title="Dashboard" />)
      const title = container.querySelector(
        '[data-slot="page-header-title"]'
      ) as HTMLElement
      expect(title.hasAttribute("data-title-family")).toBe(false)
      expect(title.style.getPropertyValue("--page-header-title-family")).toBe(
        ""
      )
    })

    it("sets data-title-family='display' when titleFamily='display'", () => {
      const { container } = render(
        <PageHeader title="Tonight" titleFamily="display" />
      )
      const title = container.querySelector(
        '[data-slot="page-header-title"]'
      ) as HTMLElement
      expect(title).toHaveAttribute("data-title-family", "display")
    })

    it("sets data-title-family='heading' when titleFamily='heading'", () => {
      const { container } = render(
        <PageHeader title="Customers" titleFamily="heading" />
      )
      const title = container.querySelector(
        '[data-slot="page-header-title"]'
      ) as HTMLElement
      expect(title).toHaveAttribute("data-title-family", "heading")
    })

    it("forwards a raw string as inline --page-header-title-family", () => {
      const { container } = render(
        <PageHeader title="Events" titleFamily="'ModernSociety', serif" />
      )
      const title = container.querySelector(
        '[data-slot="page-header-title"]'
      ) as HTMLElement
      expect(title.style.getPropertyValue("--page-header-title-family")).toBe(
        "'ModernSociety', serif"
      )
      expect(title).toHaveAttribute("data-title-family", "display")
    })
  })

  it("combines titleSize='marquee' and titleFamily='display' (editorial admin)", () => {
    const { container } = render(
      <PageHeader
        eyebrow="Sat · Apr 27"
        title="Tonight"
        titleSize="marquee"
        titleFamily="display"
      />
    )
    const title = container.querySelector(
      '[data-slot="page-header-title"]'
    ) as HTMLElement
    expect(title).toHaveAttribute("data-title-size", "marquee")
    expect(title).toHaveAttribute("data-title-family", "display")
  })
})
