import * as React from "react"
import { render, screen, within } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { DocFrame, type DocsManifest } from "../doc-frame"
import { checkA11y } from "../../../../test-utils/a11y"

// A multi-product manifest: a pinned Shared set, two product groups (Artist,
// Pro) run as an accordion, plus a slot-less doc that falls into the Appendix.
// One Shared entry is a static `.html` doc; one Artist entry is a clean route —
// exercising active-state for both a Next route and a static doc.
const manifest: DocsManifest = {
  brand: "Blacklight",
  products: [{ id: "artist" }, { id: "pro" }],
  docs: [
    { order: 1, label: "Charter", href: "/docs/charter.html", kind: "local-html", group: "Shared" },
    { order: 6, label: "Data", href: "/docs/data.html", kind: "local-html", group: "Shared" },
    { order: 2, label: "Journeys", href: "/docs/artist/journeys", kind: "route", scope: ["artist"], group: "Artist" },
    { order: 3, label: "Screens", href: "/docs/artist/screens", kind: "route", scope: ["artist"], group: "Artist" },
    { order: 2, label: "Pro Journeys", href: "/docs/pro/journeys", kind: "route", scope: ["pro"], group: "Pro" },
    { order: 5, label: "Pro States", href: "/docs/pro/states", kind: "route", scope: ["pro"], group: "Pro" },
    { order: 11, label: "Q3 Audit", href: "/docs/q3-audit.html", kind: "local-html" },
  ],
}

describe("DocFrame — structure", () => {
  it("renders the frame, the nav slot, and the content wrapper", () => {
    render(
      <DocFrame manifest={manifest} currentPath="/docs/artist/screens">
        <h1>Artist — Screen Inventory</h1>
      </DocFrame>
    )
    const frame = screen.getByRole("banner").closest('[data-slot="doc-frame"]')
    expect(frame).not.toBeNull()

    // The DocNav is rendered in the nav slot.
    const navSlot = document.querySelector('[data-slot="doc-frame-nav"]')
    expect(navSlot).not.toBeNull()
    expect(within(navSlot as HTMLElement).getByRole("navigation")).toHaveAttribute(
      "data-slot",
      "doc-nav"
    )

    // The children land in the content wrapper.
    const content = document.querySelector('[data-slot="doc-frame-content"]')
    expect(content).not.toBeNull()
    expect(
      within(content as HTMLElement).getByRole("heading", { name: /Screen Inventory/ })
    ).toBeInTheDocument()
  })

  it("renders the header as a sticky banner landmark", () => {
    render(
      <DocFrame manifest={manifest} currentPath="/docs/charter.html">
        <p>Body</p>
      </DocFrame>
    )
    const header = screen.getByRole("banner")
    expect(header).toHaveAttribute("data-slot", "doc-frame-header")
    // The sticky chrome carries the `chrome` module class (position: sticky).
    expect(header.className).toContain("chrome")
  })
})

describe("DocFrame — theme tokens", () => {
  it("applies the given theme class across ≥2 themes", () => {
    const { rerender } = render(
      <DocFrame manifest={manifest} currentPath="/docs/charter.html" theme="strata-theme">
        <p>Body</p>
      </DocFrame>
    )
    let frame = document.querySelector('[data-slot="doc-frame"]') as HTMLElement
    expect(frame.className).toContain("strata-theme")

    rerender(
      <DocFrame manifest={manifest} currentPath="/docs/charter.html" theme="aqua-theme">
        <p>Body</p>
      </DocFrame>
    )
    frame = document.querySelector('[data-slot="doc-frame"]') as HTMLElement
    expect(frame.className).toContain("aqua-theme")
    expect(frame.className).not.toContain("strata-theme")
  })
})

describe("DocFrame — logo slot", () => {
  it("renders an explicit SVG-file logo (<img>) instead of the wordmark", () => {
    render(
      <DocFrame
        manifest={manifest}
        currentPath="/docs/charter.html"
        logo={<img src="/logo.svg" alt="Blacklight" data-testid="file-logo" />}
      >
        <p>Body</p>
      </DocFrame>
    )
    expect(screen.getByTestId("file-logo")).toBeInTheDocument()
    // The default text wordmark is not rendered when a logo is supplied.
    const brandSlot = document.querySelector('[data-slot="doc-frame-brand-slot"]')
    expect(within(brandSlot as HTMLElement).queryByText("Blacklight", { selector: "span" })).toBeNull()
  })

  it("renders an inline-SVG / component logo", () => {
    function AnimatedMark() {
      return (
        <svg data-testid="inline-logo" viewBox="0 0 10 10" role="img" aria-label="Acme">
          <rect width="10" height="10" />
        </svg>
      )
    }
    render(
      <DocFrame manifest={manifest} currentPath="/docs/charter.html" logo={<AnimatedMark />}>
        <p>Body</p>
      </DocFrame>
    )
    expect(screen.getByTestId("inline-logo")).toBeInTheDocument()
  })

  it("falls back to the manifest brand text (mode-aware) when no logo is given", () => {
    render(
      <DocFrame manifest={manifest} currentPath="/docs/charter.html">
        <p>Body</p>
      </DocFrame>
    )
    const brandSlot = document.querySelector('[data-slot="doc-frame-brand-slot"]') as HTMLElement
    // The text wordmark renders...
    expect(within(brandSlot).getByText("Blacklight")).toBeInTheDocument()
    // ...and the resting state is the text (no theme-logo upgrade), so the
    // mode-aware theme-logo layer sits alongside it, aria-hidden from the name.
    const brand = brandSlot.querySelector('[data-slot="doc-frame-brand"]') as HTMLElement
    expect(brand).not.toHaveAttribute("data-theme-logo")
    // The theme-logo layer is present for the CSS --brand-logo resolution.
    expect(within(brand).getByRole("img", { name: "Blacklight" })).toBeInTheDocument()
  })
})

describe("DocFrame — composition over routes and static docs", () => {
  it("resolves active-state for a Next route href", () => {
    render(
      <DocFrame manifest={manifest} currentPath="/docs/artist/screens">
        <p>Body</p>
      </DocFrame>
    )
    expect(screen.getByRole("link", { name: /Screens/ })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })

  it("resolves active-state for a static .html href", () => {
    render(
      <DocFrame manifest={manifest} currentPath="/docs/charter.html">
        <p>Body</p>
      </DocFrame>
    )
    expect(screen.getByRole("link", { name: /Charter/ })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })
})

describe("DocFrame — product accordion", () => {
  it("derives the open product from the route and collapses the sibling", () => {
    render(
      <DocFrame manifest={manifest} currentPath="/docs/artist/screens">
        <p>Body</p>
      </DocFrame>
    )
    const frame = document.querySelector('[data-slot="doc-frame"]')
    expect(frame).toHaveAttribute("data-active-product", "artist")

    // Artist is open → its pills render.
    expect(screen.getByRole("link", { name: /Journeys/ })).toBeInTheDocument()
    // Pro is collapsed → a header chip, no Pro pills.
    expect(screen.queryByRole("link", { name: /Pro States/ })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Pro/ })).toBeInTheDocument()
    // Shared stays pinned regardless of the accordion.
    expect(screen.getByRole("link", { name: /Charter/ })).toBeInTheDocument()
  })

  it("honours an explicit activeProduct prop", () => {
    render(
      <DocFrame manifest={manifest} currentPath="/docs/charter.html" activeProduct="pro">
        <p>Body</p>
      </DocFrame>
    )
    const frame = document.querySelector('[data-slot="doc-frame"]')
    expect(frame).toHaveAttribute("data-active-product", "pro")
    expect(screen.getByRole("link", { name: /Pro States/ })).toBeInTheDocument()
  })
})

describe("DocFrame — single-product mode", () => {
  const singleManifest: DocsManifest = {
    brand: "Veronica",
    docs: [
      { order: 0, label: "Index", href: "/docs", group: "Planning" },
      { order: 2, label: "CUJs", href: "/docs/cujs", group: "Planning" },
      { order: 3, label: "Screens", href: "/docs/screens", group: "Planning" },
    ],
  }

  it("degrades to no accordion when there is no product roster", () => {
    render(
      <DocFrame manifest={singleManifest} currentPath="/docs/cujs">
        <p>Body</p>
      </DocFrame>
    )
    const frame = document.querySelector('[data-slot="doc-frame"]')
    // No products → no active-product attribute.
    expect(frame).not.toHaveAttribute("data-active-product")
    // The single grouped row renders with the active pill resolved.
    expect(screen.getByText("Planning")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /CUJs/ })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })
})

describe("DocFrame — accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <DocFrame manifest={manifest} currentPath="/docs/artist/screens">
        <main>
          <h1>Artist — Screen Inventory</h1>
          <p>Doc body content.</p>
        </main>
      </DocFrame>
    )
    await checkA11y(container)
  })
})
