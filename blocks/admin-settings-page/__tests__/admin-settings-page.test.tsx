import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { AdminSettingsPage } from "../admin-settings-page"
import { checkA11y } from "../../../test-utils/a11y"

const sampleSections = [
  {
    id: "profile",
    label: "Profile",
    title: "Profile settings",
    description: "Update your personal information.",
    content: <div>Profile form content</div>,
  },
  {
    id: "notifications",
    label: "Notifications",
    title: "Notification preferences",
    content: <div>Notifications form content</div>,
  },
  {
    id: "security",
    label: "Security",
    title: "Security settings",
    content: <div>Security form content</div>,
  },
]

describe("AdminSettingsPage", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    const { container } = render(
      <AdminSettingsPage title="Settings" sections={sampleSections} />
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders the page title", () => {
    render(<AdminSettingsPage title="Account Settings" sections={sampleSections} />)
    expect(screen.getByText("Account Settings")).toBeInTheDocument()
  })

  it("renders all section titles", () => {
    render(<AdminSettingsPage title="Settings" sections={sampleSections} />)
    expect(screen.getByText("Profile settings")).toBeInTheDocument()
    expect(screen.getByText("Notification preferences")).toBeInTheDocument()
    expect(screen.getByText("Security settings")).toBeInTheDocument()
  })

  it("renders section descriptions when provided", () => {
    render(<AdminSettingsPage title="Settings" sections={sampleSections} />)
    expect(screen.getByText("Update your personal information.")).toBeInTheDocument()
  })

  it("renders section content", () => {
    render(<AdminSettingsPage title="Settings" sections={sampleSections} />)
    expect(screen.getByText("Profile form content")).toBeInTheDocument()
    expect(screen.getByText("Notifications form content")).toBeInTheDocument()
  })

  // ─── Navigation ─────────────────────────────────────────────────────

  it("renders left nav by default when there are multiple sections", () => {
    const { container } = render(
      <AdminSettingsPage title="Settings" sections={sampleSections} />
    )
    expect(
      container.querySelector("[data-slot='admin-settings-page-nav']")
    ).toBeInTheDocument()
  })

  it("renders nav labels", () => {
    render(<AdminSettingsPage title="Settings" sections={sampleSections} />)
    expect(screen.getAllByText("Profile").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Notifications").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Security").length).toBeGreaterThanOrEqual(1)
  })

  it("hides nav when showNav=false", () => {
    const { container } = render(
      <AdminSettingsPage title="Settings" sections={sampleSections} showNav={false} />
    )
    expect(
      container.querySelector("[data-slot='admin-settings-page-nav']")
    ).not.toBeInTheDocument()
  })

  it("does not show nav for a single section by default", () => {
    const { container } = render(
      <AdminSettingsPage
        title="Settings"
        sections={[sampleSections[0]]}
      />
    )
    expect(
      container.querySelector("[data-slot='admin-settings-page-nav']")
    ).not.toBeInTheDocument()
  })

  // ─── Footer / save ───────────────────────────────────────────────────

  it("renders global footer by default", () => {
    render(<AdminSettingsPage title="Settings" sections={sampleSections} />)
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
  })

  it("global save is disabled when not dirty", () => {
    render(<AdminSettingsPage title="Settings" sections={sampleSections} />)
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
  })

  it("global save is enabled when dirty=true", () => {
    render(<AdminSettingsPage title="Settings" sections={sampleSections} dirty />)
    expect(screen.getByRole("button", { name: "Save changes" })).not.toBeDisabled()
  })

  it("hides global footer when hideFooter=true", () => {
    render(
      <AdminSettingsPage title="Settings" sections={sampleSections} hideFooter />
    )
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument()
  })

  it("calls onSave when save button is clicked and dirty", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <AdminSettingsPage
        title="Settings"
        sections={sampleSections}
        dirty
        onSave={onSave}
      />
    )
    await user.click(screen.getByRole("button", { name: "Save changes" }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it("shows cancel guard when dirty and cancel is clicked", async () => {
    const user = userEvent.setup()
    render(
      <AdminSettingsPage
        title="Settings"
        sections={sampleSections}
        dirty
        onCancel={vi.fn()}
      />
    )
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.getByText("Discard unsaved changes?")).toBeInTheDocument()
  })

  // ─── data-slot ──────────────────────────────────────────────────────

  it("sets data-slot on root element", () => {
    const { container } = render(
      <AdminSettingsPage title="Settings" sections={sampleSections} />
    )
    expect(container.firstChild).toHaveAttribute("data-slot", "admin-settings-page")
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks", async () => {
    const { container } = render(
      <AdminSettingsPage
        title="Account Settings"
        description="Manage your account preferences."
        sections={sampleSections}
      />
    )
    await checkA11y(container)
  })
})
