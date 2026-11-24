import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { useRef } from "react"
import { ScrollHint, useKeepGoing, type KeepGoing } from "../scroll-hint"

// jsdom lays nothing out, so the box and its fields get a fake geometry: a 300px box
// over 1000px of content, field n's top at n * 120 minus the scroll.
const BOX_H = 300
const CONTENT_H = 1000
let scrollTop = 0
let media = new Set<string>()
let latest: KeepGoing

function Harness({ pending, label }: { pending: string[]; label?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const kg = useKeepGoing(box, pending)
  latest = kg
  return (
    <div ref={box} data-testid="box">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
        <label key={n} data-field={`f${n}`}>
          Field {n}
          <input aria-label={`Field ${n}`} />
        </label>
      ))}
      <ScrollHint boxRef={box} keepGoing={kg} label={label} />
      <output data-testid="below">{String(kg.below)}</output>
    </div>
  )
}

function setup(pending: string[], label?: string) {
  const utils = render(<Harness pending={pending} label={label} />)
  const box = screen.getByTestId("box")
  Object.defineProperty(box, "clientHeight", { configurable: true, get: () => BOX_H })
  Object.defineProperty(box, "scrollHeight", { configurable: true, get: () => CONTENT_H })
  Object.defineProperty(box, "scrollTop", { configurable: true, get: () => scrollTop, set: (v) => (scrollTop = v) })
  const scrollBy = vi.fn()
  box.scrollBy = scrollBy as unknown as typeof box.scrollBy
  // Re-run the hook's check against the stubbed geometry.
  act(() => {
    fireEvent.scroll(box)
  })
  return { ...utils, box, scrollBy }
}

function scrollTo(box: HTMLElement, top: number) {
  scrollTop = top
  act(() => {
    fireEvent.scroll(box)
  })
}

const hint = (container: HTMLElement) => container.querySelector("[data-slot=scroll-hint]") as HTMLElement

beforeEach(() => {
  scrollTop = 0
  media = new Set(["(pointer: fine)"])
  window.matchMedia = ((q: string) => ({ matches: media.has(q), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
  Element.prototype.scrollBy = vi.fn() as unknown as typeof Element.prototype.scrollBy
  if (!globalThis.CSS?.escape) vi.stubGlobal("CSS", { escape: (s: string) => s })
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const field = this.getAttribute("data-field")
    if (field) {
      const top = Number(field.slice(1)) * 120 - scrollTop
      return { top, bottom: top + 100, left: 0, right: 300, width: 300, height: 100, x: 0, y: top, toJSON() {} } as DOMRect
    }
    return { top: 0, bottom: BOX_H, left: 0, right: 300, width: 300, height: BOX_H, x: 0, y: 0, toJSON() {} } as DOMRect
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("useKeepGoing", () => {
  it("turns more on while there is more below, and off at the end", () => {
    const { box, container } = setup([])
    expect(latest.more).toBe(true)
    expect(hint(container)).toHaveAttribute("data-show")
    scrollTo(box, CONTENT_H - BOX_H)
    expect(latest.more).toBe(false)
    expect(hint(container)).not.toHaveAttribute("data-show")
    scrollTo(box, 100)
    expect(hint(container)).toHaveAttribute("data-show")
  })

  it("counts the last 8px as the end", () => {
    const { box } = setup([])
    scrollTo(box, CONTENT_H - BOX_H - 7)
    expect(latest.more).toBe(false)
  })

  it("sets below only while a pending field sits below the fold", () => {
    // Field 1 (top 120, head clears 216 < fold 244) is in view; field 7 (top 840) is not.
    const first = setup(["f1"])
    expect(latest.below).toBe(false)
    first.unmount()
    const { box } = setup(["f7"])
    expect(latest.below).toBe(true)
    // Scrolled so f7's head clears the fold: in view, no longer below.
    scrollTo(box, 700)
    expect(latest.below).toBe(false)
  })

  it("go() scrolls the first pending field below the fold a fifth of the way down and focuses it", () => {
    const { scrollBy } = setup(["f1", "f6", "f7"])
    let moved = false
    act(() => {
      moved = latest.go()
    })
    expect(moved).toBe(true)
    // f6 is the first pending field below the fold: top 720, landing 300 * 0.2 = 60 down.
    expect(scrollBy).toHaveBeenCalledWith({ top: 720 - 60, behavior: "smooth" })
    expect(document.activeElement).toBe(screen.getByLabelText("Field 6"))
  })

  it("does not focus on a coarse pointer, where focus would throw up the keyboard", () => {
    media = new Set()
    const { scrollBy } = setup(["f7"])
    act(() => {
      latest.go()
    })
    expect(scrollBy).toHaveBeenCalled()
    expect(document.activeElement).not.toBe(screen.getByLabelText("Field 7"))
  })

  it("jumps without smoothing under reduced motion", () => {
    media.add("(prefers-reduced-motion: reduce)")
    const { scrollBy } = setup(["f7"])
    act(() => {
      latest.go()
    })
    expect(scrollBy).toHaveBeenCalledWith({ top: 840 - 60, behavior: "auto" })
  })

  it("go() returns false and scrolls nothing when nothing is pending", () => {
    const { scrollBy } = setup([])
    expect(latest.go()).toBe(false)
    expect(scrollBy).not.toHaveBeenCalled()
  })

  it("reads fields by another attribute", () => {
    function ById() {
      const box = useRef<HTMLDivElement>(null)
      latest = useKeepGoing(box, ["q"], "data-question")
      return (
        <div ref={box}>
          <div data-question="q" data-field="f7">
            <input aria-label="Q" />
          </div>
        </div>
      )
    }
    render(<ById />)
    expect(latest.go()).toBe(true)
  })
})

describe("ScrollHint", () => {
  it("pages the box down by 0.8 of its height when nothing is pending", () => {
    const { container, scrollBy } = setup([])
    fireEvent.click(hint(container).querySelector("button")!)
    expect(scrollBy).toHaveBeenCalledWith({ top: BOX_H * 0.8, behavior: "smooth" })
  })

  it("does what Keep Going does when a field is pending", () => {
    const { container, scrollBy } = setup(["f7"])
    fireEvent.click(hint(container).querySelector("button")!)
    expect(scrollBy).toHaveBeenCalledTimes(1)
    expect(scrollBy).toHaveBeenCalledWith({ top: 840 - 60, behavior: "smooth" })
  })

  it("renders More Below by default, and the label it is given", () => {
    const { container, unmount } = setup([])
    expect(hint(container)).toHaveTextContent("More Below")
    unmount()
    const again = setup([], "Keep scrolling")
    expect(hint(again.container)).toHaveTextContent("Keep scrolling")
  })

  it("is hidden from assistive tech and out of the tab order", () => {
    const { container } = setup([])
    expect(hint(container)).toHaveAttribute("aria-hidden", "true")
    expect(hint(container).querySelector("button")).toHaveAttribute("tabindex", "-1")
  })

  it("passes className and props through", () => {
    function WithClass() {
      const box = useRef<HTMLDivElement>(null)
      const kg = useKeepGoing(box, [])
      return (
        <div ref={box}>
          <ScrollHint boxRef={box} keepGoing={kg} className="mine" data-testid="hint" />
        </div>
      )
    }
    render(<WithClass />)
    expect(screen.getByTestId("hint")).toHaveClass("mine")
  })
})
