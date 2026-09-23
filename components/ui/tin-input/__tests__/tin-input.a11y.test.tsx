import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { TinInput, type TinInputProps } from "../tin-input"
import { Field, FieldLabel } from "../../field/field"

function renderInField(props: Partial<TinInputProps> = {}) {
  return render(
    <Field>
      <FieldLabel htmlFor="tin">Taxpayer ID</FieldLabel>
      <TinInput id="tin" kind="ssn" onValueChange={() => {}} {...props} />
    </Field>
  )
}

describe("TinInput a11y (vitest-axe)", () => {
  it("empty state has no WCAG 2.1 AA violations", async () => {
    const { container } = renderInField()
    expect(await axe(container)).toHaveNoViolations()
  })

  it("error state has no WCAG 2.1 AA violations", async () => {
    const { container } = renderInField({ error: "Enter all 9 digits" })
    expect(await axe(container)).toHaveNoViolations()
  })

  it("on-file state has no WCAG 2.1 AA violations", async () => {
    const { container } = renderInField({ lastFour: "6789" })
    expect(await axe(container)).toHaveNoViolations()
  })

  it("on-file state with an error has no WCAG 2.1 AA violations", async () => {
    const { container } = renderInField({ lastFour: "6789", error: "This TIN did not match" })
    expect(await axe(container)).toHaveNoViolations()
  })

  it("committed echo has no WCAG 2.1 AA violations", async () => {
    const user = userEvent.setup()
    const { container } = renderInField({ kind: "ein" })
    await user.type(screen.getByLabelText("Taxpayer ID"), "123456789")
    await user.tab()
    expect(await axe(container)).toHaveNoViolations()
  })

  it("labelled by aria-label alone has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <TinInput aria-label="Employer ID" kind="ein" onValueChange={() => {}} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
