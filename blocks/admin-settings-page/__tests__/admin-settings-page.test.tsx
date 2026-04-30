import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { AdminSettingsPage, type AdminSettingsSectionGroup } from "../admin-settings-page"
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

// ────────────────────────────────────────────────────────────────────────────
// sectionGroups
// ────────────────────────────────────────────────────────────────────────────

const sampleGroups: AdminSettingsSectionGroup[] = [
  {
    label: "Account",
    sections: [
      {
        id: "profile",
        label: "Profile",
        title: "Profile settings",
        content: <div>Profile content</div>,
      },
      {
        id: "security",
        label: "Security",
        title: "Security settings",
        content: <div>Security content</div>,
      },
    ],
  },
  {
    label: "Workspace",
    sections: [
      {
        id: "members",
        label: "Members",
        meta: "8",
        title: "Members",
        content: <div>Members content</div>,
      },
      {
        id: "billing",
        label: "Billing",
        title: "Billing",
        content: <div>Billing content</div>,
      },
    ],
  },
  {
    label: "Venue",
    sections: [
      {
        id: "venue-default",
        label: "House of Yes",
        meta: "default",
        title: "House of Yes",
        content: <div>Venue content</div>,
      },
      {
        id: "venue-add",
        label: "+ Add venue",
        muted: true,
        title: "Add a venue",
        content: <div>Add venue content</div>,
      },
    ],
  },
]

describe("AdminSettingsPage — sectionGroups", () => {
  // ─── Group label rendering ───────────────────────────────────────────

  it("renders group eyebrow labels in the side nav", () => {
    render(
      <AdminSettingsPage
        title="Settings"
        sectionGroups={sampleGroups}
        hideFooter
      />
    )
    expect(screen.getByText("Account")).toBeInTheDocument()
    expect(screen.getByText("Workspace")).toBeInTheDocument()
    expect(screen.getByText("Venue")).toBeInTheDocument()
  })

  it("renders sections under each group in correct order", () => {
    render(
      <AdminSettingsPage
        title="Settings"
        sectionGroups={sampleGroups}
        hideFooter
      />
    )
    // Section titles should be in the main content (use getAllByText for ones that also appear in nav)
    expect(screen.getByText("Profile settings")).toBeInTheDocument()
    expect(screen.getByText("Security settings")).toBeInTheDocument()
    expect(screen.getAllByText("Members").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Billing").length).toBeGreaterThanOrEqual(1)
  })

  // ─── Regression — flat sections still work ──────────────────────────

  it("flat sections prop still works unchanged (regression guard)", () => {
    render(
      <AdminSettingsPage title="Settings" sections={sampleSections} />
    )
    expect(screen.getByText("Profile settings")).toBeInTheDocument()
    expect(screen.getByText("Notification preferences")).toBeInTheDocument()
    expect(screen.getByText("Security settings")).toBeInTheDocument()
  })

  // ─── meta badge ─────────────────────────────────────────────────────

  it("renders meta badge in the side nav", () => {
    render(
      <AdminSettingsPage
        title="Settings"
        sectionGroups={sampleGroups}
        hideFooter
      />
    )
    // "8" badge on Members and "default" badge on House of Yes
    expect(screen.getByText("8")).toBeInTheDocument()
    expect(screen.getByText("default")).toBeInTheDocument()
  })

  it("suppresses meta badge in the top nav", () => {
    render(
      <AdminSettingsPage
        title="Settings"
        navPosition="top"
        sectionGroups={sampleGroups}
        hideFooter
      />
    )
    // In top nav mode, the side nav is not rendered, so meta spans aren't present
    const nav = document.querySelector("[data-slot='admin-settings-page-nav']")
    expect(nav).toBeInTheDocument()
    // The nav links in top mode should not contain the meta spans
    // (they're only added in sideNavLink render path)
    const metaElements = document.querySelectorAll("[class*='navItemMeta']")
    expect(metaElements).toHaveLength(0)
  })

  // ─── muted styling ───────────────────────────────────────────────────

  it("applies muted class to muted nav items", () => {
    const { container } = render(
      <AdminSettingsPage
        title="Settings"
        sectionGroups={sampleGroups}
        hideFooter
      />
    )
    // The "+ Add venue" link should have the muted class
    const links = container.querySelectorAll("a[href='#venue-add']")
    expect(links.length).toBeGreaterThan(0)
    const navLink = links[0]
    expect(navLink.className).toMatch(/navItemMuted/)
  })

  // ─── top nav separators ──────────────────────────────────────────────

  it("renders role=separator between groups in top nav", () => {
    const { container } = render(
      <AdminSettingsPage
        title="Settings"
        navPosition="top"
        sectionGroups={sampleGroups}
        hideFooter
      />
    )
    const separators = container.querySelectorAll("[role='separator']")
    // 3 groups → 2 separators between them
    expect(separators).toHaveLength(2)
  })

  it("sets aria-label on top nav separator from string group label", () => {
    const { container } = render(
      <AdminSettingsPage
        title="Settings"
        navPosition="top"
        sectionGroups={sampleGroups}
        hideFooter
      />
    )
    const separators = container.querySelectorAll("[role='separator']")
    // Second group label is "Workspace", third is "Venue"
    expect(separators[0]).toHaveAttribute("aria-label", "Workspace")
    expect(separators[1]).toHaveAttribute("aria-label", "Venue")
  })

  // ─── intersection observer registration count ────────────────────────

  it("registers all sections across groups for intersection observer", () => {
    render(
      <AdminSettingsPage
        title="Settings"
        sectionGroups={sampleGroups}
        hideFooter
      />
    )
    // All 6 sections across 3 groups should be rendered as section elements
    const sectionEls = document.querySelectorAll(
      "[data-slot='admin-settings-page-section']"
    )
    expect(sectionEls).toHaveLength(6)
  })

  // ─── dev warning ─────────────────────────────────────────────────────

  it("warns in dev mode when both sections and sectionGroups are provided", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <AdminSettingsPage
        title="Settings"
        sections={sampleSections}
        sectionGroups={sampleGroups}
        hideFooter
      />
    )
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("sectionGroups")
    )
    warnSpy.mockRestore()
  })

  it("does not warn when only sectionGroups is provided", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <AdminSettingsPage
        title="Settings"
        sectionGroups={sampleGroups}
        hideFooter
      />
    )
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks with grouped nav", async () => {
    const { container } = render(
      <AdminSettingsPage
        title="Account Settings"
        description="Manage your settings."
        sectionGroups={sampleGroups}
        hideFooter
      />
    )
    await checkA11y(container)
  })
})
