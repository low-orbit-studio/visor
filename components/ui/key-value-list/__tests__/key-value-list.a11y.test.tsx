import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { KeyValueList } from "../key-value-list"

const facts = [
  { label: "Plan", value: "Enterprise" },
  { label: "Members", value: "142", hint: "total" },
  { label: "Monthly revenue", value: "$48,200" },
  { label: "Health score", value: "98", hint: "/ 100" },
]

describe("KeyValueList a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (stacked 4-up facts panel)", async () => {
    const { container } = render(<KeyValueList items={facts} columns={4} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (horizontal inspector)", async () => {
    const { container } = render(
      <KeyValueList items={facts} orientation="horizontal" />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no WCAG 2.1 AA violations (as="div")', async () => {
    const { container } = render(<KeyValueList items={facts} as="div" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
