import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { axe } from "../../../../test-utils/axe"
import { RichText } from "../rich-text"

const TEXT = "Doors open at *6 PM* – bring _your_ ticket.\n\n- Read the [guide](https://example.com)\n- Write to [us](mailto:help@example.com)"

describe("RichText a11y", () => {
  it("has no axe violations in styled mode inside a <p>", async () => {
    const { container } = render(
      <p>
        <RichText text={TEXT} dashes />
      </p>
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it("has no axe violations with plain elements", async () => {
    const { container } = render(
      <div>
        <RichText text={TEXT} elements />
      </div>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
