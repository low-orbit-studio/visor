import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { AdminDetailDrawer } from "../admin-detail-drawer"
import { checkA11y } from "../../../test-utils/a11y"

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: "Edit User",
  children: <div>Form content here</div>,
}

describe("AdminDetailDrawer", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing when open", () => {
    const { container } = render(<AdminDetailDrawer {...defaultProps} />)
    expect(container).toBeInTheDocument()
  })

  it("renders the drawer title", () => {
    render(<AdminDetailDrawer {...defaultProps} />)
    expect(screen.getByText("Edit User")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <AdminDetailDrawer
        {...defaultProps}
        description="Update the user's details below."
      />
    )
    expect(screen.getByText("Update the user's details below.")).toBeInTheDocument()
  })

  it("renders children content", () => {
    render(<AdminDetailDrawer {...defaultProps} />)
    expect(screen.getByText("Form content here")).toBeInTheDocument()
  })

  it("does not render content when closed", () => {
    render(
      <AdminDetailDrawer {...defaultProps} open={false} />
    )
    expect(screen.queryByText("Form content here")).not.toBeInTheDocument()
  })

  // ─── Footer / actions ───────────────────────────────────────────────

  it("renders Save changes and Cancel buttons by default", () => {
    render(<AdminDetailDrawer {...defaultProps} />)
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
  })

  it("renders custom saveLabel", () => {
    render(<AdminDetailDrawer {...defaultProps} saveLabel="Confirm" />)
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument()
  })

  it("renders custom cancelLabel", () => {
    render(<AdminDetailDrawer {...defaultProps} cancelLabel="Go back" />)
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument()
  })

  it("hides footer when hideFooter=true", () => {
    render(<AdminDetailDrawer {...defaultProps} hideFooter />)
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument()
  })

  it("renders footerStatus when provided", () => {
    render(
      <AdminDetailDrawer
        {...defaultProps}
        footerStatus={<span>Last saved 2m ago</span>}
      />
    )
    expect(screen.getByText("Last saved 2m ago")).toBeInTheDocument()
  })

  it("disables save button when disabled=true", () => {
    render(<AdminDetailDrawer {...defaultProps} disabled />)
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
  })

  // ─── Save handler ───────────────────────────────────────────────────

  it("calls onSave when save button is clicked", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <AdminDetailDrawer
        open={true}
        onOpenChange={onOpenChange}
        title="Edit User"
        onSave={onSave}
      >
        <div>content</div>
      </AdminDetailDrawer>
    )
    await user.click(screen.getByRole("button", { name: "Save changes" }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it("calls onOpenChange(false) on cancel when not dirty", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <AdminDetailDrawer
        open={true}
        onOpenChange={onOpenChange}
        title="Edit User"
      >
        <div>content</div>
      </AdminDetailDrawer>
    )
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("shows unsaved guard dialog when dirty and cancel is clicked", async () => {
    const user = userEvent.setup()
    render(
      <AdminDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        title="Edit User"
        dirty
      >
        <div>content</div>
      </AdminDetailDrawer>
    )
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.getByText("Discard unsaved changes?")).toBeInTheDocument()
  })

  // ─── Header rendering modes ─────────────────────────────────────────

  it("renders default SheetHeader with title and description when neither hideHeader nor customHeader is set", () => {
    render(
      <AdminDetailDrawer
        {...defaultProps}
        description="Some description"
      />
    )
    // Title is visibly rendered
    expect(screen.getByText("Edit User")).toBeInTheDocument()
    expect(screen.getByText("Some description")).toBeInTheDocument()
  })

  it("hideHeader suppresses the default SheetHeader but title is still present for a11y", () => {
    const { container } = render(
      <AdminDetailDrawer {...defaultProps} hideHeader />
    )
    // The visually-hidden title must exist in the DOM
    expect(screen.getByText("Edit User")).toBeInTheDocument()
    // The SheetHeader (data-slot) should not be rendered
    expect(container.querySelector('[data-slot="sheet-header"]')).not.toBeInTheDocument()
  })

  it("hideHeader does not render SheetDescription even if description is provided", () => {
    render(
      <AdminDetailDrawer
        {...defaultProps}
        hideHeader
        description="Should not appear"
      />
    )
    expect(screen.queryByText("Should not appear")).not.toBeInTheDocument()
  })

  it("customHeader replaces the default SheetHeader with custom content", () => {
    const { container } = render(
      <AdminDetailDrawer
        {...defaultProps}
        customHeader={<div data-testid="custom-chrome">Custom Chrome</div>}
      />
    )
    expect(screen.getByTestId("custom-chrome")).toBeInTheDocument()
    expect(screen.getByText("Custom Chrome")).toBeInTheDocument()
    // Default SheetHeader should not be rendered
    expect(container.querySelector('[data-slot="sheet-header"]')).not.toBeInTheDocument()
  })

  it("customHeader mounts a visually-hidden SheetTitle wrapping title for a11y", () => {
    render(
      <AdminDetailDrawer
        {...defaultProps}
        customHeader={<div>Custom Chrome</div>}
      />
    )
    // title value is in the DOM (visually hidden)
    expect(screen.getByText("Edit User")).toBeInTheDocument()
  })

  it("customHeader wins over hideHeader when both are set", () => {
    render(
      <AdminDetailDrawer
        {...defaultProps}
        hideHeader
        customHeader={<div data-testid="custom-chrome">Custom Chrome</div>}
      />
    )
    expect(screen.getByTestId("custom-chrome")).toBeInTheDocument()
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks when open (default header)", async () => {
    const { container } = render(
      <AdminDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        title="Edit User"
        description="Update the user's profile information."
      >
        <p>Form fields go here.</p>
      </AdminDetailDrawer>
    )
    await checkA11y(container)
  })

  it("passes accessibility checks when hideHeader=true", async () => {
    const { container } = render(
      <AdminDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        title="Edit User"
        hideHeader
      >
        <p>Form fields go here.</p>
      </AdminDetailDrawer>
    )
    await checkA11y(container)
  })

  it("passes accessibility checks when customHeader is set", async () => {
    const { container } = render(
      <AdminDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        title="Edit User"
        customHeader={<div role="banner">Custom header chrome</div>}
      >
        <p>Form fields go here.</p>
      </AdminDetailDrawer>
    )
    await checkA11y(container)
  })
})
