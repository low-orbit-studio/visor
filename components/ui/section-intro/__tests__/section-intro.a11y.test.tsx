import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { SectionIntro } from "../section-intro"

describe("SectionIntro a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (heading only)", async () => {
    const { container } = render(
      <SectionIntro heading="Built for the world's best venues" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (eyebrow + heading + lede)", async () => {
    const { container } = render(
      <SectionIntro
        eyebrow="On the map"
        heading="Built for the world's best venues"
        lede="One platform. Every door."
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (center alignment)", async () => {
    const { container } = render(
      <SectionIntro
        eyebrow="Pricing"
        heading="Simple, honest pricing"
        align="center"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (as=div, multiple instances)", async () => {
    const { container } = render(
      <div>
        <SectionIntro as="div" heading="First section" eyebrow="Section one" />
        <SectionIntro as="div" heading="Second section" eyebrow="Section two" />
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
