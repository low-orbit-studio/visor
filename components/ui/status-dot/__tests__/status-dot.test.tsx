import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { StatusDot, type StatusDotTone } from "../status-dot"

const TONES: StatusDotTone[] = ["mint", "warn", "muted", "danger", "info"]

describe("StatusDot", () => {
  it("renders the data-slot marker", () => {
    const { container } = render(<StatusDot />)
    expect(container.querySelector('[data-slot="status-dot"]')).not.toBeNull()
  })

  it("defaults tone to muted", () => {
    const { container } = render(<StatusDot />)
    const dot = container.querySelector('[data-slot="status-dot"]')
    expect(dot).toHaveAttribute("data-tone", "muted")
  })

  it("renders each tone via data-tone", () => {
    for (const tone of TONES) {
      const { container, unmount } = render(<StatusDot tone={tone} />)
      const dot = container.querySelector('[data-slot="status-dot"]')
      expect(dot).toHaveAttribute("data-tone", tone)
      unmount()
    }
  })

  it("is decorative by default (aria-hidden, no role)", () => {
    const { container } = render(<StatusDot tone="mint" />)
    const dot = container.querySelector('[data-slot="status-dot"]')
    expect(dot).toHaveAttribute("aria-hidden", "true")
    expect(dot).not.toHaveAttribute("role")
    expect(dot).not.toHaveAttribute("aria-label")
  })

  it("becomes a labeled image when aria-label is supplied", () => {
    const { container } = render(
      <StatusDot tone="danger" aria-label="Service down" />
    )
    const dot = container.querySelector('[data-slot="status-dot"]')
    expect(dot).toHaveAttribute("aria-label", "Service down")
    expect(dot).toHaveAttribute("role", "img")
    expect(dot).not.toHaveAttribute("aria-hidden")
  })

  it("forwards className and HTML attributes", () => {
    const { container } = render(
      <StatusDot tone="info" className="custom" id="dot-1" title="Info" />
    )
    const dot = container.querySelector('[data-slot="status-dot"]')
    expect(dot).toHaveAttribute("id", "dot-1")
    expect(dot).toHaveAttribute("title", "Info")
    expect(dot).toHaveClass("custom")
  })

  it("forwards ref to the underlying span", () => {
    const ref = { current: null as HTMLSpanElement | null }
    render(<StatusDot ref={ref} tone="warn" />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("SPAN")
  })
})
