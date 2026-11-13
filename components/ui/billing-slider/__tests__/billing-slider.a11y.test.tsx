import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { axe } from "../../../../test-utils/axe"
import { BillingSlider } from "../billing-slider"

describe("BillingSlider a11y", () => {
  it("has no axe violations with marks, evidence and the gap", async () => {
    const { container } = render(
      <BillingSlider
        aria-label="Hours Website embeds bills"
        value={8}
        savedValue={8}
        min={8}
        max={16.75}
        hue={339}
        marks={[{ value: 10, label: "High", hatchPast: true }]}
        evidence={{ value: 10.5, agent: 3, proposed: 1.25 }}
        gap
        minLabel="Low"
        maxLabel="Ceiling allows"
        formatValue={(h) => `${h} h`}
        valueText={(h) => `Bills ${h} h, $${h * 120}`}
        onValueChange={() => {}}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it("has no axe violations when disabled", async () => {
    const { container } = render(
      <BillingSlider aria-label="Hours it bills" value={9} min={8} max={12} disabled onValueChange={() => {}} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
