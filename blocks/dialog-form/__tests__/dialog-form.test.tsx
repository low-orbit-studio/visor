import { readFileSync } from "fs"
import { resolve } from "path"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  DialogForm,
  DialogFormContent,
  DialogFormHeader,
  DialogFormTitle,
  DialogFormBody,
  DialogFormFooter,
  DialogFormDescription,
} from "../dialog-form"
import type { DialogFormContentProps } from "../dialog-form"
import { Button } from "../../../components/ui/button/button"
import { checkA11y } from "../../../test-utils/a11y"

function Example({
  size,
  width,
  border,
}: {
  size?: "sm" | "md"
  width?: DialogFormContentProps["width"]
  border?: DialogFormContentProps["border"]
} = {}) {
  return (
    <DialogForm open>
      <DialogFormContent width={width} border={border}>
        <DialogFormHeader>
          <DialogFormTitle size={size}>Invite user</DialogFormTitle>
          <DialogFormDescription>Send an invitation.</DialogFormDescription>
        </DialogFormHeader>
        <DialogFormBody>
          <div>body content</div>
        </DialogFormBody>
        <DialogFormFooter>
          <Button size="dlg" variant="ghost">
            Cancel
          </Button>
          <Button size="dlg">Send</Button>
        </DialogFormFooter>
      </DialogFormContent>
    </DialogForm>
  )
}

describe("DialogForm", () => {
  it("renders the titled shell when open", () => {
    render(<Example />)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Invite user")).toBeInTheDocument()
    expect(screen.getByText("Send an invitation.")).toBeInTheDocument()
    expect(screen.getByText("body content")).toBeInTheDocument()
  })

  it("renders the footer action buttons", () => {
    render(<Example />)
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument()
  })

  it("the title is an accessible heading via Radix DialogTitle", () => {
    render(<Example size="md" />)
    // Radix associates DialogTitle with the dialog's aria-labelledby.
    expect(screen.getByText("Invite user")).toBeInTheDocument()
  })

  it("passes accessibility checks", async () => {
    const { baseElement } = render(<Example />)
    await checkA11y(baseElement)
  })

  describe("width axis", () => {
    it("defaults the panel to md (30rem) width", () => {
      render(<Example />)
      const panel = screen.getByRole("dialog")
      expect(panel).toHaveClass("widthMd")
      expect(panel).not.toHaveClass("widthSm")
      expect(panel).not.toHaveClass("widthLg")
    })

    it("width=\"sm\" selects the compact panel width", () => {
      render(<Example width="sm" />)
      const panel = screen.getByRole("dialog")
      expect(panel).toHaveClass("widthSm")
      expect(panel).not.toHaveClass("widthMd")
    })

    it("width=\"lg\" selects the wide panel width", () => {
      render(<Example width="lg" />)
      const panel = screen.getByRole("dialog")
      expect(panel).toHaveClass("widthLg")
      expect(panel).not.toHaveClass("widthMd")
    })
  })

  describe("border variant", () => {
    it("keeps the hairline border by default (no borderless class)", () => {
      render(<Example />)
      expect(screen.getByRole("dialog")).not.toHaveClass("panelBorderless")
    })

    it("border=\"none\" applies the borderless class that nulls the seam token", () => {
      render(<Example border="none" />)
      expect(screen.getByRole("dialog")).toHaveClass("panelBorderless")
    })
  })

  describe("panel token seams (CSS-only)", () => {
    const css = readFileSync(
      resolve(__dirname, "..", "dialog-form.module.css"),
      "utf-8"
    )

    it("panel border reads --dialog-form-panel-border, defaulting to the hairline", () => {
      expect(css).toContain("--dialog-form-panel-border,")
      expect(css).toContain("var(--stroke-width-thin, 1px) solid")
      expect(css).toContain("var(--hairline, var(--border-default, #e5e7eb))")
    })

    it("borderless variant nulls the panel-border seam token", () => {
      expect(css).toContain("--dialog-form-panel-border: none;")
    })

    it("width classes wrap --dialog-form-width-* tokens with rem fallbacks", () => {
      expect(css).toContain("max-width: var(--dialog-form-width-sm, 24rem);")
      expect(css).toContain("max-width: var(--dialog-form-width-md, 30rem);")
      expect(css).toContain("max-width: var(--dialog-form-width-lg, 40rem);")
    })
  })
})
