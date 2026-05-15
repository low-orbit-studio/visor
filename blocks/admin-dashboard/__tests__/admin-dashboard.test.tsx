import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { AdminDashboard } from "../admin-dashboard"
import { checkA11y } from "../../../test-utils/a11y"

const mockStats = [
  { id: "s1", label: "Total Users", value: "1,234" },
  { id: "s2", label: "Active Projects", value: "42" },
  { id: "s3", label: "Revenue", value: "$98,000" },
]

const mockActivities = [
  { id: "a1", title: "User joined", timestamp: "2m ago" },
  { id: "a2", title: "Project created", timestamp: "5m ago" },
]

describe("AdminDashboard", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    const { container } = render(
      <AdminDashboard title="Dashboard" stats={mockStats} activities={mockActivities} />
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders the page title", () => {
    render(<AdminDashboard title="Overview" stats={mockStats} activities={mockActivities} />)
    expect(screen.getByText("Overview")).toBeInTheDocument()
  })

  it("renders eyebrow when provided", () => {
    render(
      <AdminDashboard
        title="Dashboard"
        eyebrow="Admin"
        stats={mockStats}
        activities={mockActivities}
      />
    )
    expect(screen.getByText("Admin")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <AdminDashboard
        title="Dashboard"
        description="Monitor your key metrics."
        stats={mockStats}
        activities={mockActivities}
      />
    )
    expect(screen.getByText("Monitor your key metrics.")).toBeInTheDocument()
  })

  // ─── Stats ──────────────────────────────────────────────────────────

  it("renders all stat cards", () => {
    render(<AdminDashboard title="Dashboard" stats={mockStats} activities={mockActivities} />)
    expect(screen.getByText("Total Users")).toBeInTheDocument()
    expect(screen.getByText("Active Projects")).toBeInTheDocument()
    expect(screen.getByText("Revenue")).toBeInTheDocument()
  })

  it("renders stat values", () => {
    render(<AdminDashboard title="Dashboard" stats={mockStats} activities={mockActivities} />)
    expect(screen.getByText("1,234")).toBeInTheDocument()
    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("does not render stat grid when stats array is empty", () => {
    const { container } = render(
      <AdminDashboard title="Dashboard" stats={[]} activities={mockActivities} />
    )
    expect(container.querySelector("[data-slot='admin-dashboard-stats']")).not.toBeInTheDocument()
  })

  it("renders stat grid data-count attribute", () => {
    const { container } = render(
      <AdminDashboard title="Dashboard" stats={mockStats} activities={mockActivities} />
    )
    const grid = container.querySelector("[data-slot='admin-dashboard-stats']")
    expect(grid).toHaveAttribute("data-count", "3")
  })

  // ─── Activity feed ──────────────────────────────────────────────────

  it("renders activity items", () => {
    render(<AdminDashboard title="Dashboard" stats={mockStats} activities={mockActivities} />)
    expect(screen.getByText("User joined")).toBeInTheDocument()
    expect(screen.getByText("Project created")).toBeInTheDocument()
  })

  it("renders default activity section heading", () => {
    render(<AdminDashboard title="Dashboard" stats={mockStats} activities={mockActivities} />)
    expect(screen.getByText("Recent activity")).toBeInTheDocument()
  })

  it("renders custom activityTitle", () => {
    render(
      <AdminDashboard
        title="Dashboard"
        stats={mockStats}
        activities={mockActivities}
        activityTitle="Latest events"
      />
    )
    expect(screen.getByText("Latest events")).toBeInTheDocument()
  })

  it("renders empty state when activities array is empty", () => {
    render(<AdminDashboard title="Dashboard" stats={mockStats} activities={[]} />)
    expect(screen.getByText("No recent activity")).toBeInTheDocument()
  })

  it("renders custom activityEmptyState when provided", () => {
    render(
      <AdminDashboard
        title="Dashboard"
        stats={mockStats}
        activities={[]}
        activityEmptyState={<div>Nothing here yet.</div>}
      />
    )
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument()
  })

  it("renders View all link when activityViewAllHref is provided", () => {
    render(
      <AdminDashboard
        title="Dashboard"
        stats={mockStats}
        activities={mockActivities}
        activityViewAllHref="/activity"
      />
    )
    const link = screen.getByRole("link", { name: "View all" })
    expect(link).toHaveAttribute("href", "/activity")
  })

  // ─── Secondary region ────────────────────────────────────────────────

  it("renders secondaryRegion when provided", () => {
    render(
      <AdminDashboard
        title="Dashboard"
        stats={mockStats}
        activities={mockActivities}
        secondaryRegion={<div>Charts area</div>}
      />
    )
    expect(screen.getByText("Charts area")).toBeInTheDocument()
  })

  // ─── data-slot ──────────────────────────────────────────────────────

  it("sets data-slot on root element", () => {
    const { container } = render(
      <AdminDashboard title="Dashboard" stats={mockStats} activities={mockActivities} />
    )
    expect(container.firstChild).toHaveAttribute("data-slot", "admin-dashboard")
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks", async () => {
    const { container } = render(
      <AdminDashboard
        title="Dashboard"
        eyebrow="Admin"
        description="Monitor your key metrics."
        stats={mockStats}
        activities={mockActivities}
      />
    )
    await checkA11y(container)
  })

  // ─── Layout: single (default) ───────────────────────────────────────

  it("defaults to layout=\"single\" and renders the activity section", () => {
    const { container } = render(
      <AdminDashboard title="Dashboard" stats={mockStats} activities={mockActivities} />
    )
    expect(container.firstChild).toHaveAttribute("data-layout", "single")
    expect(
      container.querySelector("[data-slot='admin-dashboard-activity']")
    ).toBeInTheDocument()
    expect(
      container.querySelector("[data-slot='admin-dashboard-body']")
    ).not.toBeInTheDocument()
  })

  it("layout=\"single\" preserves existing secondaryRegion rendering", () => {
    const { container } = render(
      <AdminDashboard
        title="Dashboard"
        stats={mockStats}
        activities={mockActivities}
        secondaryRegion={<div>Charts area</div>}
        layout="single"
      />
    )
    expect(screen.getByText("Charts area")).toBeInTheDocument()
    expect(
      container.querySelector("[data-slot='admin-dashboard-secondary']")
    ).toBeInTheDocument()
  })

  // ─── Layout: split ──────────────────────────────────────────────────

  it("layout=\"split\" renders mainCol and sideCol slots", () => {
    const { container } = render(
      <AdminDashboard
        title="Dashboard"
        stats={mockStats}
        activities={[]}
        layout="split"
        mainCol={<div>Main content</div>}
        sideCol={<div>Side rail</div>}
      />
    )

    expect(container.firstChild).toHaveAttribute("data-layout", "split")
    expect(screen.getByText("Main content")).toBeInTheDocument()
    expect(screen.getByText("Side rail")).toBeInTheDocument()

    const body = container.querySelector("[data-slot='admin-dashboard-body']")
    expect(body).toBeInTheDocument()
    expect(body).toHaveAttribute("data-layout", "split")
    expect(
      container.querySelector("[data-slot='admin-dashboard-main-col']")
    ).toBeInTheDocument()
    expect(
      container.querySelector("[data-slot='admin-dashboard-side-col']")
    ).toBeInTheDocument()
  })

  it("layout=\"split\" does not render the activity section or secondaryRegion", () => {
    const { container } = render(
      <AdminDashboard
        title="Dashboard"
        stats={mockStats}
        activities={[]}
        layout="split"
        mainCol={<div>Main</div>}
        sideCol={<div>Side</div>}
      />
    )

    expect(
      container.querySelector("[data-slot='admin-dashboard-activity']")
    ).not.toBeInTheDocument()
    expect(
      container.querySelector("[data-slot='admin-dashboard-secondary']")
    ).not.toBeInTheDocument()
    expect(screen.queryByText("Recent activity")).not.toBeInTheDocument()
  })

  it("layout=\"split\" still renders KPI strip above the body", () => {
    const { container } = render(
      <AdminDashboard
        title="Dashboard"
        stats={mockStats}
        activities={[]}
        layout="split"
        mainCol={<div>Main</div>}
        sideCol={<div>Side</div>}
      />
    )

    const statGrid = container.querySelector(
      "[data-slot='admin-dashboard-stats']"
    )
    const body = container.querySelector("[data-slot='admin-dashboard-body']")
    expect(statGrid).toBeInTheDocument()
    expect(body).toBeInTheDocument()
    // statGrid appears before body in the rendered tree
    expect(
      statGrid!.compareDocumentPosition(body!) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("layout=\"split\" with empty slots renders both columns without crashing", () => {
    const { container } = render(
      <AdminDashboard
        title="Dashboard"
        stats={mockStats}
        activities={[]}
        layout="split"
      />
    )

    const mainCol = container.querySelector(
      "[data-slot='admin-dashboard-main-col']"
    )
    const sideCol = container.querySelector(
      "[data-slot='admin-dashboard-side-col']"
    )
    expect(mainCol).toBeInTheDocument()
    expect(sideCol).toBeInTheDocument()
    expect(mainCol).toBeEmptyDOMElement()
    expect(sideCol).toBeEmptyDOMElement()
  })

  // ─── Dev-mode warning ───────────────────────────────────────────────

  describe("dev-mode warning in split mode", () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it("warns when activities is non-empty in split mode", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
      render(
        <AdminDashboard
          title="Dashboard"
          stats={mockStats}
          activities={mockActivities}
          layout="split"
          mainCol={<div>Main</div>}
          sideCol={<div>Side</div>}
        />
      )
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("layout=\"split\" ignores")
      )
    })

    it("warns when secondaryRegion is supplied in split mode", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
      render(
        <AdminDashboard
          title="Dashboard"
          stats={mockStats}
          activities={[]}
          secondaryRegion={<div>Charts</div>}
          layout="split"
          mainCol={<div>Main</div>}
          sideCol={<div>Side</div>}
        />
      )
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("layout=\"split\" ignores")
      )
    })

    it("does not warn when activities is empty and secondaryRegion is absent", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
      render(
        <AdminDashboard
          title="Dashboard"
          stats={mockStats}
          activities={[]}
          layout="split"
          mainCol={<div>Main</div>}
          sideCol={<div>Side</div>}
        />
      )
      expect(warn).not.toHaveBeenCalled()
    })
  })

  // ─── Layout a11y ────────────────────────────────────────────────────

  it("layout=\"split\" passes accessibility checks", async () => {
    const { container } = render(
      <AdminDashboard
        title="Dashboard"
        eyebrow="Admin"
        description="Monitor your key metrics."
        stats={mockStats}
        activities={[]}
        layout="split"
        mainCol={
          <section aria-labelledby="main-h">
            <h2 id="main-h">Tonight</h2>
            <p>Two events.</p>
          </section>
        }
        sideCol={
          <section aria-labelledby="side-h">
            <h2 id="side-h">This week</h2>
            <p>Upcoming events.</p>
          </section>
        }
      />
    )
    await checkA11y(container)
  })
})
