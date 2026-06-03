import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { ConfirmDialog } from "../confirm-dialog"

describe("ConfirmDialog a11y — icon plate", () => {
  it("plate element has aria-hidden='true'", () => {
    const { baseElement } = render(
      <ConfirmDialog
        open
        severity="destructive"
        title="Delete project?"
        description="This action cannot be undone."
      />
    )
    // Dialog renders in a portal — query baseElement (document.body), not container
    const plate = baseElement.querySelector('[data-slot="confirm-dialog-icon-plate"]')
    expect(plate).toBeInTheDocument()
    expect(plate).toHaveAttribute("aria-hidden", "true")
  })

  it("dialog has aria-describedby pointing to DialogDescription when description is set and children is not", () => {
    const { baseElement } = render(
      <ConfirmDialog
        open
        severity="warning"
        title="Cancel subscription?"
        description="This will end your plan at the next billing cycle."
      />
    )
    // Dialog renders in a portal — query baseElement (document.body), not container
    const dialog = baseElement.querySelector('[role="dialog"]')
    const describedBy = dialog?.getAttribute("aria-describedby")
    expect(describedBy).toBeTruthy()
    const descriptionEl = baseElement.querySelector(`#${describedBy}`)
    expect(descriptionEl).toBeInTheDocument()
    expect(descriptionEl?.textContent).toContain("This will end your plan")
  })

  it("axe scan clean for severity='info'", async () => {
    const { baseElement } = render(
      <ConfirmDialog
        open
        severity="info"
        title="Archive project?"
        description="You can restore it from the archive later."
      />
    )
    const results = await axe(baseElement)
    expect(results).toHaveNoViolations()
  })

  it("axe scan clean for severity='destructive'", async () => {
    const { baseElement } = render(
      <ConfirmDialog
        open
        severity="destructive"
        title="Delete project?"
        description="This action cannot be undone."
      />
    )
    const results = await axe(baseElement)
    expect(results).toHaveNoViolations()
  })

  it("axe scan clean for severity='destructive' with confirmText gate", async () => {
    const { baseElement } = render(
      <ConfirmDialog
        open
        severity="destructive"
        title="Delete project?"
        description="This action cannot be undone."
        confirmText="acme"
      />
    )
    const results = await axe(baseElement)
    expect(results).toHaveNoViolations()
  })
})

describe("ConfirmDialog a11y", () => {
  it("has no WCAG 2.1 AA violations (severity: info)", async () => {
    const { baseElement } = render(
      <ConfirmDialog
        open
        severity="info"
        title="Archive project?"
        description="You can restore it from the archive later."
      />
    )
    const results = await axe(baseElement)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (severity: warning)", async () => {
    const { baseElement } = render(
      <ConfirmDialog
        open
        severity="warning"
        title="Cancel subscription?"
        description="This will end your plan at the next billing cycle."
      />
    )
    const results = await axe(baseElement)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (severity: danger)", async () => {
    const { baseElement } = render(
      <ConfirmDialog
        open
        severity="danger"
        title="Delete project?"
        description="This action cannot be undone."
      />
    )
    const results = await axe(baseElement)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations with confirmText gate", async () => {
    const { baseElement } = render(
      <ConfirmDialog
        open
        severity="danger"
        title="Delete project?"
        description="This action cannot be undone."
        confirmText="acme"
      />
    )
    const results = await axe(baseElement)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations with custom children body", async () => {
    const { baseElement } = render(
      <ConfirmDialog
        open
        severity="warning"
        title="Revoke API key?"
      >
        <p>
          Any services using this key will immediately lose access. Make sure
          you have replaced this key everywhere before continuing.
        </p>
        <ul>
          <li>Used by 3 services</li>
          <li>Created 4 months ago</li>
        </ul>
      </ConfirmDialog>
    )
    const results = await axe(baseElement)
    expect(results).toHaveNoViolations()
  })
})
