import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Stack } from "../stack"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Stack", () => {
  it("renders as a div by default", () => {
    render(
      <Stack data-testid="stack">
        <span>a</span>
        <span>b</span>
      </Stack>
    )
    const el = screen.getByTestId("stack")
    expect(el.tagName).toBe("DIV")
    expect(el).toHaveAttribute("data-slot", "stack")
  })

  it("default gap resolves to spacing-4 (md)", () => {
    const { getByTestId } = render(<Stack data-testid="stack">x</Stack>)
    const style = getByTestId("stack").getAttribute("style") ?? ""
    expect(style).toContain("--stack-gap")
    expect(style).toContain("var(--spacing-4")
  })

  it("explicit gap token applies the matching --spacing-N variable", () => {
    const { getByTestId } = render(
      <Stack gap="lg" data-testid="stack">
        x
      </Stack>
    )
    const style = getByTestId("stack").getAttribute("style") ?? ""
    expect(style).toContain("var(--spacing-6")
  })

  it("renders all alignment variants", () => {
    const aligns = ["start", "center", "end", "stretch"] as const
    aligns.forEach((align) => {
      const { unmount, getByTestId } = render(
        <Stack align={align} data-testid="stack">
          x
        </Stack>
      )
      const cls = getByTestId("stack").className
      expect(cls).toMatch(/align/i)
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
        <Stack justify={justify} data-testid="stack">
          x
        </Stack>
      )
      const cls = getByTestId("stack").className
      expect(cls).toMatch(/justify/i)
      unmount()
    })
  })

  it("polymorphic via the `as` prop", () => {
    render(
      <Stack as="section" data-testid="stack">
        x
      </Stack>
    )
    expect(screen.getByTestId("stack").tagName).toBe("SECTION")
  })

  it("resolves responsive gap into per-breakpoint variables", () => {
    const { getByTestId } = render(
      <Stack gap={{ base: "sm", md: "lg", xl: "2xl" }} data-testid="stack">
        x
      </Stack>
    )
    const style = getByTestId("stack").getAttribute("style") ?? ""
    expect(style).toContain("--stack-gap:")
    expect(style).toContain("--stack-gap-md")
    expect(style).toContain("--stack-gap-xl")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLElement | null }
    render(<Stack ref={ref}>x</Stack>)
    expect(ref.current).toBeInstanceOf(HTMLElement)
  })

  it("merges custom className", () => {
    const { getByTestId } = render(
      <Stack className="custom" data-testid="stack">
        x
      </Stack>
    )
    expect(getByTestId("stack")).toHaveClass("custom")
  })

  it("passes through HTML attributes", () => {
    render(
      <Stack aria-label="region" id="region" data-testid="stack">
        x
      </Stack>
    )
    const el = screen.getByTestId("stack")
    expect(el).toHaveAttribute("aria-label", "region")
    expect(el).toHaveAttribute("id", "region")
  })
})

describe("Stack / accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Stack gap="md" as="section">
        <h2>Heading</h2>
        <p>Paragraph</p>
      </Stack>
    )
    await checkA11y(container)
  })
})
