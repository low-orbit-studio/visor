import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Button } from "../button/button"

const Icon = () => <svg data-testid="icon" />

describe("VI-733 Button label wrapping", () => {
  it("<Icon/> {\" \"} Label renders one label span", () => {
    const { container } = render(
      <Button>
        <Icon /> {" "}Label
      </Button>
    )
    const spans = container.querySelectorAll("[data-slot=button-text]")
    expect(spans).toHaveLength(1)
    expect(spans[0].textContent).toBe("Label")
  })

  it("a lone whitespace child renders no label span", () => {
    const { container } = render(
      <Button>
        <Icon /> <Icon />
      </Button>
    )
    expect(container.querySelectorAll("[data-slot=button-text]")).toHaveLength(0)
  })

  it("adjacent strings join into one label", () => {
    const { container } = render(<Button>Void {"invoice"} {3}</Button>)
    const spans = container.querySelectorAll("[data-slot=button-text]")
    expect(spans).toHaveLength(1)
    expect(spans[0].textContent).toBe("Void invoice 3")
  })
})
