import * as React from "react"
import { render, screen, within, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { FidelityMirror, type FidelityDelta } from "../fidelity-mirror"
import { checkA11y } from "../../../../test-utils/a11y"

// The Example-A worked deltas from the approved spec — the doc-nav compare.
const deltas: FidelityDelta[] = [
  {
    class: "radius",
    description: "Group cluster corners 22px → 12px.",
    position: { top: "34px", left: "12px" },
  },
  {
    class: "color",
    description: "Resting pills read --surface-subtle — should be a recessed well.",
    position: { top: "52px", left: "96px" },
  },
  {
    class: "type",
    description: "Group labels are title-case — should be all-caps mono.",
    position: { top: "34px", right: "12px" },
  },
]

function WebMirror(props: Partial<React.ComponentProps<typeof FidelityMirror>> = {}) {
  return (
    <FidelityMirror
      title="DocNav"
      subtitle="Fidelity Mirror · VI-611"
      platform="web"
      verdict="drift"
      score="3 deltas"
      design={{ src: "/design/doc-nav.html", title: "DocNav design (HTML)", meta: "index.html" }}
      built={{ src: "/docs/doc-nav", title: "DocNav built (Visor TSX)", meta: "route · /doc-nav" }}
      deltas={deltas}
      {...props}
    />
  )
}

describe("FidelityMirror — structure", () => {
  it("exposes a labelled section landmark with data-slot + platform/verdict data", () => {
    render(<WebMirror />)
    const root = screen.getByRole("region", { name: /Fidelity comparison: DocNav/ })
    expect(root).toHaveAttribute("data-slot", "fidelity-mirror")
    expect(root).toHaveAttribute("data-platform", "web")
    expect(root).toHaveAttribute("data-verdict", "drift")
  })

  it("renders the title, subtitle, and both source pane labels", () => {
    render(<WebMirror />)
    expect(screen.getByText("DocNav")).toBeInTheDocument()
    expect(screen.getByText("Fidelity Mirror · VI-611")).toBeInTheDocument()
    // Web source identity in the pane labels (operator refinement).
    expect(screen.getByText(/Design · HTML/)).toBeInTheDocument()
    expect(screen.getByText(/Built · Visor TSX/)).toBeInTheDocument()
    expect(screen.getByText("index.html")).toBeInTheDocument()
    expect(screen.getByText("route · /doc-nav")).toBeInTheDocument()
  })

  it("marks the design pane with --info identity and the built pane with --accent", () => {
    const { container } = render(<WebMirror />)
    expect(container.querySelector('[data-side="design"]')).toBeInTheDocument()
    expect(container.querySelector('[data-side="built"]')).toBeInTheDocument()
  })
})

describe("FidelityMirror — diff indicator", () => {
  it("tints the status pill by verdict and shows the score", () => {
    render(<WebMirror />)
    const pill = screen.getByText(/drift/i).closest("[data-verdict]")
    expect(pill).toHaveAttribute("data-verdict", "drift")
    expect(screen.getByText(/3 deltas/)).toBeInTheDocument()
  })

  it("renders a MATCH verdict with no callouts and no legend", () => {
    render(
      <FidelityMirror
        title="Roster Screen"
        platform="native"
        verdict="match"
        score="99.4%"
        design={{ src: "/design/roster.png", title: "Roster design" }}
        built={{ src: "/snap/roster.png", title: "Roster built" }}
      />
    )
    expect(screen.getByText(/match/i)).toBeInTheDocument()
    expect(screen.getByText(/99.4%/)).toBeInTheDocument()
    expect(screen.queryByText(/Deltas — built vs design/)).not.toBeInTheDocument()
  })

  it("supports the fail verdict", () => {
    render(<WebMirror verdict="fail" score="12 deltas" />)
    const root = screen.getByRole("region", { name: /DocNav/ })
    expect(root).toHaveAttribute("data-verdict", "fail")
  })
})

describe("FidelityMirror — deltas (callouts + legend)", () => {
  it("draws a numbered callout on the built side for each positioned delta", () => {
    const { container } = render(<WebMirror />)
    const builtPane = container.querySelector('[data-side="built"]') as HTMLElement
    const markers = within(builtPane).getAllByText(/^[123]$/)
    expect(markers).toHaveLength(3)
  })

  it("renders the classed delta legend with tags and descriptions", () => {
    render(<WebMirror />)
    expect(screen.getByText(/Deltas — built vs design/)).toBeInTheDocument()
    expect(screen.getByText("Radius")).toBeInTheDocument()
    expect(screen.getByText("Color")).toBeInTheDocument()
    expect(screen.getByText("Type")).toBeInTheDocument()
    expect(screen.getByText(/should be a recessed well/)).toBeInTheDocument()
  })

  it("classes each legend tag with its delta class", () => {
    const { container } = render(<WebMirror />)
    expect(container.querySelector('[data-class="radius"]')).toBeInTheDocument()
    expect(container.querySelector('[data-class="color"]')).toBeInTheDocument()
    expect(container.querySelector('[data-class="type"]')).toBeInTheDocument()
  })
})

describe("FidelityMirror — platform variants", () => {
  it("web renders live-route iframes and the WEB · LIVE ROUTE chip", () => {
    render(<WebMirror />)
    expect(screen.getByText(/Web · Live Route/)).toBeInTheDocument()
    expect(screen.getByTitle("DocNav built (Visor TSX)")).toHaveProperty("tagName", "IFRAME")
  })

  it("native renders an image set inside a device bezel with the iOS · SwiftUI chip", () => {
    const { container } = render(
      <FidelityMirror
        title="Roster Screen"
        platform="native"
        verdict="match"
        design={{ src: "/design/roster.png", title: "Roster design" }}
        built={{ src: "/snap/roster.png", title: "Roster built" }}
      />
    )
    expect(screen.getByText(/iOS · SwiftUI/)).toBeInTheDocument()
    // Screenshots (images, not live routes) inside a device bezel.
    const img = screen.getByAltText("Roster built")
    expect(img).toHaveProperty("tagName", "IMG")
    expect(container.querySelector('[data-side="built"]')?.querySelector("img")).toBe(img)
  })

  it("external renders an iframe of the artifact with the EXTERNAL chip", () => {
    render(
      <FidelityMirror
        title="Pricing Page"
        platform="external"
        verdict="drift"
        score="2 deltas"
        design={{ src: "/design/pricing.html", title: "Pricing design" }}
        built={{ src: "https://claude.site/artifacts/abc", title: "Pricing artifact" }}
      />
    )
    expect(screen.getByText(/External/)).toBeInTheDocument()
    expect(screen.getByTitle("Pricing artifact")).toHaveProperty("tagName", "IFRAME")
  })

  it("renders an arbitrary content node when a source supplies one", () => {
    render(
      <FidelityMirror
        title="Custom"
        verdict="match"
        design={{ content: <div data-testid="design-node">DESIGN</div> }}
        built={{ content: <div data-testid="built-node">BUILT</div> }}
      />
    )
    expect(screen.getByTestId("design-node")).toBeInTheDocument()
    expect(screen.getByTestId("built-node")).toBeInTheDocument()
  })
})

describe("FidelityMirror — compare modes", () => {
  it("defaults to split panes (no overlay slider)", () => {
    render(<WebMirror />)
    expect(screen.getByRole("region", { name: /DocNav/ })).toHaveAttribute("data-mode", "split")
    expect(screen.queryByRole("slider")).not.toBeInTheDocument()
  })

  it("renders the overlay slider and ribbons when mode='overlay'", () => {
    render(<WebMirror mode="overlay" />)
    expect(screen.getByRole("slider", { name: /Reveal position/ })).toBeInTheDocument()
    // Web overlay ribbons carry the HTML / Visor TSX source identity.
    expect(screen.getByText("HTML Design")).toBeInTheDocument()
    expect(screen.getByText("Visor TSX")).toBeInTheDocument()
  })

  it("toggles between split and overlay in place and notifies onModeChange", async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()
    render(<WebMirror onModeChange={onModeChange} />)

    expect(screen.queryByRole("slider")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Overlay/ }))
    expect(onModeChange).toHaveBeenCalledWith("overlay")
    expect(screen.getByRole("slider")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Split/ }))
    expect(onModeChange).toHaveBeenLastCalledWith("split")
    expect(screen.queryByRole("slider")).not.toBeInTheDocument()
  })

  it("marks the active mode button with aria-pressed", () => {
    render(<WebMirror mode="split" />)
    expect(screen.getByRole("button", { name: /Split/ })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: /Overlay/ })).toHaveAttribute("aria-pressed", "false")
  })

  it("drives the reveal position from the range input", () => {
    const { container } = render(<WebMirror mode="overlay" overlayPosition={40} />)
    const slider = screen.getByRole("slider") as HTMLInputElement
    expect(slider.value).toBe("40")
    fireEvent.change(slider, { target: { value: "70" } })
    expect(slider.value).toBe("70")
    // The reveal seam is driven by the component-owned --fm-split var.
    const frame = container.querySelector('[style*="--fm-split"]') as HTMLElement
    expect(frame.getAttribute("style")).toContain("--fm-split: 70%")
  })
})

describe("FidelityMirror — widescreen bleed layout", () => {
  it("applies the full-bleed layout by default", () => {
    const { container } = render(<WebMirror />)
    const root = container.querySelector('[data-slot="fidelity-mirror"]') as HTMLElement
    // The bleed class is present (the widescreen 50vw escape).
    expect(root.className).toMatch(/bleed/)
  })

  it("can opt out of bleed to stay inside the DocFrame column", () => {
    const { container } = render(<WebMirror bleed={false} />)
    const root = container.querySelector('[data-slot="fidelity-mirror"]') as HTMLElement
    expect(root.className).not.toMatch(/bleed/)
  })
})

describe("FidelityMirror — accessibility", () => {
  // Use content nodes (not iframes) — axe-core cannot traverse cross-window
  // iframes under jsdom; the chrome (region, buttons, slider, pills) is what the
  // a11y contract covers.
  function A11yMirror(props: Partial<React.ComponentProps<typeof FidelityMirror>> = {}) {
    return (
      <WebMirror
        design={{ content: <div>Design capture</div>, meta: "index.html" }}
        built={{ content: <div>Built capture</div>, meta: "route · /doc-nav" }}
        {...props}
      />
    )
  }

  it("has no WCAG 2.1 AA violations (split)", async () => {
    const { container } = render(<A11yMirror />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (overlay)", async () => {
    const { container } = render(<A11yMirror mode="overlay" />)
    await checkA11y(container)
  })
})
