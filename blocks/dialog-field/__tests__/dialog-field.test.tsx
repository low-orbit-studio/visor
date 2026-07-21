import { readFileSync } from "fs"
import { resolve } from "path"
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

  describe("size axis (well padding only)", () => {
    it("defaults the control well to md padding", () => {
      const { container } = render(
        <DialogField>
          <DialogFieldControl>
            <input id="df-size-default" />
          </DialogFieldControl>
        </DialogField>
      )
      const control = container.querySelector('[data-slot="dialog-field-control"]')
      expect(control).toHaveClass("controlMd")
      expect(control).not.toHaveClass("controlSm")
    })

    it("size=\"sm\" swaps to the compact well padding", () => {
      const { container } = render(
        <DialogField>
          <DialogFieldControl size="sm">
            <input id="df-size-sm" />
          </DialogFieldControl>
        </DialogField>
      )
      const control = container.querySelector('[data-slot="dialog-field-control"]')
      expect(control).toHaveClass("controlSm")
      expect(control).not.toHaveClass("controlMd")
    })

    it("leaves the label typography untouched across sizes", () => {
      const { container } = render(
        <DialogField>
          <DialogFieldLabel htmlFor="df-size-label">Name</DialogFieldLabel>
          <DialogFieldControl size="sm">
            <input id="df-size-label" />
          </DialogFieldControl>
        </DialogField>
      )
      // The size axis lives on the control; the label keeps its single .label class.
      const label = container.querySelector('[data-slot="dialog-field-label"]')
      expect(label).toHaveClass("label")
      expect(label).not.toHaveClass("controlSm")
    })
  })

  describe("size token seams (CSS-only)", () => {
    const css = readFileSync(
      resolve(__dirname, "..", "dialog-field.module.css"),
      "utf-8"
    )

    it("controlSm padding wraps --input-padding-sm with a spacing-token fallback", () => {
      expect(css).toContain(
        "padding: var(--input-padding-sm, var(--spacing-1, 0.25rem) var(--spacing-3, 0.75rem));"
      )
    })

    it("controlMd padding wraps --input-padding-md with a spacing-token fallback", () => {
      expect(css).toContain(
        "padding: var(--input-padding-md, var(--spacing-3_5, 0.875rem) var(--spacing-4, 1rem));"
      )
    })
  })
})
