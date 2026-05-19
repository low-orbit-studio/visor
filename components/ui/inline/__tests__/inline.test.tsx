import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Inline } from "../inline"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Inline", () => {
  it("renders as a div by default", () => {
    render(
      <Inline data-testid="inline">
        <span>a</span>
        <span>b</span>
      </Inline>
    )
    const el = screen.getByTestId("inline")
    expect(el.tagName).toBe("DIV")
    expect(el).toHaveAttribute("data-slot", "inline")
  })

  it("default gap is md (spacing-4)", () => {
    const { getByTestId } = render(<Inline data-testid="inline">x</Inline>)
    const style = getByTestId("inline").getAttribute("style") ?? ""
    expect(style).toContain("--inline-gap")
    expect(style).toContain("var(--spacing-4")
  })

  it("gap token applies the matching --spacing-N variable", () => {
    const { getByTestId } = render(
      <Inline gap="xs" data-testid="inline">
        x
      </Inline>
    )
    const style = getByTestId("inline").getAttribute("style") ?? ""
    expect(style).toContain("var(--spacing-1")
  })

  it("renders all align variants", () => {
    const aligns = ["start", "center", "end", "stretch", "baseline"] as const
    aligns.forEach((align) => {
      const { unmount, getByTestId } = render(
        <Inline align={align} data-testid="inline">
          x
        </Inline>
      )
      expect(getByTestId("inline").className).toMatch(/align/i)
      unmount()
    })
  })

  it("renders all justify variants", () => {
    const justifies = [
      "start",
      "center",
      "end",
      "between",
      "around",
      "evenly",
    ] as const
    justifies.forEach((justify) => {
      const { unmount, getByTestId } = render(
        <Inline justify={justify} data-testid="inline">
          x
        </Inline>
      )
      expect(getByTestId("inline").className).toMatch(/justify/i)
      unmount()
    })
  })

  it("wrap=true sets data-wrap and adds wrap class", () => {
    const { getByTestId } = render(
      <Inline wrap data-testid="inline">
        x
      </Inline>
    )
    const el = getByTestId("inline")
    expect(el).toHaveAttribute("data-wrap", "true")
    expect(el.className).toMatch(/wrap/i)
  })

  it("polymorphic via the `as` prop", () => {
    render(
      <Inline as="nav" data-testid="inline">
        x
      </Inline>
    )
    expect(screen.getByTestId("inline").tagName).toBe("NAV")
  })

  it("resolves responsive gap into per-breakpoint variables", () => {
    const { getByTestId } = render(
      <Inline gap={{ base: "sm", lg: "xl" }} data-testid="inline">
        x
      </Inline>
    )
    const style = getByTestId("inline").getAttribute("style") ?? ""
    expect(style).toContain("--inline-gap:")
    expect(style).toContain("--inline-gap-lg")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLElement | null }
    render(<Inline ref={ref}>x</Inline>)
    expect(ref.current).toBeInstanceOf(HTMLElement)
  })

  it("merges custom className and passes HTML attrs", () => {
    render(
      <Inline className="extra" id="row" data-testid="inline">
        x
      </Inline>
    )
    const el = screen.getByTestId("inline")
    expect(el).toHaveClass("extra")
    expect(el).toHaveAttribute("id", "row")
  })
})

describe("Inline / accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Inline gap="sm" as="nav">
        <a href="#one">One</a>
        <a href="#two">Two</a>
      </Inline>
    )
    await checkA11y(container)
  })
})
