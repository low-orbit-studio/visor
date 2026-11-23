import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { AnimatedTitle } from "../animated-title"

describe("AnimatedTitle a11y (vitest-axe)", () => {
  for (const animation of ["rise", "blur", "weight"] as const) {
    it(`has no WCAG 2.1 AA violations (${animation})`, async () => {
      const { container } = render(<AnimatedTitle as="h1" animation={animation} text="Tell us about your weekend" />)
      expect(await axe(container)).toHaveNoViolations()
    })
  }

  it("has no WCAG 2.1 AA violations while held", async () => {
    const { container } = render(<AnimatedTitle as="h1" play={false} text="Saturday afternoon" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
