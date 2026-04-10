import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { ConfirmDialog } from "../confirm-dialog"

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
