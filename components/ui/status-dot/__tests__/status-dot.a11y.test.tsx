import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { StatusDot, type StatusDotTone } from "../status-dot"

const TONES: StatusDotTone[] = ["mint", "warn", "muted", "danger", "info"]

describe("StatusDot a11y (vitest-axe)", () => {
  for (const tone of TONES) {
    it(`has no WCAG 2.1 AA violations as decorative (tone=${tone})`, async () => {
      const { container } = render(
        <span>
          <StatusDot tone={tone} />
          <span> Status text</span>
        </span>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it(`has no WCAG 2.1 AA violations as labeled image (tone=${tone})`, async () => {
      const { container } = render(
        <StatusDot tone={tone} aria-label={`Status: ${tone}`} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  }
})
