import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest"
import { Spinner, type SpinnerOrbState } from "../spinner"

const ORB_STATES: SpinnerOrbState[] = [
  "working",
  "searching",
  "solving",
  "listening",
  "connecting",
  "weaving",
  "composing",
  "breathing",
  "shaping",
]

/** A 2D context that accepts every draw call — jsdom ships no canvas. */
function fakeContext() {
  const ctx: Record<string | symbol, unknown> = {}
  return new Proxy(ctx, {
    get: (target, prop) =>
      prop in target
        ? target[prop]
        : prop === "getImageData"
          ? () => ({ data: new Uint8ClampedArray([255, 255, 255, 255]) })
          : () => {},
    set: (target, prop, value) => {
      target[prop] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
}

function mockReducedMotion(reduced: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: reduced && query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList
  )
}

describe("Spinner", () => {
  it("renders without a label (decorative — aria-hidden)", () => {
    const { container } = render(<Spinner />)
    const root = container.querySelector('[data-slot="spinner"]')
    expect(root).not.toBeNull()
    expect(root).toHaveAttribute("aria-hidden", "true")
    expect(root).not.toHaveAttribute("role")
  })

  it("renders role=status and visually-hidden text when label is provided", () => {
    render(<Spinner label="Loading results" />)
    const status = screen.getByRole("status")
    expect(status).not.toBeNull()
    expect(status).toHaveAttribute("aria-label", "Loading results")
    expect(screen.getByText("Loading results")).toBeInTheDocument()
  })

  it("applies data-slot to the root", () => {
    const { container } = render(<Spinner />)
    const root = container.querySelector('[data-slot="spinner"]')
    expect(root).not.toBeNull()
  })

  it("forwards ref to the root span", () => {
    const ref = { current: null as HTMLSpanElement | null }
    render(<Spinner ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("SPAN")
  })

  it("forwards className to the root", () => {
    const { container } = render(<Spinner className="custom-class" />)
    const root = container.querySelector('[data-slot="spinner"]')
    expect(root).toHaveClass("custom-class")
  })

  describe("sizes", () => {
    it.each(["xs", "sm", "md"] as const)("renders %s size", (size) => {
      const { container } = render(<Spinner size={size} />)
      expect(
        container.querySelector(`[data-size="${size}"]`)
      ).not.toBeNull()
    })

    it("defaults to md size", () => {
      const { container } = render(<Spinner />)
      expect(container.querySelector('[data-size="md"]')).not.toBeNull()
    })
  })

  describe("tones", () => {
    it.each(["default", "primary"] as const)("renders %s tone", (tone) => {
      const { container } = render(<Spinner tone={tone} />)
      expect(
        container.querySelector(`[data-tone="${tone}"]`)
      ).not.toBeNull()
    })

    it("defaults to default tone", () => {
      const { container } = render(<Spinner />)
      expect(container.querySelector('[data-tone="default"]')).not.toBeNull()
    })
  })

  it("does not render visually-hidden text without label", () => {
    const { container } = render(<Spinner />)
    // No .srOnly span should be present when no label is provided
    const root = container.querySelector('[data-slot="spinner"]')
    expect(root?.children.length).toBe(0)
  })

  describe("ring (default variant)", () => {
    it("renders the same markup with or without variant=\"ring\"", () => {
      const a = render(<Spinner size="sm" tone="primary" label="Loading" />)
      const b = render(
        <Spinner variant="ring" size="sm" tone="primary" label="Loading" />
      )
      expect(a.container.innerHTML).toBe(b.container.innerHTML)
      expect(a.container.querySelector("canvas")).toBeNull()
      expect(a.container.querySelector("[data-variant]")).toBeNull()
    })
  })

  describe("orb variant", () => {
    beforeEach(() => {
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
        fakeContext as unknown as HTMLCanvasElement["getContext"]
      )
      // The orb starts its loop when it scrolls into view — report it visible.
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(private cb: IntersectionObserverCallback) {}
          observe() {
            this.cb(
              [{ isIntersecting: true } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver
            )
          }
          disconnect() {}
          unobserve() {}
        }
      )
    })

    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    })

    it.each(ORB_STATES)("renders the %s state", (state) => {
      const { container } = render(<Spinner variant="orb" orb={state} />)
      const root = container.querySelector('[data-slot="spinner"]')
      expect(root).toHaveAttribute("data-variant", "orb")
      expect(root).toHaveAttribute("data-orb", state)
      expect(root?.querySelector("canvas")).not.toBeNull()
    })

    it("defaults to the working state at md", () => {
      const { container } = render(<Spinner variant="orb" />)
      const root = container.querySelector('[data-slot="spinner"]')
      expect(root).toHaveAttribute("data-orb", "working")
      expect(root).toHaveAttribute("data-size", "md")
    })

    it.each([
      ["xs", 20],
      ["sm", 32],
      ["md", 64],
    ] as const)("sizes %s to a %ipx canvas and matching box", (size, px) => {
      const { container } = render(<Spinner variant="orb" size={size} />)
      const root = container.querySelector<HTMLElement>('[data-slot="spinner"]')
      const canvas = root?.querySelector("canvas")
      expect(root?.style.width).toBe(`${px}px`)
      expect(root?.style.height).toBe(`${px}px`)
      expect(canvas?.style.width).toBe(`${px}px`)
      expect(canvas?.style.height).toBe(`${px}px`)
    })

    it("is decorative without a label", () => {
      const { container } = render(<Spinner variant="orb" />)
      const root = container.querySelector('[data-slot="spinner"]')
      expect(root).toHaveAttribute("aria-hidden", "true")
      expect(root).not.toHaveAttribute("role")
      expect(screen.queryByRole("img")).toBeNull()
    })

    it("holds the label contract: role=status, aria-label, visually-hidden text", () => {
      render(<Spinner variant="orb" label="Rendering share card" />)
      const status = screen.getByRole("status")
      expect(status).toHaveAttribute("aria-label", "Rendering share card")
      expect(status).toHaveAttribute("data-variant", "orb")
      expect(screen.getByText("Rendering share card")).toBeInTheDocument()
      // The canvas is hidden so only the status is announced, not an img too.
      expect(status.querySelector("canvas")).toHaveAttribute("aria-hidden", "true")
      expect(screen.queryByRole("img")).toBeNull()
    })

    it("forwards ref, className and style to the root span", () => {
      const ref = { current: null as HTMLSpanElement | null }
      const { container } = render(
        <Spinner
          ref={ref}
          variant="orb"
          className="custom-class"
          style={{ margin: 4 }}
        />
      )
      const root = container.querySelector<HTMLElement>('[data-slot="spinner"]')
      expect(ref.current).toBe(root)
      expect(root).toHaveClass("custom-class")
      expect(root?.style.margin).toBe("4px")
      expect(root?.style.width).toBe("64px")
    })

    /**
     * Queue rAF callbacks instead of running them, then drain one round: a
     * live animation loop re-requests a frame, a still frame does not.
     * (thinking-orbs reads reduced-motion after mount, so the first commit
     * may request one frame before the still frame cancels it.)
     */
    function framesRequestedAfterMount(orb: SpinnerOrbState) {
      const queued: FrameRequestCallback[] = []
      const raf = vi
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation((cb) => queued.push(cb))
      const { container } = render(<Spinner variant="orb" orb={orb} />)
      raf.mockClear()
      queued.splice(0).forEach((cb) => cb(performance.now()))
      return { container, requested: raf.mock.calls.length }
    }

    it("renders a still frame under reduced motion", () => {
      mockReducedMotion(true)
      const { container, requested } = framesRequestedAfterMount("weaving")
      // Painted (the backing store was sized), but no loop keeps running.
      expect(container.querySelector("canvas")?.width).toBeGreaterThan(0)
      expect(requested).toBe(0)
    })

    it("animates when motion is allowed", () => {
      mockReducedMotion(false)
      const { requested } = framesRequestedAfterMount("weaving")
      expect(requested).toBeGreaterThan(0)
    })
  })
})
