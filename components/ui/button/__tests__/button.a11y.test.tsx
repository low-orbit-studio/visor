/**
 * Button — Accessibility Tests (Reference Pattern)
 *
 * Demonstrates the vitest-axe pattern for automated WCAG 2.1 AA checks.
 * Copy this pattern into new component test files:
 *
 *   import { axe } from "vitest-axe"
 *   const results = await axe(container)
 *   expect(results).toHaveNoViolations()
 *
 * The `toHaveNoViolations` matcher is globally available via vitest.setup.ts —
 * no additional setup needed in individual test files.
 */

import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "vitest-axe"
import { Button } from "../button"

describe("Button a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (default)", async () => {
    const { container } = render(<Button>Click me</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (disabled)", async () => {
    const { container } = render(<Button disabled>Disabled</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (variant: secondary)", async () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (variant: outline)", async () => {
    const { container } = render(<Button variant="outline">Outline</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (variant: ghost)", async () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (variant: destructive)", async () => {
    const { container } = render(
      <Button variant="destructive">Delete</Button>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
