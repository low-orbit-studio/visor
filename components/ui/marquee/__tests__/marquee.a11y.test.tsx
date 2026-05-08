import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { Marquee } from "../marquee"

describe("Marquee a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (single-band, string items)", async () => {
    const { container } = render(
      <Marquee
        items={["Acme Corp", "Vercel", "Low Orbit Studio", "Figma"]}
        durationSec={20}
        separator="·"
        aria-label="Trusted by"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (dual-band counter-flow)", async () => {
    const { container } = render(
      <Marquee
        bands={[
          {
            items: ["Alpha", "Beta", "Gamma"],
            direction: "left",
            durationSec: 25,
            separator: "●",
          },
          {
            items: ["Delta", "Epsilon", "Zeta"],
            direction: "right",
            durationSec: 30,
            separator: "○",
          },
        ]}
        pauseOnHover
        aria-label="Client logos"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (pauseOnHover=false)", async () => {
    const { container } = render(
      <Marquee
        items={["News 1", "News 2", "News 3"]}
        pauseOnHover={false}
        aria-label="News ticker"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (ReactNode separator)", async () => {
    const { container } = render(
      <Marquee
        items={["Feature A", "Feature B"]}
        separator={<span aria-hidden="true">•</span>}
        aria-label="Features"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (no separator)", async () => {
    const { container } = render(
      <Marquee
        items={["Tag 1", "Tag 2", "Tag 3"]}
        aria-label="Tags"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
