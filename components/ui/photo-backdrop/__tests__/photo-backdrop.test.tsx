import * as React from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { act, fireEvent, render } from "@testing-library/react"
import { afterEach, describe, it, expect, vi } from "vitest"
import { PhotoBackdrop, type PhotoBackdropSource } from "../photo-backdrop"
import { checkA11y } from "../../../../test-utils/a11y"

const css = readFileSync(join(__dirname, "../photo-backdrop.module.css"), "utf8")
const source = readFileSync(join(__dirname, "../photo-backdrop.tsx"), "utf8")

const BACKGROUNDS: Record<string, PhotoBackdropSource> = {
  a: { kind: "photo", src: "/a.webp" },
  b: { kind: "photo", src: "/b.webp", focal: [0.2, 0.8] },
  c: { kind: "photo", src: "/c.webp" },
  ink: { kind: "solid", color: "rgb(10, 20, 30)" },
}

const layers = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[data-slot="photo-backdrop-layer"]')]
const imgOf = (layer: HTMLElement) => layer.querySelector("img")!
const srcOf = (layer: HTMLElement) => imgOf(layer).getAttribute("src")
// jsdom has no AnimationEvent, so React listens for the webkit name there; send both.
const animationEnd = (el: Element) =>
  act(() => {
    el.dispatchEvent(new Event("animationend", { bubbles: true }))
    el.dispatchEvent(new Event("webkitAnimationEnd", { bubbles: true }))
  })

afterEach(() => {
  delete (HTMLImageElement.prototype as { decode?: unknown }).decode
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("PhotoBackdrop", () => {
  it("builds srcset with the srcSet prop and sends sizes 100vw", () => {
    const { container } = render(
      <PhotoBackdrop backgrounds={BACKGROUNDS} current="a" srcSet={(s) => s + " 1x"} />
    )
    const img = container.querySelector("img")!
    expect(img.getAttribute("srcset")).toBe("/a.webp 1x")
    expect(img.getAttribute("sizes")).toBe("100vw")
  })

  it("has no srcset without the prop, and no file naming of its own", () => {
    const { container } = render(<PhotoBackdrop backgrounds={BACKGROUNDS} current="a" />)
    const img = container.querySelector("img")!
    expect(img.getAttribute("src")).toBe("/a.webp")
    expect(img.hasAttribute("srcset")).toBe(false)
    expect(source).not.toMatch(/-1280|-2560/)
  })

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a missing key", "nope"],
  ])("renders nothing for %s", (_, current) => {
    const { container } = render(<PhotoBackdrop backgrounds={BACKGROUNDS} current={current} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders nothing once current goes to null", () => {
    const { container, rerender } = render(<PhotoBackdrop backgrounds={BACKGROUNDS} current="a" />)
    rerender(<PhotoBackdrop backgrounds={BACKGROUNDS} current={null} />)
    expect(container.firstChild).toBeNull()
  })

  it("shows the fallback until the first photo loads, then marks it ready", () => {
    const { container } = render(<PhotoBackdrop backgrounds={BACKGROUNDS} current="a" />)
    const root = container.querySelector('[data-slot="photo-backdrop"]')!
    expect(root).toHaveClass("root")
    const [layer] = layers(container)
    expect(layer).not.toHaveAttribute("data-ready")
    fireEvent.load(imgOf(layer!))
    expect(layer).toHaveAttribute("data-ready")
  })

  it("marks a photo that fails to load ready too, so the change still completes", () => {
    const { container } = render(<PhotoBackdrop backgrounds={BACKGROUNDS} current="a" />)
    fireEvent.error(container.querySelector("img")!)
    expect(layers(container)[0]).toHaveAttribute("data-ready")
  })

  it("draws the solid kind in its colour, ready at once", () => {
    const { container } = render(<PhotoBackdrop backgrounds={BACKGROUNDS} current="ink" />)
    const [layer] = layers(container)
    expect(layer).toHaveAttribute("data-ready")
    expect((layer!.firstChild as HTMLElement).style.background).toBe("rgb(10, 20, 30)")
  })

  it("crossfades: B sits on A until it loads, then A goes when B's fade ends", () => {
    const { container, rerender } = render(<PhotoBackdrop backgrounds={BACKGROUNDS} current="a" />)
    fireEvent.load(imgOf(layers(container)[0]!))
    rerender(<PhotoBackdrop backgrounds={BACKGROUNDS} current="b" />)

    let [under, top] = layers(container)
    expect(layers(container)).toHaveLength(2)
    expect(srcOf(under!)).toBe("/a.webp")
    expect(srcOf(top!)).toBe("/b.webp")
    expect(top).not.toHaveAttribute("data-ready")

    fireEvent.load(imgOf(top!))
    ;[under, top] = layers(container)
    expect(top).toHaveAttribute("data-ready")

    animationEnd(top!)
    expect(layers(container).map(srcOf)).toEqual(["/b.webp"])
  })

  it("never holds more than two layers through a quick run of changes", () => {
    const { container, rerender } = render(<PhotoBackdrop backgrounds={BACKGROUNDS} current="a" />)
    fireEvent.load(imgOf(layers(container)[0]!))
    rerender(<PhotoBackdrop backgrounds={BACKGROUNDS} current="b" />)
    expect(layers(container)).toHaveLength(2)
    rerender(<PhotoBackdrop backgrounds={BACKGROUNDS} current="c" />)
    expect(layers(container)).toHaveLength(2)
    // B never loaded, so C covers A (still on screen), not a blank.
    expect(layers(container).map(srcOf)).toEqual(["/a.webp", "/c.webp"])
  })

  it("covers the newest loaded layer when the top one has loaded", () => {
    const { container, rerender } = render(<PhotoBackdrop backgrounds={BACKGROUNDS} current="a" />)
    fireEvent.load(imgOf(layers(container)[0]!))
    rerender(<PhotoBackdrop backgrounds={BACKGROUNDS} current="b" />)
    fireEvent.load(imgOf(layers(container)[1]!))
    rerender(<PhotoBackdrop backgrounds={BACKGROUNDS} current="c" />)
    expect(layers(container).map(srcOf)).toEqual(["/b.webp", "/c.webp"])
  })

  it("drops a layer that never loaded rather than keep a blank under the new one", () => {
    const { container, rerender } = render(<PhotoBackdrop backgrounds={BACKGROUNDS} current="a" />)
    rerender(<PhotoBackdrop backgrounds={BACKGROUNDS} current="b" />)
    expect(layers(container).map(srcOf)).toEqual(["/b.webp"])
  })

  it("ignores animationend from anything but the top layer", () => {
    const { container, rerender } = render(<PhotoBackdrop backgrounds={BACKGROUNDS} current="a" />)
    fireEvent.load(imgOf(layers(container)[0]!))
    rerender(<PhotoBackdrop backgrounds={BACKGROUNDS} current="b" />)
    animationEnd(layers(container)[0]!)
    animationEnd(imgOf(layers(container)[1]!))
    expect(layers(container)).toHaveLength(2)
  })

  it("keeps the focal point in frame, centred by default", () => {
    const { container, rerender } = render(<PhotoBackdrop backgrounds={BACKGROUNDS} current="b" />)
    expect(container.querySelector("img")!.style.objectPosition).toBe("20% 80%")
    fireEvent.load(container.querySelector("img")!)
    rerender(<PhotoBackdrop backgrounds={BACKGROUNDS} current="a" />)
    expect(imgOf(layers(container)[1]!).style.objectPosition).toBe("50% 50%")
  })

  it("preloads upcoming photos only after the top photo decodes, one at a time, in order, at low priority", async () => {
    const requested: { src: string; srcset: string; sizes: string; fetchPriority: string }[] = []
    const pending: Array<() => void> = []
    class FakeImage {
      fetchPriority = ""
      sizes = ""
      srcset = ""
      set src(value: string) {
        requested.push({ src: value, srcset: this.srcset, sizes: this.sizes, fetchPriority: this.fetchPriority })
      }
      decode() {
        return new Promise<void>((r) => pending.push(r))
      }
    }
    vi.stubGlobal("Image", FakeImage)
    let shown!: () => void
    // jsdom has no decode(); the top photo's resolves when the test says it has decoded.
    Object.defineProperty(HTMLImageElement.prototype, "decode", {
      configurable: true,
      value: () => new Promise<void>((r) => (shown = r)),
    })

    const bgs: Record<string, PhotoBackdropSource> = {
      p1: { kind: "photo", src: "/p1.webp" },
      p2: { kind: "photo", src: "/p2.webp" },
      p3: { kind: "photo", src: "/p3.webp" },
      flat: { kind: "solid", color: "black" },
    }
    const srcSet = (s: string) => s + " 1x"
    const { rerender } = render(
      <PhotoBackdrop backgrounds={bgs} current="p1" upcoming={["p3", "flat", "p2"]} srcSet={srcSet} sizes="50vw" />
    )
    await act(async () => {})
    expect(requested).toEqual([])

    await act(async () => shown())
    expect(requested).toEqual([{ src: "/p3.webp", srcset: "/p3.webp 1x", sizes: "50vw", fetchPriority: "low" }])

    await act(async () => pending.shift()!())
    expect(requested.map((r) => r.src)).toEqual(["/p3.webp", "/p2.webp"])
    await act(async () => pending.shift()!())

    // A decoded photo is never requested twice.
    rerender(<PhotoBackdrop backgrounds={bgs} current="p1" upcoming={["p2", "p3"]} srcSet={srcSet} sizes="50vw" />)
    await act(async () => shown())
    expect(requested.map((r) => r.src)).toEqual(["/p3.webp", "/p2.webp"])
  })

  it("is a CSS fade that honours reduced motion without dropping the animation", () => {
    expect(css).toMatch(/@keyframes photo-backdrop-fade/)
    const reduced = css.slice(css.indexOf("prefers-reduced-motion: reduce"))
    expect(reduced).toMatch(/\.layer\[data-ready\][\s\S]*animation-duration: 1ms/)
    expect(reduced).not.toMatch(/animation: none/)
  })

  it("forwards className and ref", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<PhotoBackdrop backgrounds={BACKGROUNDS} current="a" className="extra" ref={ref} />)
    expect(ref.current).toHaveClass("extra")
  })

  it("is hidden from assistive tech, with empty alt on every photo, and has no axe violations", async () => {
    const { container, rerender } = render(<PhotoBackdrop backgrounds={BACKGROUNDS} current="a" />)
    fireEvent.load(container.querySelector("img")!)
    rerender(<PhotoBackdrop backgrounds={BACKGROUNDS} current="b" />)
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true")
    const imgs = [...container.querySelectorAll("img")]
    expect(imgs).toHaveLength(2)
    imgs.forEach((img) => expect(img).toHaveAttribute("alt", ""))
    await checkA11y(container)
  })
})
