import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { AdminTabbedEditor } from "../admin-tabbed-editor"
import { checkA11y } from "../../../test-utils/a11y"

const sampleTabs = [
  { id: "general", label: "General", content: <div>General settings content</div> },
  { id: "security", label: "Security", content: <div>Security settings content</div> },
  { id: "billing", label: "Billing", content: <div>Billing settings content</div> },
]

describe("AdminTabbedEditor", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    const { container } = render(
      <AdminTabbedEditor title="Settings" tabs={sampleTabs} />
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders the page title", () => {
    render(<AdminTabbedEditor title="Account Settings" tabs={sampleTabs} />)
    expect(screen.getByText("Account Settings")).toBeInTheDocument()
  })

  it("renders eyebrow when provided", () => {
    render(
      <AdminTabbedEditor title="Settings" eyebrow="Configuration" tabs={sampleTabs} />
    )
    expect(screen.getByText("Configuration")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <AdminTabbedEditor
        title="Settings"
        description="Manage your account preferences."
        tabs={sampleTabs}
      />
    )
    expect(screen.getByText("Manage your account preferences.")).toBeInTheDocument()
  })

  // ─── Tabs ────────────────────────────────────────────────────────────

  it("renders all tab triggers", () => {
    render(<AdminTabbedEditor title="Settings" tabs={sampleTabs} />)
    expect(screen.getByRole("tab", { name: "General" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Security" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Billing" })).toBeInTheDocument()
  })

  it("renders first tab content by default", () => {
    render(<AdminTabbedEditor title="Settings" tabs={sampleTabs} />)
    expect(screen.getByText("General settings content")).toBeInTheDocument()
  })

  it("renders defaultActiveTab content", () => {
    render(
      <AdminTabbedEditor
        title="Settings"
        tabs={sampleTabs}
        defaultActiveTab="security"
      />
    )
    expect(screen.getByText("Security settings content")).toBeInTheDocument()
  })

  it("switches tab content on click", async () => {
    const user = userEvent.setup()
    render(<AdminTabbedEditor title="Settings" tabs={sampleTabs} />)

    await user.click(screen.getByRole("tab", { name: "Security" }))
    expect(screen.getByText("Security settings content")).toBeInTheDocument()
  })

  it("calls onActiveTabChange when tab changes", async () => {
    const user = userEvent.setup()
    const onActiveTabChange = vi.fn()
    render(
      <AdminTabbedEditor
        title="Settings"
        tabs={sampleTabs}
        onActiveTabChange={onActiveTabChange}
      />
    )
    await user.click(screen.getByRole("tab", { name: "Billing" }))
    expect(onActiveTabChange).toHaveBeenCalledWith("billing")
  })

  // ─── Footer / actions ────────────────────────────────────────────────

  it("renders Cancel and Save buttons in footer", () => {
    render(<AdminTabbedEditor title="Settings" tabs={sampleTabs} />)
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument()
  })

  it("save button is disabled when not dirty", () => {
    render(<AdminTabbedEditor title="Settings" tabs={sampleTabs} />)
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
  })

  it("save button is enabled when dirty=true", () => {
    render(<AdminTabbedEditor title="Settings" tabs={sampleTabs} dirty />)
    expect(screen.getByRole("button", { name: "Save changes" })).not.toBeDisabled()
  })

  it("hides footer when hideFooter=true", () => {
    render(<AdminTabbedEditor title="Settings" tabs={sampleTabs} hideFooter />)
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument()
  })

  it("renders custom saveLabel", () => {
    render(
      <AdminTabbedEditor title="Settings" tabs={sampleTabs} saveLabel="Apply" />
    )
    expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument()
  })

  it("renders footerStatus when provided", () => {
    render(
      <AdminTabbedEditor
        title="Settings"
        tabs={sampleTabs}
        footerStatus={<span>Last saved 3m ago</span>}
      />
    )
    expect(screen.getByText("Last saved 3m ago")).toBeInTheDocument()
  })

  // ─── Unsaved guard ───────────────────────────────────────────────────

  it("shows unsaved guard when dirty and tab is switched", async () => {
    const user = userEvent.setup()
    render(<AdminTabbedEditor title="Settings" tabs={sampleTabs} dirty />)

    await user.click(screen.getByRole("tab", { name: "Security" }))
    expect(screen.getByText("Discard unsaved changes?")).toBeInTheDocument()
  })

  // ─── Header pass-through (VI-530) ────────────────────────────────────

  it("renders PageHeader with default scale when header props are omitted", () => {
    const { container } = render(
      <AdminTabbedEditor title="Settings" tabs={sampleTabs} />
    )
    const title = container.querySelector(
      '[data-slot="page-header-title"]'
    ) as HTMLElement
    expect(title).not.toBeNull()
    // Defaults match current rendering: no override attributes/inline styles.
    expect(title.hasAttribute("data-title-size")).toBe(false)
    expect(title.hasAttribute("data-title-family")).toBe(false)
    expect(title.style.getPropertyValue("--page-header-title-leading")).toBe("")
  })

  it("forwards headerSize to the PageHeader size variant", () => {
    const { container } = render(
      <AdminTabbedEditor title="Settings" tabs={sampleTabs} headerSize="lg" />
    )
    // size="lg" applies the sizeLg class on the page-header root.
    const header = container.querySelector(
      '[data-slot="page-header"]'
    ) as HTMLElement
    expect(header.className).toMatch(/sizeLg/)
  })

  it("forwards titleSize to the PageHeader title", () => {
    const { container } = render(
      <AdminTabbedEditor
        title="Settings"
        tabs={sampleTabs}
        titleSize="marquee"
      />
    )
    const title = container.querySelector(
      '[data-slot="page-header-title"]'
    ) as HTMLElement
    expect(title).toHaveAttribute("data-title-size", "marquee")
  })

  it("forwards titleSize raw length and titleFamily to the PageHeader title", () => {
    const { container } = render(
      <AdminTabbedEditor
        title="Settings"
        tabs={sampleTabs}
        titleSize="40px"
        titleFamily="display"
      />
    )
    const title = container.querySelector(
      '[data-slot="page-header-title"]'
    ) as HTMLElement
    expect(title.style.getPropertyValue("--page-header-title-size")).toBe("40px")
    expect(title).toHaveAttribute("data-title-size", "marquee")
    expect(title).toHaveAttribute("data-title-family", "display")
  })

  it("forwards leading to the PageHeader media/identity slot", () => {
    const { container } = render(
      <AdminTabbedEditor
        title="Settings"
        tabs={sampleTabs}
        leading={<span data-testid="identity-media" />}
      />
    )
    const slot = container.querySelector(
      '[data-slot="page-header-leading"]'
    ) as HTMLElement
    expect(slot).not.toBeNull()
    expect(slot.querySelector('[data-testid="identity-media"]')).not.toBeNull()
  })

  // ─── data-slot ──────────────────────────────────────────────────────

  it("sets data-slot on root element", () => {
    const { container } = render(
      <AdminTabbedEditor title="Settings" tabs={sampleTabs} />
    )
    expect(container.firstChild).toHaveAttribute("data-slot", "admin-tabbed-editor")
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks", async () => {
    const { container } = render(
      <AdminTabbedEditor
        title="Account Settings"
        description="Manage your account preferences."
        tabs={sampleTabs}
      />
    )
    await checkA11y(container)
  })
})
