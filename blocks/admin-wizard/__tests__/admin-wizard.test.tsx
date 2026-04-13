import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { AdminWizard } from "../admin-wizard"
import { checkA11y } from "../../../test-utils/a11y"

const sampleSteps = [
  { id: "basics", label: "Basics", content: <div>Step 1: Enter basic info</div> },
  { id: "details", label: "Details", content: <div>Step 2: Add more details</div> },
  { id: "review", label: "Review", content: <div>Step 3: Review and submit</div> },
]

describe("AdminWizard", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    const { container } = render(
      <AdminWizard title="New Project" steps={sampleSteps} />
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders the page title", () => {
    render(<AdminWizard title="Create New Project" steps={sampleSteps} />)
    expect(screen.getByText("Create New Project")).toBeInTheDocument()
  })

  it("renders eyebrow when provided", () => {
    render(
      <AdminWizard title="New Project" eyebrow="Setup wizard" steps={sampleSteps} />
    )
    expect(screen.getByText("Setup wizard")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <AdminWizard
        title="New Project"
        description="Follow the steps to set up your project."
        steps={sampleSteps}
      />
    )
    expect(screen.getByText("Follow the steps to set up your project.")).toBeInTheDocument()
  })

  // ─── Stepper / steps ─────────────────────────────────────────────────

  it("renders all step labels in the stepper", () => {
    render(<AdminWizard title="New Project" steps={sampleSteps} />)
    expect(screen.getByText("Basics")).toBeInTheDocument()
    expect(screen.getByText("Details")).toBeInTheDocument()
    expect(screen.getByText("Review")).toBeInTheDocument()
  })

  it("renders first step content by default", () => {
    render(<AdminWizard title="New Project" steps={sampleSteps} />)
    expect(screen.getByText("Step 1: Enter basic info")).toBeInTheDocument()
  })

  it("renders defaultActiveStep content", () => {
    render(
      <AdminWizard title="New Project" steps={sampleSteps} defaultActiveStep={1} />
    )
    expect(screen.getByText("Step 2: Add more details")).toBeInTheDocument()
  })

  // ─── Navigation buttons ──────────────────────────────────────────────

  it("renders Cancel and Next/Back buttons", () => {
    render(<AdminWizard title="New Project" steps={sampleSteps} />)
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument()
  })

  it("Back button is disabled on first step", () => {
    render(<AdminWizard title="New Project" steps={sampleSteps} />)
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled()
  })

  it("advances to next step when Next is clicked", async () => {
    const user = userEvent.setup()
    render(<AdminWizard title="New Project" steps={sampleSteps} />)

    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByText("Step 2: Add more details")).toBeInTheDocument()
  })

  it("can navigate back after advancing", async () => {
    const user = userEvent.setup()
    render(<AdminWizard title="New Project" steps={sampleSteps} />)

    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByText("Step 2: Add more details")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByText("Step 1: Enter basic info")).toBeInTheDocument()
  })

  it("shows Submit on the last step", async () => {
    const user = userEvent.setup()
    render(<AdminWizard title="New Project" steps={sampleSteps} />)

    await user.click(screen.getByRole("button", { name: "Next" }))
    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument()
  })

  it("calls onSubmit when Submit is clicked on the last step", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <AdminWizard title="New Project" steps={sampleSteps} onSubmit={onSubmit} />
    )

    await user.click(screen.getByRole("button", { name: "Next" }))
    await user.click(screen.getByRole("button", { name: "Next" }))
    await user.click(screen.getByRole("button", { name: "Submit" }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("calls onActiveStepChange when step changes", async () => {
    const user = userEvent.setup()
    const onActiveStepChange = vi.fn()
    render(
      <AdminWizard
        title="New Project"
        steps={sampleSteps}
        onActiveStepChange={onActiveStepChange}
      />
    )
    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(onActiveStepChange).toHaveBeenCalledWith(1)
  })

  // ─── Cancel / unsaved guard ──────────────────────────────────────────

  it("calls onCancel when cancel is clicked and not dirty", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <AdminWizard title="New Project" steps={sampleSteps} onCancel={onCancel} />
    )
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("shows unsaved guard dialog when dirty and cancel is clicked", async () => {
    const user = userEvent.setup()
    render(<AdminWizard title="New Project" steps={sampleSteps} dirty />)
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.getByText("Discard progress?")).toBeInTheDocument()
  })

  // ─── Custom labels ───────────────────────────────────────────────────

  it("renders custom backLabel", () => {
    render(<AdminWizard title="New Project" steps={sampleSteps} backLabel="Previous" />)
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument()
  })

  it("renders custom nextLabel", () => {
    render(<AdminWizard title="New Project" steps={sampleSteps} nextLabel="Continue" />)
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument()
  })

  // ─── data-slot / orientation ─────────────────────────────────────────

  it("sets data-slot and data-orientation on root element", () => {
    const { container } = render(
      <AdminWizard title="New Project" steps={sampleSteps} />
    )
    expect(container.firstChild).toHaveAttribute("data-slot", "admin-wizard")
    expect(container.firstChild).toHaveAttribute("data-orientation", "horizontal")
  })

  it("sets data-orientation=vertical when stepperOrientation=vertical", () => {
    const { container } = render(
      <AdminWizard
        title="New Project"
        steps={sampleSteps}
        stepperOrientation="vertical"
      />
    )
    expect(container.firstChild).toHaveAttribute("data-orientation", "vertical")
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks", async () => {
    const { container } = render(
      <AdminWizard
        title="Create New Project"
        description="Follow the steps to set up your project."
        steps={sampleSteps}
      />
    )
    await checkA11y(container)
  })
})
