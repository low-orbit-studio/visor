import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { axe } from "../../../../test-utils/axe"
import { ProportionBar } from "../proportion-bar"

const hours = [
  { label: "On a package", value: 92.25 },
  { label: "Outside a package", value: 41.5 },
  { label: "Covered", value: 18 },
  { label: "Investment", value: 21.5, fill: "var(--proportion-bar-fill-4)" },
  { label: "Not billable", value: 4, fill: "hatched" },
  { label: "Unresolved", value: 9.25, fill: "alert" },
]
const h = (v: number) => `${v} h`

describe("ProportionBar", () => {
  it("is one image whose text sums the parts", () => {
    render(<ProportionBar parts={hours} formatValue={h} />)
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "186.5 h: On a package 92.25 h, Outside a package 41.5 h, Covered 18 h, Investment 21.5 h, Not billable 4 h, Unresolved 9.25 h"
    )
  })

  it("takes a summary in place of the default text", () => {
    render(<ProportionBar parts={hours} summary="Where the hours went" />)
    expect(screen.getByRole("img")).toHaveAccessibleName("Where the hours went")
  })

  it("draws each part with its value as its width", () => {
    const { container } = render(<ProportionBar parts={hours} formatValue={h} />)
    const parts = container.querySelectorAll<HTMLElement>('[data-slot="proportion-bar-part"]')
    expect(parts).toHaveLength(6)
    expect(parts[0].style.flexGrow).toBe("92.25")
    expect(parts[0].title).toBe("On a package 92.25 h")
    expect(parts[3].style.background).toBe("var(--proportion-bar-fill-4)")
  })

  it("fills by position when a part sets no fill, and builds in hatched, striped and alert", () => {
    const { container } = render(
      <ProportionBar
        parts={[
          { label: "a", value: 1 },
          { label: "b", value: 1 },
          { label: "c", value: 1 },
          { label: "d", value: 1 },
          { label: "e", value: 1 },
          { label: "f", value: 1, fill: "hatched" },
          { label: "g", value: 1, fill: "striped" },
          { label: "h", value: 1, fill: "alert" },
        ]}
      />
    )
    const cls = [...container.querySelectorAll('[data-slot="proportion-bar-part"]')].map((p) => p.className)
    expect(cls[0]).toMatch(/fill1/)
    expect(cls[3]).toMatch(/fill4/)
    expect(cls[4]).toMatch(/fill1/)
    expect(cls[5]).toMatch(/hatched/)
    expect(cls[6]).toMatch(/striped/)
    expect(cls[7]).toMatch(/alert/)
  })

  it("leaves a zero part out of the bar and keeps it in the legend", () => {
    const { container } = render(
      <ProportionBar
        legend
        formatValue={(v) => `$${v}`}
        parts={[
          { label: "Invoiced", value: 12455 },
          { label: "Waiting", value: 9025, fill: "striped" },
          { label: "Written off", value: 0, fill: "hatched" },
        ]}
      />
    )
    expect(container.querySelectorAll('[data-slot="proportion-bar-part"]')).toHaveLength(2)
    const items = screen.getAllByRole("listitem")
    expect(items.map((li) => li.textContent)).toEqual(["Invoiced $12455", "Waiting $9025", "Written off $0"])
  })

  it("names the alert part in the alert text colour", () => {
    render(<ProportionBar legend parts={hours} />)
    const alert = screen.getByText("Unresolved").closest("li")!
    expect(alert.className).toMatch(/legendAlert/)
    expect(screen.getByText("On a package").closest("li")!.className).not.toMatch(/legendAlert/)
  })

  it("draws one neutral track when nothing is measured", () => {
    const { container } = render(
      <ProportionBar legend formatValue={h} parts={[{ label: "Invoiced", value: 0 }]} />
    )
    expect(container.querySelector('[data-slot="proportion-bar-part"]')).toBeNull()
    expect(container.querySelector('[data-slot="proportion-bar-empty"]')).not.toBeNull()
    expect(screen.getByRole("img")).toHaveAccessibleName("0 h: Invoiced 0 h")
  })

  it("draws the empty track with no parts at all", () => {
    const { container } = render(<ProportionBar parts={[]} />)
    expect(container.querySelector('[data-slot="proportion-bar-empty"]')).not.toBeNull()
    expect(screen.getByRole("img")).toHaveAccessibleName("0")
    expect(screen.queryByRole("list")).toBeNull()
  })

  it("has no legend unless asked", () => {
    render(<ProportionBar parts={hours} />)
    expect(screen.queryByRole("list")).toBeNull()
  })

  it("sets the size on the root and passes props through", () => {
    const { container } = render(<ProportionBar size="thin" parts={hours} data-testid="bar" className="x" />)
    const root = container.firstElementChild as HTMLElement
    expect(root.dataset.size).toBe("thin")
    expect(root.dataset.testid).toBe("bar")
    expect(root.className).toMatch(/\bx\b/)
  })

  it("has no axe violations, with and without a legend", async () => {
    const { container } = render(
      <>
        <ProportionBar parts={hours} formatValue={h} legend />
        <ProportionBar parts={[]} size="thin" />
      </>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
