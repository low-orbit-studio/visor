import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { ChromeButton } from "../chrome-button"

const variants = ["default", "primary"] as const

describe("ChromeButton a11y (vitest-axe)", () => {
  for (const variant of variants) {
    it(`label-only has no WCAG 2.1 AA violations (variant ${variant})`, async () => {
      const { container } = render(
        <ChromeButton variant={variant}>Action</ChromeButton>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  }

  for (const variant of variants) {
    it(`label + icon has no WCAG 2.1 AA violations (variant ${variant})`, async () => {
      const { container } = render(
        <ChromeButton
          variant={variant}
          icon={<svg width="14" height="14" aria-hidden="true" />}
        >
          Action
        </ChromeButton>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  }

  for (const variant of variants) {
    it(`label + icon + keys has no WCAG 2.1 AA violations (variant ${variant})`, async () => {
      const { container } = render(
        <ChromeButton
          variant={variant}
          icon={<svg width="14" height="14" aria-hidden="true" />}
          keys={["⌘", "K"]}
        >
          Search
        </ChromeButton>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  }
})
