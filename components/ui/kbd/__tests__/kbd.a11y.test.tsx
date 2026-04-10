import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { Kbd } from "../kbd"

const sizes = ["sm", "md", "lg"] as const
const variants = ["default", "outline"] as const

describe("Kbd a11y (vitest-axe)", () => {
  for (const size of sizes) {
    for (const variant of variants) {
      it(`single key has no WCAG 2.1 AA violations (size ${size}, variant ${variant})`, async () => {
        const { container } = render(
          <Kbd size={size} variant={variant}>
            K
          </Kbd>
        )
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      })
    }
  }

  for (const size of sizes) {
    for (const variant of variants) {
      it(`multi-key has no WCAG 2.1 AA violations (size ${size}, variant ${variant})`, async () => {
        const { container } = render(
          <Kbd size={size} variant={variant} keys={["\u2318", "K"]} />
        )
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      })
    }
  }

  it("multi-key with custom separator has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Kbd keys={["G", "P"]} separator="then" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
