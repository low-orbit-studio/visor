import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Container } from "../container"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Container", () => {
  it("renders as a div by default", () => {
    render(
      <Container data-testid="container">
        <p>hi</p>
      </Container>
    )
    const el = screen.getByTestId("container")
    expect(el.tagName).toBe("DIV")
    expect(el).toHaveAttribute("data-slot", "container")
  })

  it("defaults: size=lg padding=md", () => {
    const { getByTestId } = render(
      <Container data-testid="container">x</Container>
    )
    const el = getByTestId("container")
    expect(el).toHaveAttribute("data-size", "lg")
    expect(el.className).toMatch(/sizeLg/i)
    const style = el.getAttribute("style") ?? ""
    expect(style).toContain("--container-padding")
    expect(style).toContain("var(--spacing-4")
  })

  it("renders every size variant", () => {
    const sizes = ["sm", "md", "lg", "xl", "full"] as const
    sizes.forEach((size) => {
      const { unmount, getByTestId } = render(
        <Container size={size} data-testid="container">
          x
        </Container>
      )
      expect(getByTestId("container")).toHaveAttribute("data-size", size)
      unmount()
    })
  })

  it("padding token writes the --container-padding variable", () => {
    const { getByTestId } = render(
      <Container padding="lg" data-testid="container">
        x
      </Container>
    )
    const style = getByTestId("container").getAttribute("style") ?? ""
    expect(style).toContain("var(--spacing-6")
  })

  it("padding='none' yields 0", () => {
    const { getByTestId } = render(
      <Container padding="none" data-testid="container">
        x
      </Container>
    )
    const style = getByTestId("container").getAttribute("style") ?? ""
    expect(style).toContain("--container-padding: 0")
  })

  it("polymorphic via the `as` prop", () => {
    render(
      <Container as="main" data-testid="container">
        x
      </Container>
    )
    expect(screen.getByTestId("container").tagName).toBe("MAIN")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLElement | null }
    render(<Container ref={ref}>x</Container>)
    expect(ref.current).toBeInstanceOf(HTMLElement)
  })

  it("merges custom className and passes through HTML attrs", () => {
    render(
      <Container className="custom" id="page" data-testid="container">
        x
      </Container>
    )
    const el = screen.getByTestId("container")
    expect(el).toHaveClass("custom")
    expect(el).toHaveAttribute("id", "page")
  })
})

describe("Container / accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Container as="main">
        <h1>Page</h1>
        <p>Content</p>
      </Container>
    )
    await checkA11y(container)
  })
})
