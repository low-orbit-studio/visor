import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { StationSpectrum } from "../station-spectrum"

const FIVE_STATIONS = [
  { num: "01", title: "Discovery", description: "Goals, audience, constraints, what success looks like." },
  { num: "02", title: "Brand", description: "Name, identity, voice, and a design system that scales." },
  { num: "03", title: "Product design", description: "Wireframes, screens, interactions, prototypes you can hold." },
  { num: "04", title: "Engineering", description: "Apps, websites, APIs. Built, shipped, and live in production." },
  { num: "05", title: "Infrastructure", description: "Logs, metrics, deploys, on-call. The boring parts." },
]

const THREE_STATIONS = [
  { num: "01", title: "Plan" },
  { num: "02", title: "Build" },
  { num: "03", title: "Ship" },
]

describe("StationSpectrum a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (5-station default)", async () => {
    const { container } = render(
      <StationSpectrum stations={FIVE_STATIONS} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (3-station compact)", async () => {
    const { container } = render(
      <StationSpectrum stations={THREE_STATIONS} density="compact" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (title-only stations)", async () => {
    const { container } = render(
      <StationSpectrum
        stations={[
          { num: "01", title: "Alpha" },
          { num: "02", title: "Beta" },
          { num: "03", title: "Gamma" },
        ]}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (inView=true, autoTrigger=false)", async () => {
    const { container } = render(
      <StationSpectrum
        stations={FIVE_STATIONS}
        inView={true}
        autoTrigger={false}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (inView=false, autoTrigger=false)", async () => {
    const { container } = render(
      <StationSpectrum
        stations={FIVE_STATIONS}
        inView={false}
        autoTrigger={false}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (with aria-label)", async () => {
    const { container } = render(
      <StationSpectrum
        stations={FIVE_STATIONS}
        aria-label="5-phase engagement process"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("decorative elements are hidden from assistive tech (rail has aria-hidden)", async () => {
    const { container } = render(
      <StationSpectrum stations={FIVE_STATIONS} />
    )
    const rail = container.querySelector('[class*="rail"]')
    expect(rail).toHaveAttribute("aria-hidden", "true")
    // Run axe as well
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
