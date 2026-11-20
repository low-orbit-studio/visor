import * as React from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { act, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { PhotoPicker, type PhotoPickerPhoto } from "../photo-picker"
import { checkA11y } from "../../../../test-utils/a11y"

const css = readFileSync(join(__dirname, "../photo-picker.module.css"), "utf8")

const PHOTOS: PhotoPickerPhoto[] = [
  { key: "dusk", thumb: "/dusk.webp", label: "Dusk at the Stage" },
  { key: "camp", thumb: "/camp.webp" },
  { key: "pond", thumb: "/pond.webp" },
]

const frame = () => act(() => new Promise<void>((r) => requestAnimationFrame(() => r())))

describe("PhotoPicker", () => {
  it("renders one pressed-state button per photo, each named", () => {
    render(<PhotoPicker photos={PHOTOS} aria-label="Pick Your Background" />)
    expect(screen.getByRole("group", { name: "Pick Your Background" })).toBeInTheDocument()
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual([
      "Dusk at the Stage",
      "Photo 2",
      "Photo 3",
    ])
  })

  it("marks only the chosen photo pressed", () => {
    render(<PhotoPicker photos={PHOTOS} value="camp" />)
    expect(screen.getByRole("button", { name: "Photo 2" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1)
  })

  it("has nothing pressed without a value", () => {
    render(<PhotoPicker photos={PHOTOS} />)
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0)
  })

  it("reports the pressed photo's key", async () => {
    const onValueChange = vi.fn()
    render(<PhotoPicker photos={PHOTOS} value="dusk" onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole("button", { name: "Photo 3" }))
    expect(onValueChange).toHaveBeenCalledWith("pond")
  })

  it("holds the thumbnails back until load, then keeps them", () => {
    const { container, rerender } = render(<PhotoPicker photos={PHOTOS} load={false} />)
    const srcs = () => [...container.querySelectorAll("img")].map((img) => img.getAttribute("src"))
    expect(srcs()).toEqual([null, null, null])
    rerender(<PhotoPicker photos={PHOTOS} load />)
    expect(srcs()).toEqual(["/dusk.webp", "/camp.webp", "/pond.webp"])
    rerender(<PhotoPicker photos={PHOTOS} load={false} />)
    expect(srcs()).toEqual(["/dusk.webp", "/camp.webp", "/pond.webp"])
  })

  it("plays the draw wave on mount", async () => {
    render(<PhotoPicker photos={PHOTOS} />)
    await frame()
    screen.getAllByRole("button").forEach((b) => expect(b).toHaveClass("drawing"))
  })

  it("replays the wave when play changes, but not when it is false", async () => {
    const { rerender } = render(<PhotoPicker photos={PHOTOS} play={false} />)
    await frame()
    const buttons = screen.getAllByRole("button")
    expect(buttons.some((b) => b.classList.contains("drawing"))).toBe(false)

    rerender(<PhotoPicker photos={PHOTOS} play />)
    await frame()
    buttons.forEach((b) => {
      expect(b).toHaveClass("drawing")
      expect(b.style.getPropertyValue("--draw-i")).not.toBe("")
    })

    // Landing clears the class, so nothing is left behind.
    act(() => buttons[0].dispatchEvent(new Event("animationend", { bubbles: true })))
    expect(buttons[0]).not.toHaveClass("drawing")
  })

  it("forwards className and ref", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<PhotoPicker photos={PHOTOS} className="extra" ref={ref} />)
    expect(ref.current).toHaveClass("extra")
  })

  it("carries Backstage's thumbnail values and honours reduced motion", () => {
    expect(css).toContain("aspect-ratio: 4 / 3")
    expect(css).toContain("scale(1.08)")
    expect(css).toContain("var(--photo-picker-columns, 5)")
    expect(css).toContain("var(--photo-picker-columns-narrow, 3)")
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation: none/)
  })

  it("has no axe violations", async () => {
    const { container } = render(<PhotoPicker photos={PHOTOS} value="dusk" aria-label="Pick Your Background" />)
    await checkA11y(container)
  })
})
