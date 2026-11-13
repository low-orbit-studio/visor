import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { axe } from "../../../../test-utils/axe"
import { Meter } from "../meter"

describe("Meter a11y", () => {
  it("has no axe violations with a label slot", async () => {
    const { container } = render(
      <Meter value={141} max={220} hue={219} marks={[{ value: 176, threshold: true }]}>
        <strong>64%</strong> of 220 h · heads-up at 80%
      </Meter>
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it("has no axe violations as a contract meter with mark text", async () => {
    const { container } = render(
      <Meter
        value={212}
        max={200}
        size="contract"
        aria-label="Hours used against the ceiling"
        zones={[{ to: 166 }, { from: 166, to: 190, variant: "hatched" }]}
        marks={[{ value: 160, label: "160 h", caption: "heads-up", threshold: true }, { value: 200, label: "200 h", caption: "ceiling", variant: "limit", align: "end" }]}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
