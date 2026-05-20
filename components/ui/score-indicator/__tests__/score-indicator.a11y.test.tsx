import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { ScoreIndicator } from "../score-indicator"

describe("ScoreIndicator a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (default md, auto tone)", async () => {
    const { container } = render(<ScoreIndicator value={98} max={100} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (sm size)", async () => {
    const { container } = render(
      <ScoreIndicator value={98} max={100} size="sm" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (lg size)", async () => {
    const { container } = render(
      <ScoreIndicator value={98} max={100} size="lg" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (destructive tone with icon overlay)", async () => {
    const { container } = render(
      <ScoreIndicator value={20} tone="destructive" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (warning tone with icon overlay)", async () => {
    const { container } = render(<ScoreIndicator value={45} tone="warning" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (denominator below)", async () => {
    const { container } = render(
      <ScoreIndicator value={86} denominator="below" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (custom ariaLabel)", async () => {
    const { container } = render(
      <ScoreIndicator value={98} ariaLabel="Organization health score" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
