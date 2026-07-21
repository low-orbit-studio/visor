import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { DialogField, DialogFieldLabel, DialogFieldControl } from "../dialog-field"
import { checkA11y } from "../../../test-utils/a11y"

describe("DialogField", () => {
  it("renders label + control well hosting an input", () => {
    render(
      <DialogField>
        <DialogFieldLabel htmlFor="df-name">Name</DialogFieldLabel>
        <DialogFieldControl>
          <input id="df-name" defaultValue="" />
        </DialogFieldControl>
      </DialogField>
    )
    expect(screen.getByText("Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toBeInTheDocument()
  })

  it("wires the label to the control via htmlFor", () => {
    render(
      <DialogField>
        <DialogFieldLabel htmlFor="df-email">Email</DialogFieldLabel>
        <DialogFieldControl>
          <input id="df-email" type="email" />
        </DialogFieldControl>
      </DialogField>
    )
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email")
  })

  it("accepts typed input inside the well", async () => {
    const user = userEvent.setup()
    render(
      <DialogField>
        <DialogFieldLabel htmlFor="df-city">City</DialogFieldLabel>
        <DialogFieldControl>
          <input id="df-city" />
        </DialogFieldControl>
      </DialogField>
    )
    const input = screen.getByLabelText("City")
    await user.type(input, "Brooklyn")
    expect(input).toHaveValue("Brooklyn")
  })

  it("renders leading icon and trailing slots as decoration", () => {
    render(
      <DialogField>
        <DialogFieldLabel htmlFor="df-amt">Amount</DialogFieldLabel>
        <DialogFieldControl
          icon={<span data-testid="lead">$</span>}
          trailing={<span data-testid="trail">▾</span>}
        >
          <input id="df-amt" />
        </DialogFieldControl>
      </DialogField>
    )
    expect(screen.getByTestId("lead")).toBeInTheDocument()
    expect(screen.getByTestId("trail")).toBeInTheDocument()
  })

  it("passes accessibility checks", async () => {
    const { container } = render(
      <DialogField>
        <DialogFieldLabel htmlFor="df-a11y">Label</DialogFieldLabel>
        <DialogFieldControl>
          <input id="df-a11y" />
        </DialogFieldControl>
      </DialogField>
    )
    await checkA11y(container)
  })
})
