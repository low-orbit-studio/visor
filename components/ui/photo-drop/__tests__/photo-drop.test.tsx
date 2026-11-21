import * as React from "react"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { fireEvent, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, it, expect, vi, beforeAll } from "vitest"
import { FilePdf } from "@phosphor-icons/react"
import { PhotoDrop, PHOTO_DROP_CURVE, squircle, type PhotoDropProps } from "../photo-drop"
import { checkA11y } from "../../../../test-utils/a11y"

const ROOT = join(__dirname, "../../../..")
const css = readFileSync(join(__dirname, "../photo-drop.module.css"), "utf8")
const tsx = readFileSync(join(__dirname, "../photo-drop.tsx"), "utf8")

beforeAll(() => {
  // jsdom has no object URLs.
  URL.createObjectURL = vi.fn(() => "blob:preview")
})

const PHOTO = "/face.webp"
const fileMode = (over: Partial<NonNullable<PhotoDropProps["file"]>> = {}) => ({
  icon: <FilePdf data-testid="file-icon" />,
  accept: "application/pdf",
  onFile: vi.fn(),
  onClear: vi.fn(),
  ...over,
})

/** The tile, with a labelled input and buttons on either side for the keyboard walks. */
function Tile(props: Partial<PhotoDropProps>) {
  return (
    <>
      <button type="button">Before</button>
      <label htmlFor="photo">Your Photo</label>
      <PhotoDrop id="photo" src="" {...props} />
      <button type="button">After</button>
    </>
  )
}

const zone = (c: HTMLElement) => c.querySelector<HTMLElement>(".zone")!
const input = (c: HTMLElement) => c.querySelector<HTMLInputElement>("input[type=file]")

/** The seven states, as the docs and the render fixtures show them. */
const STATES: Record<string, Partial<PhotoDropProps>> = {
  idle: {},
  filled: { src: PHOTO, alt: "Your photo" },
  uploading: { src: PHOTO, alt: "Your photo", progress: 0.4 },
  failed: { src: PHOTO, alt: "Your photo", failed: true, onRetry: () => {} },
  locked: { src: PHOTO, alt: "Your photo", locked: true, lockedReason: "Check-in has started." },
  readOnly: { src: PHOTO, alt: "Your photo", readOnly: true },
  file: { src: "insurance.pdf", file: fileMode() },
}

describe("PhotoDrop states (A1)", () => {
  it("idle: a + icon, the edge path and an image input", () => {
    const { container } = render(<Tile />)
    expect(container.querySelector("[data-slot=photo-drop-plus]")).toBeInTheDocument()
    expect(container.querySelector(".ants")?.getAttribute("d")).toMatch(/^M.*Z$/)
    expect(input(container)).toHaveAttribute("accept", "image/*")
    expect(screen.getByText("Choose a photo")).toBeInTheDocument()
    expect(screen.getByText("or drop it here")).toBeInTheDocument()
  })

  it("dragging: dragEnter sets data-drag; dragLeave and drop clear it", () => {
    const { container } = render(<Tile />)
    fireEvent.dragEnter(zone(container))
    expect(zone(container)).toHaveAttribute("data-drag")
    fireEvent.dragLeave(zone(container))
    expect(zone(container)).not.toHaveAttribute("data-drag")
    fireEvent.dragEnter(zone(container))
    fireEvent.drop(zone(container))
    expect(zone(container)).not.toHaveAttribute("data-drag")
  })

  it("filled: the photo, the camera badge and the change hint", () => {
    const { container } = render(<Tile {...STATES.filled} />)
    expect(zone(container)).toHaveAttribute("data-filled")
    expect(screen.getByRole("img", { name: "Your photo" })).toHaveAttribute("src", PHOTO)
    expect(container.querySelector(".change")).toBeInTheDocument()
    expect(screen.getByText("Change photo")).toBeInTheDocument()
    expect(screen.getByText("Tap it, or drop a new one on it")).toBeInTheDocument()
  })

  it("uploading: a progressbar at 40, a ring and no file input", () => {
    const { container } = render(<Tile {...STATES.uploading} />)
    const bar = screen.getByRole("progressbar", { name: "Uploading" })
    expect(bar).toHaveAttribute("aria-valuenow", "40")
    expect(bar).toHaveAttribute("data-status", "uploading")
    expect(input(container)).toBeNull()
    const ring = container.querySelector<SVGPathElement>(".ring")!
    expect(ring.getAttribute("pathLength")).toBe("100")
    expect(ring.style.strokeDashoffset).toBe("60")
    expect(screen.getByRole("status")).toHaveTextContent("Uploading, 40%. Keep this page open.")
    expect(container.querySelector(".status")).toHaveTextContent("40%")
  })

  it("uploading with unknown progress: a sweeping ring and no value", () => {
    const { container } = render(<Tile src={PHOTO} progress="indeterminate" />)
    const bar = screen.getByRole("progressbar")
    expect(bar).not.toHaveAttribute("aria-valuenow")
    expect(container.querySelector(".ring")).toHaveAttribute("data-indeterminate")
    expect(container.querySelector(".status")).toBeNull()
    expect(screen.getByRole("status")).toHaveTextContent("Uploading. Keep this page open.")
  })

  it("clamps progress to 0..100", () => {
    const { rerender } = render(<Tile progress={1.7} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")
    rerender(<Tile progress={-1} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0")
  })

  it("failed: data-status, a status message and Try Again", async () => {
    const onRetry = vi.fn()
    const { container } = render(<Tile {...STATES.failed} onRetry={onRetry} />)
    expect(zone(container)).toHaveAttribute("data-status", "failed")
    expect(screen.getByRole("status")).toHaveTextContent("Check your connection, then try again.")
    expect(screen.getByText("Your photo didn't upload")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Try Again" }))
    expect(onRetry).toHaveBeenCalledOnce()
    // A new pick still works while it is failed.
    expect(input(container)).not.toBeNull()
  })

  it("failed wins over progress", () => {
    const { container } = render(<Tile src={PHOTO} progress={0.5} failed />)
    expect(screen.queryByRole("progressbar")).toBeNull()
    expect(zone(container)).toHaveAttribute("data-status", "failed")
  })

  it("locked: no file input, a lock glyph, Locked and the reason", () => {
    const { container } = render(<Tile {...STATES.locked} />)
    expect(input(container)).toBeNull()
    expect(container.querySelector("[data-slot=photo-drop-lock] svg")).toBeInTheDocument()
    expect(container.querySelector(".change")).toBeNull()
    expect(zone(container)).toHaveAttribute("data-locked")
    expect(screen.getByText("Locked")).toBeInTheDocument()
    expect(screen.getByText("Check-in has started.")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Your photo" })).toBeInTheDocument()
  })

  it("read-only: no input, the photo named by alt, no hint", () => {
    const { container } = render(<Tile {...STATES.readOnly} />)
    expect(input(container)).toBeNull()
    expect(screen.getByRole("img", { name: "Your photo" })).toBeInTheDocument()
    expect(screen.queryByText(/Tap it/)).toBeNull()
    expect(container.querySelector(".hint")).toBeNull()
    expect(container.querySelector(".change")).toBeNull()
    expect(zone(container)).toHaveAttribute("data-readonly")
  })

  it("read-only with nothing picked: an empty quiet tile", () => {
    const { container } = render(<Tile readOnly />)
    expect(container.querySelector("[data-slot=photo-drop-plus]")).toBeNull()
    expect(input(container)).toBeNull()
  })

  it("file: the icon, the file name, and Remove calls onClear", async () => {
    const file = fileMode()
    const { container } = render(<Tile src="insurance.pdf" file={file} />)
    expect(screen.getByTestId("file-icon")).toBeInTheDocument()
    expect(screen.getByText("insurance.pdf")).toBeInTheDocument()
    expect(input(container)).toHaveAttribute("accept", "application/pdf")
    await userEvent.click(screen.getByRole("button", { name: "Remove" }))
    expect(file.onClear).toHaveBeenCalledOnce()
  })

  it("file: empty, it asks for one; read-only and locked show the name", () => {
    const { rerender } = render(<Tile file={fileMode()} />)
    expect(screen.getByText("Choose a file")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull()
    rerender(<Tile src="insurance.pdf" file={fileMode()} readOnly />)
    expect(screen.getByText("insurance.pdf")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull()
    rerender(<Tile src="insurance.pdf" file={fileMode()} locked />)
    expect(screen.getByText("Locked")).toBeInTheDocument()
    expect(screen.getByText("insurance.pdf")).toBeInTheDocument()
  })

  it("file: uploading and failed lead with the file name", () => {
    const { rerender } = render(<Tile src="insurance.pdf" file={fileMode()} progress={0.2} />)
    expect(screen.getByText("insurance.pdf")).toBeInTheDocument()
    rerender(<Tile src="insurance.pdf" file={fileMode()} failed />)
    expect(screen.getByRole("status")).toHaveTextContent("It didn't upload. Check your connection, then try again.")
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull()
  })

  it("forwards className, ref and the rest of the props to the row", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<PhotoDrop id="p" src="" className="extra" ref={ref} data-testid="row" />)
    expect(ref.current).toHaveClass("extra")
    expect(ref.current).toHaveAttribute("data-slot", "photo-drop")
    expect(screen.getByTestId("row")).toBe(ref.current)
  })
})

describe("PhotoDrop size (A2)", () => {
  it("size is a prop: the zone, the viewBox and the edge follow it", () => {
    const { container } = render(<Tile size={96} />)
    expect(zone(container).style.width).toBe("96px")
    expect(zone(container).style.height).toBe("96px")
    expect(container.querySelector("svg.edge")).toHaveAttribute("viewBox", "0 0 96 96")
    expect(container.querySelector(".ants")).toHaveAttribute("d", squircle(96, PHOTO_DROP_CURVE, 0.75))
    expect(zone(container).style.getPropertyValue("--clip")).toBe(`path("${squircle(96, PHOTO_DROP_CURVE)}")`)
  })

  it("defaults to 220, and 128 in file mode", () => {
    const { container, rerender } = render(<Tile />)
    expect(zone(container).style.width).toBe("220px")
    rerender(<Tile file={fileMode()} />)
    expect(zone(container).style.width).toBe("128px")
  })

  describe("squircle()", () => {
    const points = (d: string) =>
      d.slice(1, -1).split("L").map((p) => p.split(" ").map(Number) as [number, number])

    it("is a closed path", () => {
      const d = squircle(120, 5, 2)
      expect(d.startsWith("M")).toBe(true)
      expect(d.endsWith("Z")).toBe(true)
    })

    it("keeps every point inside [inset, size - inset]", () => {
      for (const [x, y] of points(squircle(120, 5, 2))) {
        expect(x).toBeGreaterThanOrEqual(2)
        expect(x).toBeLessThanOrEqual(118)
        expect(y).toBeGreaterThanOrEqual(2)
        expect(y).toBeLessThanOrEqual(118)
      }
    })

    it("n = 2 is a circle: every point at r from the centre", () => {
      for (const [x, y] of points(squircle(100, 2, 10))) {
        expect(Math.hypot(x - 50, y - 50)).toBeCloseTo(40, 1)
      }
    })
  })
})

describe("PhotoDrop keyboard (A3)", () => {
  it("Tab focuses the file input; a pick calls onPick with the URL and the same File", async () => {
    const onPick = vi.fn()
    const { container } = render(<Tile onPick={onPick} />)
    await userEvent.click(screen.getByRole("button", { name: "Before" }))
    await userEvent.tab()
    expect(input(container)).toHaveFocus()
    const picked = new File(["x"], "me.png", { type: "image/png" })
    await userEvent.upload(input(container)!, picked)
    expect(onPick).toHaveBeenCalledWith("blob:preview", picked)
  })

  it("file mode: a pick calls file.onFile", async () => {
    const file = fileMode()
    const { container } = render(<Tile file={file} />)
    const picked = new File(["x"], "insurance.pdf", { type: "application/pdf" })
    await userEvent.upload(input(container)!, picked)
    expect(file.onFile).toHaveBeenCalledWith(picked)
  })

  it("an empty pick calls nothing", () => {
    const onPick = vi.fn()
    const { container } = render(<Tile onPick={onPick} />)
    fireEvent.change(input(container)!, { target: { files: [] } })
    expect(onPick).not.toHaveBeenCalled()
  })

  it("failed: Tab reaches Try Again after the input, and Enter retries", async () => {
    const onRetry = vi.fn()
    const { container } = render(<Tile {...STATES.failed} onRetry={onRetry} />)
    await userEvent.click(screen.getByRole("button", { name: "Before" }))
    await userEvent.tab()
    expect(input(container)).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole("button", { name: "Try Again" })).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("file mode with a value: Tab reaches Remove, and Enter clears", async () => {
    const file = fileMode()
    const { container } = render(<Tile src="insurance.pdf" file={file} />)
    await userEvent.click(screen.getByRole("button", { name: "Before" }))
    await userEvent.tab()
    expect(input(container)).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole("button", { name: "Remove" })).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    expect(file.onClear).toHaveBeenCalledOnce()
  })

  it.each(["uploading", "locked", "readOnly"])("%s: nothing inside takes focus", async (state) => {
    render(<Tile {...STATES[state]} />)
    await userEvent.click(screen.getByRole("button", { name: "Before" }))
    await userEvent.tab()
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus()
  })
})

describe("PhotoDrop screen reader (A4)", () => {
  it.each(Object.keys(STATES))("%s has no axe violations", async (state) => {
    const { container } = render(<Tile {...STATES[state]} />)
    await checkA11y(container)
  })

  it("the input is described by the hint and the consumer's describedBy, and passes invalid and required", () => {
    const { container } = render(
      <>
        <Tile describedBy="photo-error" invalid required />
        <p id="photo-error">Add a photo.</p>
      </>
    )
    const el = input(container)!
    const ids = el.getAttribute("aria-describedby")!.split(" ")
    expect(ids).toContain(container.querySelector(".hint")!.id)
    expect(ids).toContain("photo-error")
    expect(el).toHaveAttribute("aria-invalid", "true")
    expect(el).toHaveAttribute("aria-required", "true")
    expect(zone(container)).toHaveAttribute("data-invalid")
  })

  it("leaves aria-invalid and aria-required off by default", () => {
    const { container } = render(<Tile />)
    expect(input(container)).not.toHaveAttribute("aria-invalid")
    expect(input(container)).not.toHaveAttribute("aria-required")
  })
})

/** The CSS rule bodies whose selector matches `pattern`. */
const rules = (source: string, pattern: RegExp) =>
  [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => pattern.test(m[1]!)).map((m) => m[2]!)

describe("PhotoDrop CSS", () => {
  it("A5: reduced motion stops the march and the sweep; focus still wakes the edge and rings the row", () => {
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
    expect(reduced).toMatch(/\.ants\s*\{\s*animation: none/)
    expect(reduced).toMatch(/\.ring\[data-indeterminate\]\s*\{\s*animation: none/)
    // The awake stroke is outside the media block, so focus changes it with reduced motion too.
    const awake = rules(css.slice(0, css.indexOf("@media (prefers-reduced-motion")), /:focus-visible\)\) \.ants/)
    expect(awake.join()).toContain("stroke: var(--_ink)")
    const ring = rules(css, /\.row:has\(\.input:focus-visible\)\s*$/)
    expect(ring.join()).toContain("outline: var(--focus-ring-width")
  })

  it("A6: animation is CSS only; no motion dependency anywhere", () => {
    expect(tsx).not.toMatch(/from ["'](motion|framer-motion)/)
    expect(css).toContain("@keyframes march")
    expect(css).toContain("@keyframes sweep")
    const manifests = [join(ROOT, "package.json")]
    for (const dir of readdirSync(join(ROOT, "packages"))) {
      const p = join(ROOT, "packages", dir, "package.json")
      if (existsSync(p)) manifests.push(p)
    }
    for (const p of manifests) {
      const pkg = JSON.parse(readFileSync(p, "utf8"))
      for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
        expect(Object.keys(pkg[field] ?? {}), `${p} ${field}`).not.toContain("motion")
        expect(Object.keys(pkg[field] ?? {}), `${p} ${field}`).not.toContain("framer-motion")
      }
    }
  })

  it("A7: glass is off by default: every backdrop-filter reads the glass layer's switch, and the tile has none", () => {
    const filters = [...css.matchAll(/backdrop-filter:\s*([^;]+);/g)].map((m) => m[1]!.trim())
    expect(filters.length).toBeGreaterThan(0)
    for (const value of filters) expect(value).toBe("var(--glass-on-control-blur, none)")
    expect(rules(css, /^\s*\.zone\s*$/).join()).not.toContain("backdrop-filter")
  })

  it("A8: no raw colour or duration outside a var() fallback", () => {
    const bare = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/var\([^()]*(\([^()]*\)[^()]*)*\)/g, "")
    expect(bare).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(bare).not.toMatch(/rgba?\(/)
    expect(bare).not.toMatch(/\d+(\.\d+)?m?s\b/)
  })
})
