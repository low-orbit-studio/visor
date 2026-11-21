import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { useRef } from "react"
import { axe } from "../../../../test-utils/axe"
import { ScrollHint, useKeepGoing } from "../scroll-hint"

function Form() {
  const box = useRef<HTMLDivElement>(null)
  const kg = useKeepGoing(box, ["name"])
  return (
    <div ref={box}>
      <label data-field="name">
        Name
        <input />
      </label>
      <ScrollHint boxRef={box} keepGoing={{ ...kg, more: true }} />
    </div>
  )
}

describe("ScrollHint a11y", () => {
  it("has no axe violations, shown, with its pill hidden and out of the tab order", async () => {
    const { container } = render(<Form />)
    expect(container.querySelector("[data-slot=scroll-hint][data-show]")).not.toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })
})
