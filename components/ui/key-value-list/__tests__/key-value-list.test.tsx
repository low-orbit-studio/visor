import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { KeyValueList } from "../key-value-list"

const items = [
  { label: "Plan", value: "Enterprise" },
  { label: "Members", value: "142", hint: "total" },
]

describe("KeyValueList", () => {
  it("renders each label and value", () => {
    render(<KeyValueList items={items} />)
    expect(screen.getByText("Plan")).toBeInTheDocument()
    expect(screen.getByText("Enterprise")).toBeInTheDocument()
    expect(screen.getByText("Members")).toBeInTheDocument()
    expect(screen.getByText("142")).toBeInTheDocument()
  })

  it("renders semantic dl/dt/dd by default", () => {
    const { container } = render(<KeyValueList items={items} />)
    expect(container.querySelector("dl")).not.toBeNull()
    expect(container.querySelectorAll("dt")).toHaveLength(2)
    expect(container.querySelectorAll("dd")).toHaveLength(2)
  })

  it('opts out of dl semantics with as="div"', () => {
    const { container } = render(<KeyValueList as="div" items={items} />)
    expect(container.querySelector("dl")).toBeNull()
    expect(container.querySelector("dt")).toBeNull()
    expect(container.querySelector("dd")).toBeNull()
    expect(
      container.querySelector('[data-slot="key-value-list"]')?.tagName
    ).toBe("DIV")
  })

  it("applies data-slot to list, item, label, and value", () => {
    const { container } = render(<KeyValueList items={items} />)
    expect(
      container.querySelector('[data-slot="key-value-list"]')
    ).not.toBeNull()
    expect(
      container.querySelectorAll('[data-slot="key-value-item"]')
    ).toHaveLength(2)
    expect(
      container.querySelectorAll('[data-slot="key-value-label"]')
    ).toHaveLength(2)
    expect(
      container.querySelectorAll('[data-slot="key-value-value"]')
    ).toHaveLength(2)
  })

  it("renders the hint when provided and omits it otherwise", () => {
    const { container } = render(<KeyValueList items={items} />)
    const hints = container.querySelectorAll('[data-slot="key-value-hint"]')
    expect(hints).toHaveLength(1)
    expect(hints[0]).toHaveTextContent("total")
  })

  it("renders ReactNode values", () => {
    render(
      <KeyValueList items={[{ label: "Plan", value: <strong>Enterprise</strong> }]} />
    )
    expect(screen.getByText("Enterprise").tagName).toBe("STRONG")
  })

  it("reflects columns, orientation, and density as data attributes", () => {
    const { container } = render(
      <KeyValueList
        items={items}
        columns={4}
        orientation="horizontal"
        density="compact"
      />
    )
    const root = container.querySelector('[data-slot="key-value-list"]')!
    expect(root).toHaveAttribute("data-columns", "4")
    expect(root).toHaveAttribute("data-orientation", "horizontal")
    expect(root).toHaveAttribute("data-density", "compact")
  })

  it("defaults to columns=1, stacked, editorial", () => {
    const { container } = render(<KeyValueList items={items} />)
    const root = container.querySelector('[data-slot="key-value-list"]')!
    expect(root).toHaveAttribute("data-columns", "1")
    expect(root).toHaveAttribute("data-orientation", "stacked")
    expect(root).toHaveAttribute("data-density", "editorial")
  })

  it("forwards ref to the root element", () => {
    const ref = { current: null as HTMLElement | null }
    render(<KeyValueList ref={ref} items={items} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("DL")
  })

  it("passes through HTML attributes and merges className", () => {
    const { container } = render(
      <KeyValueList
        items={items}
        id="org-facts"
        aria-label="Organization facts"
        className="custom"
      />
    )
    const root = container.querySelector('[data-slot="key-value-list"]')!
    expect(root).toHaveAttribute("id", "org-facts")
    expect(root).toHaveAttribute("aria-label", "Organization facts")
    expect(root).toHaveClass("custom")
  })

  it("renders only the root for an empty items array", () => {
    const { container } = render(<KeyValueList items={[]} />)
    expect(
      container.querySelector('[data-slot="key-value-list"]')
    ).not.toBeNull()
    expect(
      container.querySelectorAll('[data-slot="key-value-item"]')
    ).toHaveLength(0)
  })
})
