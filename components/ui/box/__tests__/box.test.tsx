import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Box } from "../box"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Box", () => {
  it("renders as a div by default", () => {
    render(<Box data-testid="box">Hello</Box>)
    const el = screen.getByTestId("box")
    expect(el.tagName).toBe("DIV")
    expect(el).toHaveAttribute("data-slot", "box")
  })

  it("polymorphic via the `as` prop", () => {
    render(
      <Box as="section" data-testid="box">
        Hi
      </Box>
    )
    expect(screen.getByTestId("box").tagName).toBe("SECTION")
  })

  it("applies padding token to --box-p CSS variable", () => {
    const { getByTestId } = render(
      <Box padding="md" data-testid="box">
        x
      </Box>
    )
    const style = getByTestId("box").getAttribute("style") ?? ""
    expect(style).toContain("--box-p")
    expect(style).toContain("var(--spacing-4")
  })

  it("applies per-axis padding (paddingX/paddingY)", () => {
    const { getByTestId } = render(
      <Box paddingX="lg" paddingY="sm" data-testid="box">
        x
      </Box>
    )
    const style = getByTestId("box").getAttribute("style") ?? ""
    expect(style).toContain("--box-px")
    expect(style).toContain("--box-py")
    expect(style).toContain("var(--spacing-6")
    expect(style).toContain("var(--spacing-2")
  })

  it("applies edge padding (paddingTop, etc.)", () => {
    const { getByTestId } = render(
      <Box paddingTop="xl" paddingBottom="xs" data-testid="box">
        x
      </Box>
    )
    const style = getByTestId("box").getAttribute("style") ?? ""
    expect(style).toContain("--box-pt")
    expect(style).toContain("--box-pb")
  })

  it("applies margin tokens", () => {
    const { getByTestId } = render(
      <Box margin="md" marginX="lg" data-testid="box">
        x
      </Box>
    )
    const style = getByTestId("box").getAttribute("style") ?? ""
    expect(style).toContain("--box-m")
    expect(style).toContain("--box-mx")
  })

  it("applies bg as a --surface-* variable reference", () => {
    const { getByTestId } = render(
      <Box bg="card" data-testid="box">
        x
      </Box>
    )
    const style = getByTestId("box").getAttribute("style") ?? ""
    expect(style).toContain("--box-bg")
    expect(style).toContain("var(--surface-card)")
  })

  it("applies borderRadius token", () => {
    const { getByTestId } = render(
      <Box borderRadius="lg" data-testid="box">
        x
      </Box>
    )
    const style = getByTestId("box").getAttribute("style") ?? ""
    expect(style).toContain("--box-radius")
    expect(style).toContain("var(--radius-lg")
  })

  it("border=true wires --box-border-color", () => {
    const { getByTestId } = render(
      <Box border data-testid="box">
        x
      </Box>
    )
    const el = getByTestId("box")
    expect(el).toHaveAttribute("data-border", "true")
    const style = el.getAttribute("style") ?? ""
    expect(style).toContain("--box-border-color")
    expect(style).toContain("var(--border-default")
  })

  it("border=token uses --border-<token>", () => {
    const { getByTestId } = render(
      <Box border="error" data-testid="box">
        x
      </Box>
    )
    const style = getByTestId("box").getAttribute("style") ?? ""
    expect(style).toContain("var(--border-error)")
  })

  it("resolves responsive padding into per-breakpoint variables", () => {
    const { getByTestId } = render(
      <Box padding={{ base: "sm", md: "lg", xl: "2xl" }} data-testid="box">
        x
      </Box>
    )
    const style = getByTestId("box").getAttribute("style") ?? ""
    expect(style).toContain("--box-p:")
    expect(style).toContain("--box-p-md")
    expect(style).toContain("--box-p-xl")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLElement | null }
    render(<Box ref={ref}>x</Box>)
    expect(ref.current).toBeInstanceOf(HTMLElement)
  })

  it("passes through arbitrary HTML attributes", () => {
    render(
      <Box id="my-box" aria-label="region" data-testid="box">
        x
      </Box>
    )
    const el = screen.getByTestId("box")
    expect(el).toHaveAttribute("id", "my-box")
    expect(el).toHaveAttribute("aria-label", "region")
  })

  it("merges custom className and style", () => {
    const { getByTestId } = render(
      <Box className="custom" style={{ opacity: 0.5 }} data-testid="box">
        x
      </Box>
    )
    const el = getByTestId("box")
    expect(el).toHaveClass("custom")
    expect(el.getAttribute("style")).toContain("opacity")
  })
})

describe("Box / accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Box padding="md" bg="card" borderRadius="lg" as="section">
        <p>Accessible content</p>
      </Box>
    )
    await checkA11y(container)
  })
})
