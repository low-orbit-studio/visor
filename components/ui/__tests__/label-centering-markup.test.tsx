import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Badge } from "../badge/badge"
import { Chip } from "../chip/chip"
import { Tabs, TabsList, TabsTrigger } from "../tabs/tabs"
import { ToggleGroup, ToggleGroupItem } from "../toggle-group/toggle-group"

/** VI-684: bare text sits in a label span the stylesheet trims; elements pass through. */
describe("label centring markup", () => {
  it("Badge wraps text and numbers, not elements", () => {
    const { container } = render(
      <Badge>
        <svg data-testid="icon" />
        New
        {3}
      </Badge>,
    )
    const texts = container.querySelectorAll('[data-slot="badge-text"]')
    expect([...texts].map((t) => t.textContent)).toEqual(["New", "3"])
    expect(screen.getByTestId("icon").parentElement).toBe(container.querySelector('[data-slot="badge"]'))
  })

  it("ToggleGroupItem wraps its text in the item", () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">
          <svg data-testid="icon" />
          Alpha
        </ToggleGroupItem>
      </ToggleGroup>,
    )
    const item = screen.getByRole("radio", { name: "Alpha" })
    expect(item.querySelector('[data-slot="toggle-group-text"]')?.textContent).toBe("Alpha")
    expect(screen.getByTestId("icon").parentElement).toBe(item)
  })

  it("TabsTrigger wraps its text, with and without a count", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Plain</TabsTrigger>
          <TabsTrigger value="b" count={4}>
            Counted
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    for (const name of [/Plain/, /Counted/]) {
      expect(screen.getByRole("tab", { name }).querySelector('[data-slot="tabs-trigger-text"]')).not.toBeNull()
    }
  })

  it("Chip labels carry the chip-text slot", () => {
    const { container } = render(<Chip label="Tag" />)
    expect(container.querySelector('[data-slot="chip-text"]')?.textContent).toBe("Tag")
  })
})
