import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { axe } from "../../../../test-utils/axe"
import {
  BeforeAfterCompare,
  markLine,
  type CapturePair,
  type CompareMark,
} from "../before-after-compare"
import { diffPixels } from "../../../../lib/capture-diff"

const desktop: CapturePair = {
  before: "/before.png",
  after: "/after.png",
  label: "Settings",
  viewport: { width: 1440, height: 900, dpr: 2 },
}
const phone: CapturePair = { ...desktop, label: "Sound", viewport: { width: 390, height: 844, dpr: 3 } }

// happy-dom lays nothing out: every mark surface is 720 × 900 rendered px at the origin.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const on = this.hasAttribute("data-mark-surface")
    const w = on ? 720 : 0
    const h = on ? 900 : 0
    return { width: w, height: h, top: 0, left: 0, right: w, bottom: h, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
  })
})
afterEach(() => vi.restoreAllMocks())

describe("BeforeAfterCompare", () => {
  it("opens Side by Side with a Before and an After tag on the images", () => {
    const { container } = render(<BeforeAfterCompare pair={desktop} />)
    expect(container.querySelector('[data-slot="before-after-compare"]')).toHaveAttribute("data-mode", "side")
    expect(screen.getByAltText("Settings, before")).toBeInTheDocument()
    expect(screen.getByAltText("Settings, after")).toBeInTheDocument()
    expect(screen.getByText("Before")).toBeInTheDocument()
    expect(screen.getByText("After")).toBeInTheDocument()
    expect(screen.getByText(/1440 × 900/)).toBeInTheDocument()
  })

  it("switches mode with the segmented control and with keys 1–4", () => {
    const onModeChange = vi.fn()
    const { container } = render(<BeforeAfterCompare pair={desktop} onModeChange={onModeChange} />)
    const root = container.querySelector<HTMLElement>('[data-slot="before-after-compare"]')!
    fireEvent.click(screen.getByRole("radio", { name: "Swipe" }))
    expect(root).toHaveAttribute("data-mode", "swipe")
    fireEvent.keyDown(root, { key: "3" })
    expect(root).toHaveAttribute("data-mode", "flip")
    fireEvent.keyDown(root, { key: "4" })
    expect(root).toHaveAttribute("data-mode", "diff")
    expect(onModeChange.mock.calls.map((c) => c[0])).toEqual(["swipe", "flip", "diff"])
  })

  it("Swipe exposes a slider the arrow keys move, clipping the after image", () => {
    const { container } = render(<BeforeAfterCompare pair={desktop} defaultMode="swipe" />)
    const slider = screen.getByRole("slider", { name: "Divider between before and after" })
    expect(slider).toHaveAttribute("aria-valuenow", "50")
    fireEvent.keyDown(slider, { key: "ArrowLeft" })
    expect(slider).toHaveAttribute("aria-valuenow", "45")
    fireEvent.keyDown(slider, { key: "ArrowRight", shiftKey: true })
    expect(slider).toHaveAttribute("aria-valuenow", "55")
    const after = screen.getByAltText("Settings, after").parentElement!
    expect(after.style.clipPath).toBe("inset(0 0 0 55%)")
    expect(container.querySelectorAll("[data-side]").length).toBeGreaterThanOrEqual(2)
  })

  it("Flip blinks between after and before on Space and on click, both kept mounted", () => {
    const { container } = render(<BeforeAfterCompare pair={desktop} defaultMode="flip" />)
    const root = container.querySelector<HTMLElement>('[data-slot="before-after-compare"]')!
    const flip = screen.getByRole("button", { name: "Showing after. Flip." })
    expect(screen.getByAltText("Settings, before").parentElement).toHaveAttribute("data-hidden")
    fireEvent.keyDown(root, { key: " " })
    expect(screen.getByRole("button", { name: "Showing before. Flip." })).toBe(flip)
    expect(screen.getByAltText("Settings, after").parentElement).toHaveAttribute("data-hidden")
    fireEvent.click(flip)
    expect(flip).toHaveAccessibleName("Showing after. Flip.")
  })

  it("Z toggles the loupe on both sides", () => {
    const { container } = render(<BeforeAfterCompare pair={desktop} />)
    const root = container.querySelector<HTMLElement>('[data-slot="before-after-compare"]')!
    const button = container.querySelector('[data-slot="before-after-compare-loupe"]')!
    expect(button).toHaveAttribute("aria-pressed", "false")
    fireEvent.keyDown(root, { key: "z" })
    expect(button).toHaveAttribute("aria-pressed", "true")
    // One lens per image, each reading its own capture.
    const lenses = container.querySelectorAll<HTMLElement>('[style*="--bac-zoom"]')
    expect(lenses).toHaveLength(2)
    expect(lenses[0].style.backgroundImage).toContain("/before.png")
    expect(lenses[1].style.backgroundImage).toContain("/after.png")
  })

  it("shares the pointer across both sides as stage variables", () => {
    const { container } = render(<BeforeAfterCompare pair={desktop} />)
    const stage = container.querySelector<HTMLElement>('[data-markable]')!
    fireEvent.pointerMove(container.querySelector("[data-mark-surface]")!, { clientX: 120, clientY: 80 })
    expect(stage).toHaveAttribute("data-pointer")
    expect(stage.style.getPropertyValue("--bac-x")).toBe("120px")
    expect(stage.style.getPropertyValue("--bac-y")).toBe("80px")
    fireEvent.pointerLeave(stage)
    expect(stage).not.toHaveAttribute("data-pointer")
  })

  it("a click drops a numbered pin at the same spot on both images; clicking a pin removes it", () => {
    const onMarksChange = vi.fn()
    const { container } = render(<BeforeAfterCompare pair={desktop} onMarksChange={onMarksChange} />)
    const surface = container.querySelector("[data-mark-surface]")!
    fireEvent.click(surface, { clientX: 360, clientY: 450 })
    const mark: CompareMark = { n: 1, x: 0.5, y: 0.5, px: { x: 720, y: 900 } }
    expect(onMarksChange).toHaveBeenLastCalledWith([mark])
    const pins = screen.getAllByRole("button", { name: "Mark 1 at x 720, y 900. Remove." })
    expect(pins).toHaveLength(2)
    expect(pins[0].style.left).toBe("50%")
    expect(markLine(mark, desktop.label)).toBe("1. Settings at x 720, y 900")
    fireEvent.click(pins[1])
    expect(onMarksChange).toHaveBeenLastCalledWith([])
    expect(screen.queryAllByRole("button", { name: /^Mark 1/ })).toHaveLength(0)
  })

  it("numbers marks past the highest one and only marks in Side by Side and Diff", () => {
    const onMarksChange = vi.fn()
    const { container } = render(
      <BeforeAfterCompare
        pair={desktop}
        defaultMarks={[{ n: 3, x: 0.1, y: 0.1, px: { x: 144, y: 180 } }]}
        onMarksChange={onMarksChange}
      />
    )
    fireEvent.click(container.querySelector("[data-mark-surface]")!, { clientX: 72, clientY: 90 })
    expect(onMarksChange.mock.lastCall?.[0].map((m: CompareMark) => m.n)).toEqual([3, 4])
    const root = container.querySelector<HTMLElement>('[data-slot="before-after-compare"]')!
    fireEvent.keyDown(root, { key: "2" })
    expect(container.querySelector("[data-mark-surface]")).toBeNull()
  })

  it("renders a phone capture in a bezel at its CSS width", () => {
    const { container } = render(<BeforeAfterCompare pair={phone} />)
    expect(container.querySelector('[data-slot="before-after-compare"]')).toHaveAttribute("data-phone")
    const frames = container.querySelectorAll<HTMLElement>('[style*="--bac-true-w"]')
    expect(frames).toHaveLength(2)
    expect(frames[0].style.getPropertyValue("--bac-true-w")).toBe("390px")
  })

  it("Diff shows a stat line while it compares", () => {
    render(<BeforeAfterCompare pair={desktop} defaultMode="diff" />)
    expect(screen.getByRole("status")).toHaveTextContent(/Comparing pixels|Couldn't compare/)
  })

  it("has no axe violations", async () => {
    const { container } = render(<BeforeAfterCompare pair={desktop} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe("diffPixels", () => {
  const W = 32
  const H = 32
  const solid = () => new Uint8ClampedArray(W * H * 4).fill(255)

  it("finds nothing in identical captures", () => {
    const r = diffPixels(solid(), solid(), W, H)
    expect(r.changed).toBe(0)
    expect(r.boxes).toEqual([])
  })

  it("boxes each changed region in 0–1 units, largest first, ignoring noise", () => {
    const a = solid()
    const b = solid()
    const paint = (x0: number, y0: number, w: number, h: number) => {
      for (let y = y0; y < y0 + h; y++)
        for (let x = x0; x < x0 + w; x++) {
          const p = (y * W + x) * 4
          b[p] = b[p + 1] = b[p + 2] = 0
        }
    }
    paint(0, 0, 4, 4) // a 16px region top-left
    paint(28, 28, 2, 2) // a 4px region bottom-right, far enough to stay separate
    b[(16 * W + 16) * 4] = 250 // below the noise threshold
    const r = diffPixels(a, b, W, H)
    expect(r.changed).toBe(20)
    expect(r.boxes).toHaveLength(2)
    for (const box of r.boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.w).toBeLessThanOrEqual(1)
      expect(box.y + box.h).toBeLessThanOrEqual(1)
    }
    expect(r.boxes[0].w * r.boxes[0].h).toBeGreaterThanOrEqual(r.boxes[1].w * r.boxes[1].h)
  })
})
