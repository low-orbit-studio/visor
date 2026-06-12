import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { PauseCircleIcon } from "@phosphor-icons/react"
import { ConfirmDialog } from "../confirm-dialog"

/**
 * Editorial API merged in from the blessed admin build:
 *   iconTreatment ("inline" | "plated"), mode ("dialog" | "inline"),
 *   cancelVariant, custom icon override.
 *
 * The canonical default (iconTreatment unset) must remain the tinted plate
 * stacked above the title — verified here and in confirm-dialog.test.tsx.
 */
describe("ConfirmDialog — editorial treatments", () => {
  describe("default treatment (iconTreatment unset)", () => {
    it("renders the canonical plate slot, NOT the blessed icon slot", () => {
      const { baseElement } = render(
        <ConfirmDialog open title="Delete?" severity="destructive" />
      )
      // Canonical default: plate slot present
      const plate = baseElement.querySelector(
        '[data-slot="confirm-dialog-icon-plate"]'
      )
      expect(plate).toBeInTheDocument()
      expect(plate?.className).toMatch(/iconPlate/)
      expect(plate?.className).toMatch(/plateDestructive/)
      // Blessed icon slot must NOT be used in the default path
      expect(
        baseElement.querySelector('[data-slot="confirm-dialog-icon"]')
      ).toBeNull()
    })
  })

  describe('iconTreatment="plated" (blessed plate)', () => {
    it("renders the blessed icon slot with iconPlated + per-severity color-mix class", () => {
      const { baseElement } = render(
        <ConfirmDialog
          open
          title="Suspend users?"
          severity="warning"
          iconTreatment="plated"
        />
      )
      const icon = baseElement.querySelector(
        '[data-slot="confirm-dialog-icon"]'
      )
      expect(icon).toBeInTheDocument()
      expect(icon?.className).toMatch(/iconPlated/)
      expect(icon?.className).toMatch(/iconPlatedWarning/)
      expect(icon).toHaveAttribute("aria-hidden", "true")
      // Title row uses the plated column layout
      expect(
        baseElement.querySelector('[class*="titleRowPlated"]')
      ).toBeInTheDocument()
      // Canonical plate slot is not used
      expect(
        baseElement.querySelector('[data-slot="confirm-dialog-icon-plate"]')
      ).toBeNull()
    })

    it("maps the danger alias to the destructive plated tint", () => {
      const { baseElement } = render(
        <ConfirmDialog
          open
          title="Delete users?"
          severity="danger"
          iconTreatment="plated"
        />
      )
      const icon = baseElement.querySelector(
        '[data-slot="confirm-dialog-icon"]'
      )
      expect(icon?.className).toMatch(/iconPlatedDanger/)
    })
  })

  describe('iconTreatment="inline" (blessed inline icon)', () => {
    it("renders a small leading icon with .icon + severity color class, no plate", () => {
      const { baseElement } = render(
        <ConfirmDialog
          open
          title="Sign out device?"
          severity="info"
          iconTreatment="inline"
        />
      )
      const icon = baseElement.querySelector(
        '[data-slot="confirm-dialog-icon"]'
      )
      expect(icon).toBeInTheDocument()
      // non-scoped CSS modules → verbatim class names: "icon iconInfo"
      const iconClasses = (icon?.className ?? "").split(/\s+/)
      expect(iconClasses).toContain("icon")
      expect(iconClasses).toContain("iconInfo")
      expect(icon?.className).not.toMatch(/iconPlated/)
      // Inline row layout (icon next to title) — exact .titleRow, not plated
      const titleRow = baseElement.querySelector(".titleRow")
      expect(titleRow).toBeInTheDocument()
      expect(
        baseElement.querySelector('[data-slot="confirm-dialog-icon-plate"]')
      ).toBeNull()
    })
  })

  describe("custom icon override", () => {
    it("renders the provided icon inside the icon slot for explicit treatments", () => {
      const { baseElement } = render(
        <ConfirmDialog
          open
          title="Suspend users?"
          severity="warning"
          iconTreatment="plated"
          icon={<PauseCircleIcon weight="fill" data-testid="custom-icon" />}
        />
      )
      expect(screen.getByTestId("custom-icon")).toBeInTheDocument()
    })
  })

  describe('mode="inline" (non-portal surface)', () => {
    it("renders an alertdialog surface in normal flow when open", () => {
      const { container } = render(
        <ConfirmDialog
          open
          mode="inline"
          severity="warning"
          iconTreatment="plated"
          title="Suspend users?"
        />
      )
      const surface = container.querySelector('[data-slot="confirm-dialog"]')
      expect(surface).toBeInTheDocument()
      expect(surface).toHaveAttribute("role", "alertdialog")
      expect(surface).toHaveAttribute("data-mode", "inline")
      expect(surface).toHaveAttribute("aria-modal", "false")
      expect(surface).toHaveAttribute("data-severity", "warning")
      expect(surface?.className).toMatch(/inlineSurface/)
      // No portal dialog role in inline mode
      expect(screen.queryByRole("dialog")).toBeNull()
      // Inline header replaces Radix DialogTitle with a plain heading
      expect(
        container.querySelector('[class*="inlineTitle"]')
      ).toBeInTheDocument()
    })

    it("renders nothing when closed (consumer-driven open)", () => {
      const { container } = render(
        <ConfirmDialog mode="inline" title="Delete?" severity="danger" />
      )
      expect(
        container.querySelector('[data-slot="confirm-dialog"]')
      ).toBeNull()
    })

    it("normalizes the danger alias to destructive in inline mode", () => {
      const { container } = render(
        <ConfirmDialog
          open
          mode="inline"
          severity="danger"
          iconTreatment="plated"
          title="Delete users?"
        />
      )
      const surface = container.querySelector('[data-slot="confirm-dialog"]')
      expect(surface).toHaveAttribute("data-severity", "destructive")
    })
  })

  describe("cancelVariant", () => {
    it("defaults to outline", () => {
      const { baseElement } = render(
        <ConfirmDialog open title="Confirm" />
      )
      const cancel = baseElement.querySelector(
        '[data-slot="confirm-dialog-cancel"]'
      )
      expect(cancel?.className).toMatch(/variantOutline/)
    })

    it("applies a custom variant (ghost) used by golden editorial screens", () => {
      const { container } = render(
        <ConfirmDialog
          open
          mode="inline"
          iconTreatment="plated"
          severity="warning"
          title="Suspend users?"
          cancelVariant="ghost"
        />
      )
      const cancel = container.querySelector(
        '[data-slot="confirm-dialog-cancel"]'
      )
      expect(cancel?.className).toMatch(/variantGhost/)
    })
  })
})
