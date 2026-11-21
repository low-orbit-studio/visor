import * as React from "react"
import { render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { AnimatedTitle } from "../animated-title"

const words = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-slot="animated-title-word"]'))

describe("AnimatedTitle", () => {
  it("is one heading named by the whole title, with the words aria-hidden", () => {
    const { container } = render(<AnimatedTitle text="Tell us about your weekend" />)
    expect(screen.getAllByRole("heading", { name: "Tell us about your weekend" })).toHaveLength(1)
    const wrapper = container.querySelector('[data-slot="animated-title-words"]')!
    expect(wrapper.getAttribute("aria-hidden")).toBe("true")
    expect(words(container).map((w) => w.textContent)).toEqual(["Tell", "us", "about", "your", "weekend"])
  })

  it("numbers each word with --i from 0", () => {
    const { container } = render(<AnimatedTitle text="Friday night at the lake" />)
    expect(words(container).map((w) => w.style.getPropertyValue("--i"))).toEqual(["0", "1", "2", "3", "4"])
  })

  it("keeps the spaces between words and adds none after a single word", () => {
    const many = render(<AnimatedTitle text="Edit your arrival" />)
    expect(many.container.querySelector('[data-slot="animated-title-words"]')!.textContent).toBe("Edit your arrival")
    const one = render(<AnimatedTitle text="Saturday" />)
    expect(one.container.querySelector('[data-slot="animated-title-words"]')!.textContent).toBe("Saturday")
  })

  it("renders an h2 by default and the element as asks for", () => {
    const { container, rerender } = render(<AnimatedTitle text="Hello" />)
    expect(container.firstElementChild!.tagName).toBe("H2")
    rerender(<AnimatedTitle as="h1" text="Hello" />)
    expect(container.firstElementChild!.tagName).toBe("H1")
    rerender(<AnimatedTitle as="span" text="Hello" />)
    expect(container.firstElementChild!.tagName).toBe("SPAN")
  })

  it("defaults to blur and takes each animation as a class and data-animation", () => {
    const { container, rerender } = render(<AnimatedTitle text="Hello there" />)
    const root = () => container.firstElementChild as HTMLElement
    expect(root().dataset.animation).toBe("blur")
    const classes = new Set<string>()
    for (const animation of ["rise", "blur", "weight"] as const) {
      rerender(<AnimatedTitle text="Hello there" animation={animation} />)
      expect(root().dataset.animation).toBe(animation)
      classes.add(root().className)
    }
    expect(classes.size).toBe(3)
  })

  it("masks each word for rise only", () => {
    const rise = render(<AnimatedTitle text="Hello there" animation="rise" />)
    const blur = render(<AnimatedTitle text="Hello there" animation="blur" />)
    const outer = (c: HTMLElement) => words(c).map((w) => w.parentElement!.className)
    expect(new Set(outer(rise.container)).size).toBe(1)
    expect(outer(rise.container)[0]).not.toBe(outer(blur.container)[0])
  })

  it("calls format once per word and renders what it returns", () => {
    const format = vi.fn((word: string) => <em>{word.replace(/-/g, "–")}</em>)
    const { container } = render(<AnimatedTitle text="Fri 6-9pm" format={format} />)
    expect(format.mock.calls.map((c) => c[0])).toEqual(["Fri", "6-9pm"])
    expect(words(container).map((w) => w.querySelector("em")?.textContent)).toEqual(["Fri", "6–9pm"])
    // Screen readers still get the plain text.
    expect(screen.getByRole("heading", { name: "Fri 6-9pm" })).toBeTruthy()
  })

  it("holds with play={false} and plays by default", () => {
    const { container, rerender } = render(<AnimatedTitle text="Hello" />)
    const root = () => container.firstElementChild as HTMLElement
    expect(root().hasAttribute("data-play")).toBe(false)
    rerender(<AnimatedTitle text="Hello" play={false} />)
    expect(root().dataset.play).toBe("false")
  })

  it("sets --animated-title-delay from delay, and leaves it unset without one", () => {
    const { container, rerender } = render(<AnimatedTitle text="Hello" />)
    const root = () => container.firstElementChild as HTMLElement
    expect(root().style.getPropertyValue("--animated-title-delay")).toBe("")
    rerender(<AnimatedTitle text="Hello" delay={120} style={{ color: "red" }} />)
    expect(root().style.getPropertyValue("--animated-title-delay")).toBe("120ms")
    expect(root().style.color).toBe("red")
  })

  it("forwards ref, className and HTML props to the element", () => {
    const ref = React.createRef<HTMLElement>()
    render(<AnimatedTitle ref={ref} text="Hello" id="t" tabIndex={-1} className="extra" data-testid="title" />)
    const el = screen.getByTestId("title")
    expect(ref.current).toBe(el)
    expect(el.id).toBe("t")
    expect(el.tabIndex).toBe(-1)
    expect(el.classList.contains("extra")).toBe(true)
    expect(el.dataset.slot).toBe("animated-title")
  })

  it("renders on the server with every word in the markup", () => {
    const html = renderToString(<AnimatedTitle text="Tell us about your weekend" />)
    expect(html).toContain("Tell us about your weekend")
    expect(html.match(/data-slot="animated-title-word"/g)).toHaveLength(5)
  })
})
