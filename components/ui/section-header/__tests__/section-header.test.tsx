import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { SectionHeader } from "../section-header"

describe("SectionHeader", () => {
  it("renders with just a title", () => {
    render(<SectionHeader title="Tonight's events" />)
    expect(screen.getByText("Tonight's events")).toBeInTheDocument()
  })

  it("renders as a <header> element by default", () => {
    const { container } = render(<SectionHeader title="Activity" />)
    const root = container.querySelector('[data-slot="section-header"]')
    expect(root?.tagName).toBe("HEADER")
  })

  it("applies data-slot on root, title, and meta", () => {
    const { container } = render(
      <SectionHeader title="Activity" meta="last hour" />
    )
    expect(
      container.querySelector('[data-slot="section-header"]')
    ).not.toBeNull()
    expect(
      container.querySelector('[data-slot="section-header-title"]')
    ).not.toBeNull()
    expect(
      container.querySelector('[data-slot="section-header-meta"]')
    ).not.toBeNull()
  })

  it("renders title and meta when both are provided", () => {
    render(<SectionHeader title="Tonight's events" meta="2 events" />)
    expect(screen.getByText("Tonight's events")).toBeInTheDocument()
    expect(screen.getByText("2 events")).toBeInTheDocument()
  })

  it("omits the meta slot when meta is not provided", () => {
    const { container } = render(<SectionHeader title="Top promoters · 30d" />)
    expect(
      container.querySelector('[data-slot="section-header-meta"]')
    ).toBeNull()
  })

  it("renders ReactNode children in title and meta", () => {
    render(
      <SectionHeader
        title={<strong>This week</strong>}
        meta={<em>updated 2m ago</em>}
      />
    )
    expect(screen.getByText("This week").tagName).toBe("STRONG")
    expect(screen.getByText("updated 2m ago").tagName).toBe("EM")
  })

  it("respects the `as` prop to change the root element", () => {
    const { container } = render(
      <SectionHeader as="div" title="Activity" />
    )
    const root = container.querySelector('[data-slot="section-header"]')
    expect(root?.tagName).toBe("DIV")
  })

  it("respects `as=\"section\"` for the root element", () => {
    const { container } = render(
      <SectionHeader as="section" title="Activity" />
    )
    const root = container.querySelector('[data-slot="section-header"]')
    expect(root?.tagName).toBe("SECTION")
  })

  it("passes through HTML attributes", () => {
    const { container } = render(
      <SectionHeader
        title="Activity"
        id="activity-section"
        aria-label="Activity section"
        className="custom-class"
      />
    )
    const root = container.querySelector('[data-slot="section-header"]')
    expect(root).toHaveAttribute("id", "activity-section")
    expect(root).toHaveAttribute("aria-label", "Activity section")
    expect(root).toHaveClass("custom-class")
  })

  it("forwards ref to the root element", () => {
    const ref = { current: null as HTMLElement | null }
    render(<SectionHeader ref={ref} title="Activity" />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("HEADER")
  })

  it("does not apply heading semantics by default", () => {
    // Title renders as <span>, so no implicit heading role exists.
    const { container } = render(<SectionHeader title="Activity" />)
    expect(container.querySelector("h1, h2, h3, h4, h5, h6")).toBeNull()
  })

  it("allows the caller to wrap their own heading element in the title slot", () => {
    render(<SectionHeader title={<h2>This week</h2>} />)
    const h2 = screen.getByRole("heading", { level: 2, name: /this week/i })
    expect(h2).toBeInTheDocument()
  })
})
