import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { BulkActionBar } from "../bulk-action-bar"
import { Button } from "../../button/button"

describe("BulkActionBar a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (default sticky)", async () => {
    const { container } = render(
      <BulkActionBar count={3} onClear={() => {}}>
        <Button variant="outline" size="sm">
          Archive
        </Button>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </BulkActionBar>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (inline)", async () => {
    const { container } = render(
      <BulkActionBar count={2} inline onClear={() => {}}>
        <Button variant="outline" size="sm">
          Export
        </Button>
      </BulkActionBar>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (multiple actions)", async () => {
    const { container } = render(
      <BulkActionBar count={5} onClear={() => {}}>
        <Button variant="outline" size="sm">
          Archive
        </Button>
        <Button variant="outline" size="sm">
          Export
        </Button>
        <Button variant="outline" size="sm">
          Move
        </Button>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </BulkActionBar>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (custom label)", async () => {
    const { container } = render(
      <BulkActionBar
        count={12}
        label={(n) => `${n} users selected`}
        onClear={() => {}}
      >
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </BulkActionBar>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (dismissible=false)", async () => {
    const { container } = render(
      <BulkActionBar count={4} dismissible={false}>
        <Button variant="outline" size="sm">
          Archive
        </Button>
      </BulkActionBar>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
