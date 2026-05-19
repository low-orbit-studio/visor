import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Grid } from "../grid"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Grid", () => {
  it("renders as a div by default", () => {
    render(
      <Grid data-testid="grid">
        <span>a</span>
      </Grid>
    )
    const el = screen.getByTestId("grid")
    expect(el.tagName).toBe("DIV")
    expect(el).toHaveAttribute("data-slot", "grid")
  })

  it("numeric columns set --grid-cols", () => {
    const { getByTestId } = render(
      <Grid columns={3} data-testid="grid">
        x
      </Grid>
    )
    const style = getByTestId("grid").getAttribute("style") ?? ""
    expect(style).toContain("--grid-cols")
    expect(style).toContain("3")
  })

  it("responsive columns set per-breakpoint variables", () => {
    const { getByTestId } = render(
      <Grid columns={{ base: 1, md: 2, lg: 4 }} data-testid="grid">
        x
      </Grid>
    )
    const style = getByTestId("grid").getAttribute("style") ?? ""
    expect(style).toContain("--grid-cols")
    expect(style).toContain("--grid-cols-md")
    expect(style).toContain("--grid-cols-lg")
  })

  it("string template sets --grid-template-columns and data-template=true", () => {
    const { getByTestId } = render(
      <Grid columns="1fr 2fr" data-testid="grid">
        x
      </Grid>
    )
    const el = getByTestId("grid")
    expect(el).toHaveAttribute("data-template", "true")
    const style = el.getAttribute("style") ?? ""
    expect(style).toContain("--grid-template-columns")
    expect(style).toContain("1fr 2fr")
  })

  it("default gap is md (spacing-4)", () => {
    const { getByTestId } = render(<Grid data-testid="grid">x</Grid>)
    const style = getByTestId("grid").getAttribute("style") ?? ""
    expect(style).toContain("--grid-gap")
    expect(style).toContain("var(--spacing-4")
  })

  it("gap token resolves to matching --spacing-N", () => {
    const { getByTestId } = render(
      <Grid gap="xl" data-testid="grid">
        x
      </Grid>
    )
    const style = getByTestId("grid").getAttribute("style") ?? ""
    expect(style).toContain("var(--spacing-8")
  })

  it("responsive gap sets per-breakpoint variables", () => {
    const { getByTestId } = render(
      <Grid gap={{ base: "sm", md: "md", lg: "xl" }} data-testid="grid">
        x
      </Grid>
    )
    const style = getByTestId("grid").getAttribute("style") ?? ""
    expect(style).toContain("--grid-gap:")
    expect(style).toContain("--grid-gap-md")
    expect(style).toContain("--grid-gap-lg")
  })

  it("renders all align/justify variants", () => {
    const aligns = ["start", "center", "end", "stretch"] as const
    aligns.forEach((align) => {
      const { unmount, getByTestId } = render(
        <Grid align={align} justify={align} data-testid="grid">
          x
        </Grid>
      )
      const cls = getByTestId("grid").className
      expect(cls).toMatch(/align/i)
      expect(cls).toMatch(/justify/i)
      unmount()
    })
  })

  it("polymorphic via the `as` prop", () => {
    render(
      <Grid as="ul" data-testid="grid">
        <li>a</li>
      </Grid>
    )
    expect(screen.getByTestId("grid").tagName).toBe("UL")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLElement | null }
    render(<Grid ref={ref}>x</Grid>)
    expect(ref.current).toBeInstanceOf(HTMLElement)
  })

  it("merges custom className", () => {
    const { getByTestId } = render(
      <Grid className="extra" data-testid="grid">
        x
      </Grid>
    )
    expect(getByTestId("grid")).toHaveClass("extra")
  })
})

describe("Grid / accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Grid columns={2} gap="md" as="ul">
        <li>One</li>
        <li>Two</li>
      </Grid>
    )
    await checkA11y(container)
  })
})
