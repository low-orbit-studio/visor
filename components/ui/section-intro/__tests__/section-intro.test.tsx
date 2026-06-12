import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { SectionIntro } from "../section-intro"

describe("SectionIntro", () => {
  it("renders the heading", () => {
    render(<SectionIntro heading="Built for the world's best venues" />)
    expect(
      screen.getByText("Built for the world's best venues")
    ).toBeInTheDocument()
  })

  it("renders as a <header> element by default", () => {
    const { container } = render(<SectionIntro heading="Heading" />)
    const root = container.querySelector('[data-slot="section-intro"]')
    expect(root?.tagName).toBe("HEADER")
  })

  it("applies data-slot on root, heading, eyebrow, and lede", () => {
    const { container } = render(
      <SectionIntro
        eyebrow="On the map"
        heading="Heading"
        lede="Supporting copy."
      />
    )
    expect(
      container.querySelector('[data-slot="section-intro"]')
    ).not.toBeNull()
    expect(
      container.querySelector('[data-slot="section-intro-heading"]')
    ).not.toBeNull()
    expect(
      container.querySelector('[data-slot="section-intro-eyebrow"]')
    ).not.toBeNull()
    expect(
      container.querySelector('[data-slot="section-intro-lede"]')
    ).not.toBeNull()
  })

  it("renders eyebrow when provided", () => {
    render(<SectionIntro eyebrow="On the map" heading="Heading" />)
    expect(screen.getByText("On the map")).toBeInTheDocument()
  })

  it("omits the eyebrow slot when not provided", () => {
    const { container } = render(<SectionIntro heading="Heading" />)
    expect(
      container.querySelector('[data-slot="section-intro-eyebrow"]')
    ).toBeNull()
  })

  it("renders the lede when provided", () => {
    render(<SectionIntro heading="Heading" lede="One platform. Every door." />)
    expect(screen.getByText("One platform. Every door.")).toBeInTheDocument()
  })

  it("omits the lede slot when not provided", () => {
    const { container } = render(<SectionIntro heading="Heading" />)
    expect(
      container.querySelector('[data-slot="section-intro-lede"]')
    ).toBeNull()
  })

  it("defaults to left alignment (data-align=left)", () => {
    const { container } = render(<SectionIntro heading="Heading" />)
    const root = container.querySelector('[data-slot="section-intro"]')
    expect(root).toHaveAttribute("data-align", "left")
  })

  it("applies center alignment when align='center'", () => {
    const { container } = render(
      <SectionIntro heading="Heading" align="center" />
    )
    const root = container.querySelector('[data-slot="section-intro"]')
    expect(root).toHaveAttribute("data-align", "center")
  })

  it("renders the heading as an <h2> by default", () => {
    const { container } = render(<SectionIntro heading="Default level" />)
    const heading = container.querySelector('[data-slot="section-intro-heading"]')
    expect(heading?.tagName).toBe("H2")
  })

  it("respects headingAs='h1'", () => {
    const { container } = render(
      <SectionIntro heading="Hero heading" headingAs="h1" />
    )
    const heading = container.querySelector('[data-slot="section-intro-heading"]')
    expect(heading?.tagName).toBe("H1")
  })

  it("respects headingAs='h3'", () => {
    const { container } = render(
      <SectionIntro heading="Sub heading" headingAs="h3" />
    )
    const heading = container.querySelector('[data-slot="section-intro-heading"]')
    expect(heading?.tagName).toBe("H3")
  })

  it("respects the as prop for the root element", () => {
    const { container } = render(
      <SectionIntro as="div" heading="Heading" />
    )
    const root = container.querySelector('[data-slot="section-intro"]')
    expect(root?.tagName).toBe("DIV")
  })

  it("respects as='section'", () => {
    const { container } = render(
      <SectionIntro as="section" heading="Heading" />
    )
    const root = container.querySelector('[data-slot="section-intro"]')
    expect(root?.tagName).toBe("SECTION")
  })

  it("passes through HTML attributes", () => {
    const { container } = render(
      <SectionIntro
        heading="Heading"
        id="intro-network"
        aria-label="Network section intro"
        className="custom-class"
      />
    )
    const root = container.querySelector('[data-slot="section-intro"]')
    expect(root).toHaveAttribute("id", "intro-network")
    expect(root).toHaveAttribute("aria-label", "Network section intro")
    expect(root).toHaveClass("custom-class")
  })

  it("forwards ref to the root element", () => {
    const ref = { current: null as HTMLElement | null }
    render(<SectionIntro ref={ref} heading="Ref heading" />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("HEADER")
  })

  it("accepts ReactNode for heading and eyebrow", () => {
    render(
      <SectionIntro
        eyebrow={<span data-testid="custom-eyebrow">Eyebrow</span>}
        heading={<strong data-testid="custom-heading">Bold Heading</strong>}
      />
    )
    expect(screen.getByTestId("custom-eyebrow")).toBeInTheDocument()
    expect(screen.getByTestId("custom-heading")).toBeInTheDocument()
  })
})
