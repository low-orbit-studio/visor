import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Kbd } from "../kbd"

describe("Kbd", () => {
  it("renders a single <kbd> with children", () => {
    const { container } = render(<Kbd>K</Kbd>)
    const kbds = container.querySelectorAll("kbd")
    expect(kbds).toHaveLength(1)
    expect(kbds[0]).toHaveTextContent("K")
    expect(kbds[0]).toHaveAttribute("data-slot", "kbd")
  })

  it("renders multiple <kbd>s when keys provided", () => {
    const { container } = render(<Kbd keys={["⌘", "K"]} />)
    const kbds = container.querySelectorAll("kbd")
    expect(kbds).toHaveLength(2)
    expect(kbds[0]).toHaveTextContent("⌘")
    expect(kbds[1]).toHaveTextContent("K")
  })

  it("ignores children when keys is provided (keys wins)", () => {
    const { container } = render(<Kbd keys={["A", "B"]}>ignored</Kbd>)
    expect(container).not.toHaveTextContent("ignored")
    expect(container.querySelectorAll("kbd")).toHaveLength(2)
  })

  it("uses '+' as the default separator between keys", () => {
    const { container } = render(<Kbd keys={["⌘", "K"]} />)
    const sep = container.querySelector('[data-slot="kbd-separator"]')
    expect(sep).not.toBeNull()
    expect(sep).toHaveTextContent("+")
  })

  it("renders a custom separator", () => {
    const { container } = render(
      <Kbd keys={["G", "P"]} separator="then" />
    )
    const sep = container.querySelector('[data-slot="kbd-separator"]')
    expect(sep).toHaveTextContent("then")
  })

  it("renders one fewer separator than keys", () => {
    const { container } = render(<Kbd keys={["Ctrl", "Shift", "P"]} />)
    expect(container.querySelectorAll('[data-slot="kbd-separator"]')).toHaveLength(2)
    expect(container.querySelectorAll("kbd")).toHaveLength(3)
  })

  it("marks separators as aria-hidden", () => {
    const { container } = render(<Kbd keys={["⌘", "K"]} />)
    const seps = container.querySelectorAll('[data-slot="kbd-separator"]')
    seps.forEach((sep) => {
      expect(sep).toHaveAttribute("aria-hidden", "true")
    })
  })

  it("applies size variant classes (single)", () => {
    const { container, rerender } = render(<Kbd size="sm">K</Kbd>)
    let kbd = container.querySelector("kbd")
    expect(kbd?.className).toMatch(/sizeSm/)
    expect(kbd).toHaveAttribute("data-size", "sm")

    rerender(<Kbd size="lg">K</Kbd>)
    kbd = container.querySelector("kbd")
    expect(kbd?.className).toMatch(/sizeLg/)
    expect(kbd).toHaveAttribute("data-size", "lg")
  })

  it("applies size variant classes (multi-key, on each inner kbd)", () => {
    const { container } = render(<Kbd keys={["⌘", "K"]} size="lg" />)
    const kbds = container.querySelectorAll("kbd")
    kbds.forEach((kbd) => {
      expect(kbd.className).toMatch(/sizeLg/)
    })
  })

  it("applies variant classes (default and outline)", () => {
    const { container, rerender } = render(<Kbd variant="default">K</Kbd>)
    let kbd = container.querySelector("kbd")
    expect(kbd?.className).toMatch(/variantDefault/)
    expect(kbd).toHaveAttribute("data-variant", "default")

    rerender(<Kbd variant="outline">K</Kbd>)
    kbd = container.querySelector("kbd")
    expect(kbd?.className).toMatch(/variantOutline/)
    expect(kbd).toHaveAttribute("data-variant", "outline")
  })

  it("passes through HTML attributes and className (single)", () => {
    const { container } = render(
      <Kbd id="kbd-1" aria-label="Command K" className="custom">
        K
      </Kbd>
    )
    const kbd = container.querySelector("kbd")
    expect(kbd).toHaveAttribute("id", "kbd-1")
    expect(kbd).toHaveAttribute("aria-label", "Command K")
    expect(kbd).toHaveClass("custom")
  })

  it("passes through HTML attributes and className (multi-key wrapper)", () => {
    const { container } = render(
      <Kbd
        keys={["⌘", "K"]}
        id="group-1"
        aria-label="Command K"
        className="custom"
      />
    )
    const wrapper = container.querySelector('[data-slot="kbd-group"]')
    expect(wrapper).toHaveAttribute("id", "group-1")
    expect(wrapper).toHaveAttribute("aria-label", "Command K")
    expect(wrapper).toHaveClass("custom")
  })

  it("forwards ref to the single <kbd> element", () => {
    const ref = { current: null as HTMLElement | null }
    render(<Kbd ref={ref}>K</Kbd>)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("KBD")
  })

  it("renders nothing in keys mode when keys is empty array", () => {
    // Empty keys should fall through to single-kbd render
    const { container } = render(<Kbd keys={[]}>fallback</Kbd>)
    const kbds = container.querySelectorAll("kbd")
    expect(kbds).toHaveLength(1)
    expect(kbds[0]).toHaveTextContent("fallback")
  })
})
