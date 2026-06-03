import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Badge, type BadgeProps } from "../badge"
import styles from "../badge.module.css"
import { checkA11y } from "../../../../test-utils/a11y"

const VARIANTS = [
  "default",
  "secondary",
  "outline",
  "destructive",
  "success",
  "warning",
  "info",
  "filled-destructive",
  "filled-success",
  "filled-warning",
  "filled-info",
] as const satisfies readonly NonNullable<BadgeProps["variant"]>[]

const SIZES = ["sm", "md", "lg"] as const satisfies readonly NonNullable<
  BadgeProps["size"]
>[]

const SIZE_CLASS: Record<(typeof SIZES)[number], string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
}

describe("Badge", () => {
  it("renders with default props", () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText("New")).toBeInTheDocument()
  })

  it("renders with custom className", () => {
    render(<Badge className="custom-class">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveClass("custom-class")
  })

  it("applies data-slot attribute", () => {
    render(<Badge>Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-slot", "badge")
  })

  it("applies data-variant for default variant", () => {
    render(<Badge>Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "default")
  })

  it("applies data-variant for secondary variant", () => {
    render(<Badge variant="secondary">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "secondary")
  })

  it("applies data-variant for outline variant", () => {
    render(<Badge variant="outline">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "outline")
  })

  it("applies data-variant for destructive variant", () => {
    render(<Badge variant="destructive">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "destructive")
  })

  it("applies data-variant for success variant", () => {
    render(<Badge variant="success">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "success")
  })

  it("applies data-variant for warning variant", () => {
    render(<Badge variant="warning">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "warning")
  })

  it("applies data-variant for info variant", () => {
    render(<Badge variant="info">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "info")
  })

  it("applies data-variant for filled-destructive variant", () => {
    render(<Badge variant="filled-destructive">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "filled-destructive")
  })

  it("applies data-variant for filled-success variant", () => {
    render(<Badge variant="filled-success">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "filled-success")
  })

  it("applies data-variant for filled-warning variant", () => {
    render(<Badge variant="filled-warning">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "filled-warning")
  })

  it("applies data-variant for filled-info variant", () => {
    render(<Badge variant="filled-info">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "filled-info")
  })

  it("applies data-variant for neutral variant", () => {
    render(<Badge variant="neutral">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "neutral")
  })

  it("applies variantNeutral CSS class for neutral variant", () => {
    render(<Badge variant="neutral">Draft</Badge>)
    const el = screen.getByText("Draft")
    expect(el.className).toMatch(/variantNeutral/)
  })

  it("applies data-variant for filled-neutral variant", () => {
    render(<Badge variant="filled-neutral">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute(
      "data-variant",
      "filled-neutral"
    )
  })

  it("applies variantFilledNeutral CSS class for filled-neutral variant", () => {
    render(<Badge variant="filled-neutral">Archived</Badge>)
    const el = screen.getByText("Archived")
    expect(el.className).toMatch(/variantFilledNeutral/)
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<Badge ref={ref}>Badge</Badge>)
    expect(ref.current).not.toBeNull()
  })

  it("renders children correctly", () => {
    render(<Badge>Status</Badge>)
    expect(screen.getByText("Status")).toBeInTheDocument()
  })
})

describe("Badge size", () => {
  it("defaults to md when no size prop is provided", () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText("Default")
    expect(badge).toHaveAttribute("data-size", "md")
    expect(badge).toHaveClass(styles.sizeMd)
  })

  it.each(SIZES)("applies data-size and the size class for size=%s", (size) => {
    render(<Badge size={size}>Sized</Badge>)
    const badge = screen.getByText("Sized")
    expect(badge).toHaveAttribute("data-size", size)
    expect(badge).toHaveClass(SIZE_CLASS[size])
  })

  // Zero-diff guard (D2): a Badge with no size prop must produce the same
  // className as an explicit size="md" Badge.
  it("renders no-size Badge identically to size=md", () => {
    const { container: noSize } = render(<Badge>X</Badge>)
    const { container: explicitMd } = render(<Badge size="md">X</Badge>)
    const a = noSize.querySelector('[data-slot="badge"]')
    const b = explicitMd.querySelector('[data-slot="badge"]')
    expect(a?.className).toBe(b?.className)
  })

  // Full 3 × 11 matrix: every variant renders at every size with the correct
  // size class, base data-slot, and matching data-variant/data-size.
  describe.each(SIZES)("size=%s", (size) => {
    it.each(VARIANTS)("renders variant=%s", (variant) => {
      render(
        <Badge size={size} variant={variant}>
          Cell
        </Badge>
      )
      const badge = screen.getByText("Cell")
      expect(badge).toHaveAttribute("data-slot", "badge")
      expect(badge).toHaveAttribute("data-variant", variant)
      expect(badge).toHaveAttribute("data-size", size)
      expect(badge).toHaveClass(SIZE_CLASS[size])
    })
  })

  it("scales an embedded icon by rendering it as a direct child", () => {
    render(
      <Badge size="lg">
        <svg data-testid="badge-icon" />
        Labeled
      </Badge>
    )
    const badge = screen.getByText("Labeled").closest('[data-slot="badge"]')
    const icon = screen.getByTestId("badge-icon")
    // Icon is a direct child so the .sizeLg > svg rule applies.
    expect(icon.parentElement).toBe(badge)
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (default variant)", async () => {
    const { container } = render(<Badge>New</Badge>)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (destructive variant)", async () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (success variant)", async () => {
    const { container } = render(<Badge variant="success">Done</Badge>)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (info variant)", async () => {
    const { container } = render(<Badge variant="info">Note</Badge>)
    await checkA11y(container)
  })
})
